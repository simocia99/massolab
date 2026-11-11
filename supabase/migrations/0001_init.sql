-- =============================================================================
-- MassoLab — schema iniziale per Supabase
-- Eseguire una sola volta (SQL Editor -> New query -> incolla -> Run).
-- Lo script è idempotente: rieseguirlo non cancella dati.
--
-- Ogni "entità" del sito è una tabella con la stessa forma:
--   id uuid, created_date, updated_date, created_by, data jsonb
-- I campi dell'entità vivono dentro "data" (vedi src/api/supabaseAdapter.js).
-- Proprietario di un record cliente:
--   appointment, intake_form, client_account, manual_patient -> data->>'email'
--   tutte le altre                                            -> data->>'client_email'
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. Elenco tabelle (usato da loop, whitelist di merge_record e realtime)
-- -----------------------------------------------------------------------------
create or replace function public.app_tables()
returns text[]
language sql
immutable
as $$
  select array[
    'appointment', 'automation_log', 'automation_settings', 'blog_post',
    'client_account', 'exercise', 'exercise_program', 'guided_booking',
    'health_data', 'intake_form', 'manual_patient', 'message',
    'patient_document', 'pricing_settings', 'review', 'therapist_settings',
    'treatment_package', 'treatment_progress', 'treatment_report'
  ]::text[]
$$;

-- -----------------------------------------------------------------------------
-- 1. Amministratori e identità del chiamante
-- -----------------------------------------------------------------------------
create table if not exists public.admins (
  email text primary key
);
alter table public.admins enable row level security;

insert into public.admins (email)
values ('massolab.simoneciacchi@gmail.com')
on conflict (email) do nothing;

-- Email (minuscola) dell'utente loggato, SOLO se l'indirizzo è confermato.
-- Così nessuno può "diventare" un altro registrandosi con la sua email
-- (richiede "Confirm email" attivo in Authentication -> Providers -> Email).
create or replace function public.auth_email()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select lower(u.email)
  from auth.users u
  where u.id = auth.uid()
    and u.email_confirmed_at is not null
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins a
    where lower(a.email) = public.auth_email()
  )
$$;

drop policy if exists admins_self_read on public.admins;
create policy admins_self_read on public.admins
  for select to authenticated
  using ((select public.is_admin()));

-- -----------------------------------------------------------------------------
-- 2. Tabelle, trigger updated_date, indici, permessi base, RLS + accesso admin
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_date()
returns trigger
language plpgsql
as $$
begin
  new.updated_date := now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array public.app_tables() loop
    execute format($f$
      create table if not exists public.%I (
        id uuid primary key default gen_random_uuid(),
        created_date timestamptz default now(),
        updated_date timestamptz default now(),
        created_by text default auth.email(),
        data jsonb not null default '{}'
      )$f$, t);

    execute format('drop trigger if exists set_updated_date on public.%I', t);
    execute format('create trigger set_updated_date before update on public.%I
                    for each row execute function public.set_updated_date()', t);

    execute format('create index if not exists %I on public.%I using gin (data jsonb_path_ops)',
                   t || '_data_gin', t);
    execute format('create index if not exists %I on public.%I (created_date desc)',
                   t || '_created_idx', t);

    execute format('grant select, insert, update, delete on public.%I to anon, authenticated', t);
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists admin_all on public.%I', t);
    execute format('create policy admin_all on public.%I for all to authenticated
                    using ((select public.is_admin())) with check ((select public.is_admin()))', t);
  end loop;
end
$$;

-- Indici sui campi più interrogati
create index if not exists appointment_date_idx     on public.appointment ((data->>'preferred_date'));
create index if not exists appointment_email_idx    on public.appointment (lower(data->>'email'));
create index if not exists intake_form_email_idx    on public.intake_form (lower(data->>'email'));
create index if not exists client_account_email_idx on public.client_account (lower(data->>'email'));
create index if not exists manual_patient_email_idx on public.manual_patient (lower(data->>'email'));
create index if not exists review_status_idx        on public.review ((data->>'status'), created_date desc);
create index if not exists blog_post_slug_idx       on public.blog_post ((data->>'slug'));
create index if not exists blog_post_status_idx     on public.blog_post ((data->>'status'));
do $$
declare
  t text;
begin
  foreach t in array array['treatment_package', 'treatment_progress', 'treatment_report',
                           'exercise_program', 'patient_document', 'health_data',
                           'message', 'review', 'automation_log', 'guided_booking'] loop
    execute format('create index if not exists %I on public.%I (lower(data->>''client_email''))',
                   t || '_client_email_idx', t);
  end loop;
end
$$;

-- -----------------------------------------------------------------------------
-- 3. Trigger di protezione
-- -----------------------------------------------------------------------------

-- Limita quali chiavi di "data" un cliente (non admin) può modificare.
--   guard_client_update('allow', 'status')   -> solo queste chiavi
--   guard_client_update('deny',  'email')    -> tutte tranne queste
-- Le funzioni security definer (RPC) girano come proprietario e non sono limitate.
create or replace function public.guard_client_update()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  mode text := tg_argv[0];
  keys text[] := tg_argv[1:];
  k text;
begin
  if current_user not in ('anon', 'authenticated') or public.is_admin() then
    return new;
  end if;
  if new.id is distinct from old.id
     or new.created_date is distinct from old.created_date
     or new.created_by is distinct from old.created_by then
    raise exception 'Modifica non consentita' using errcode = '42501';
  end if;
  for k in
    select jsonb_object_keys(old.data)
    union
    select jsonb_object_keys(new.data)
  loop
    if (old.data -> k) is distinct from (new.data -> k) then
      if (mode = 'allow' and not (k = any (keys)))
         or (mode = 'deny' and k = any (keys)) then
        raise exception 'Campo non modificabile: %', k using errcode = '42501';
      end if;
    end if;
  end loop;
  return new;
end;
$$;

drop trigger if exists guard_client_update on public.appointment;
create trigger guard_client_update before update on public.appointment
  for each row execute function public.guard_client_update('allow', 'status');

drop trigger if exists guard_client_update on public.message;
create trigger guard_client_update before update on public.message
  for each row execute function public.guard_client_update('allow', 'read');

drop trigger if exists guard_client_update on public.client_account;
create trigger guard_client_update before update on public.client_account
  for each row execute function public.guard_client_update('deny', 'email', 'password_hash', 'role');

drop trigger if exists guard_client_update on public.health_data;
create trigger guard_client_update before update on public.health_data
  for each row execute function public.guard_client_update('deny', 'client_email');

-- Ogni appuntamento ha un access_token (32 hex) per i link nelle email.
-- Se la pagina non lo invia, lo genera il database.
create or replace function public.appointment_defaults()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Solo 32-64 caratteri esadecimali: un token scelto dal visitatore con
  -- caratteri HTML/URL verrebbe poi inserito nei link delle email.
  if coalesce(new.data->>'access_token', '') !~ '^[0-9a-f]{32,64}$' then
    new.data := new.data || jsonb_build_object(
      'access_token', replace(gen_random_uuid()::text, '-', ''));
  end if;
  return new;
end;
$$;

drop trigger if exists appointment_defaults on public.appointment;
create trigger appointment_defaults before insert on public.appointment
  for each row execute function public.appointment_defaults();

-- ClientAccount: mai password nel profilo; un cliente che "crea" un profilo
-- già esistente (es. creato automaticamente alla registrazione) lo aggiorna.
create or replace function public.client_account_before_insert()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  existing uuid;
begin
  new.data := new.data - 'password_hash' - 'password' - 'role';
  if new.data ? 'email' then
    new.data := new.data || jsonb_build_object('email', lower(trim(new.data->>'email')));
  end if;
  if current_user in ('anon', 'authenticated') and not public.is_admin() then
    select id into existing
    from public.client_account
    where lower(data->>'email') = lower(new.data->>'email')
    limit 1;
    if existing is not null then
      update public.client_account
         set data = data || (new.data - 'email')
       where id = existing;
      return null; -- nessun duplicato
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists client_account_before_insert on public.client_account;
create trigger client_account_before_insert before insert on public.client_account
  for each row execute function public.client_account_before_insert();

-- Profilo ClientAccount creato automaticamente quando l'email viene confermata
-- (registrazione con email+password o Google). I metadati dell'utente servono
-- solo per nome/cognome/telefono: non danno alcun permesso.
create or replace function public.handle_confirmed_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_full text;
  v_first text;
  v_last text;
begin
  if new.email is null or new.email_confirmed_at is null then
    return new;
  end if;
  begin
    if exists (select 1 from public.admins where lower(email) = lower(new.email))
       or exists (select 1 from public.client_account
                  where lower(data->>'email') = lower(new.email)) then
      return new;
    end if;
    v_full := coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '');
    v_first := coalesce(nullif(new.raw_user_meta_data->>'first_name', ''), split_part(v_full, ' ', 1));
    v_last := coalesce(nullif(new.raw_user_meta_data->>'last_name', ''),
                       nullif(trim(substr(v_full, length(split_part(v_full, ' ', 1)) + 2)), ''),
                       '');
    insert into public.client_account (data, created_by)
    values (
      jsonb_build_object(
        'email', lower(new.email),
        'first_name', coalesce(v_first, ''),
        'last_name', v_last,
        'phone', coalesce(new.raw_user_meta_data->>'phone', '')
      ),
      lower(new.email)
    );
  exception when others then
    raise warning 'handle_confirmed_user: %', sqlerrm;
  end;
  return new;
end;
$$;

drop trigger if exists on_auth_user_confirmed on auth.users;
create trigger on_auth_user_confirmed
  after insert or update of email_confirmed_at on auth.users
  for each row execute function public.handle_confirmed_user();

-- Limiti anti-spam sui moduli pubblici (D4). Non valgono per il terapista.
--   appointment / intake_form : max 3 nelle 24 ore per la stessa email, salvo il
--                               cliente loggato (email confermata) che scrive per sé
--   guided_booking / review   : max 5 all'ora per stessa email o stesso telefono;
--                               senza email né telefono: max 30 all'ora in totale
-- SECURITY DEFINER per poter contare anche le righe che il chiamante non vede.
create or replace function public.limit_public_inserts()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text := coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', '');
  v_email text;
  v_phone text;
  n int;
begin
  if v_role not in ('anon', 'authenticated') or public.is_admin() then
    return new;
  end if;

  if tg_table_name in ('appointment', 'intake_form') then
    v_email := lower(trim(coalesce(new.data->>'email', '')));
    if v_email <> '' and v_email = public.auth_email() then
      return new;
    end if;
    if tg_table_name = 'appointment' then
      select count(*) into n from public.appointment
       where lower(data->>'email') = v_email
         and created_date > now() - interval '24 hours';
    else
      select count(*) into n from public.intake_form
       where lower(data->>'email') = v_email
         and created_date > now() - interval '24 hours';
    end if;
    if n >= 3 then
      raise exception 'Troppe richieste per questo indirizzo email. Riprova domani o contatta Simone.'
        using errcode = 'P0001';
    end if;
    return new;
  end if;

  -- guided_booking / review
  v_email := lower(trim(coalesce(new.data->>'client_email', '')));
  v_phone := regexp_replace(coalesce(new.data->>'client_phone', ''), '[^0-9+]', '', 'g');
  if tg_table_name = 'guided_booking' then
    select count(*) into n from public.guided_booking g
     where g.created_date > now() - interval '1 hour'
       and case
             when v_email = '' and v_phone = '' then
               coalesce(g.data->>'client_email', '') = '' and coalesce(g.data->>'client_phone', '') = ''
             else
               (v_email <> '' and lower(g.data->>'client_email') = v_email)
               or (v_phone <> '' and regexp_replace(coalesce(g.data->>'client_phone', ''), '[^0-9+]', '', 'g') = v_phone)
           end;
  else
    select count(*) into n from public.review r
     where r.created_date > now() - interval '1 hour'
       and case
             when v_email = '' then coalesce(r.data->>'client_email', '') = ''
             else lower(r.data->>'client_email') = v_email
           end;
  end if;
  if n >= (case when v_email = '' and v_phone = '' then 30 else 5 end) then
    raise exception 'Troppe richieste. Riprova più tardi.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array['appointment', 'intake_form', 'guided_booking', 'review'] loop
    execute format('drop trigger if exists limit_public_inserts on public.%I', t);
    execute format('create trigger limit_public_inserts before insert on public.%I
                    for each row execute function public.limit_public_inserts()', t);
  end loop;
end
$$;

-- -----------------------------------------------------------------------------
-- 4. Regole di accesso (RLS) per visitatori anonimi e clienti
--    (l'admin ha già accesso completo con la policy admin_all)
-- -----------------------------------------------------------------------------
do $$
declare
  t text;
begin
  -- rimuove le policy non-admin precedenti (rende lo script rieseguibile)
  foreach t in array public.app_tables() loop
    execute format('drop policy if exists public_insert on public.%I', t);
    execute format('drop policy if exists public_read on public.%I', t);
    execute format('drop policy if exists client_read on public.%I', t);
    execute format('drop policy if exists client_insert on public.%I', t);
    execute format('drop policy if exists client_update on public.%I', t);
    execute format('drop policy if exists client_delete on public.%I', t);
  end loop;
end
$$;

-- ---- Inserimento da visitatori (anche non loggati) -------------------------
create policy public_insert on public.appointment
  for insert to anon, authenticated
  with check (coalesce(data->>'status', 'pending') = 'pending');

create policy public_insert on public.review
  for insert to anon, authenticated
  with check (
    data->>'status' = 'pending'
    and coalesce(data->>'rating', '') ~ '^[1-5]$'   -- D9: voto intero 1..5
  );

create policy public_insert on public.intake_form
  for insert to anon, authenticated
  with check (coalesce(data->>'status', 'completed') in ('completed', 'pending'));

create policy public_insert on public.guided_booking
  for insert to anon, authenticated
  with check (true);

-- Messaggi: solo clienti loggati, nella propria conversazione, come "client".
-- (nel sito originale i messaggi esistono solo nell'Area Clienti)
create policy client_insert on public.message
  for insert to authenticated
  with check (
    lower(data->>'client_email') = (select public.auth_email())
    and data->>'sender' = 'client'
  );

-- ---- Lettura pubblica -------------------------------------------------------
create policy public_read on public.blog_post
  for select to anon, authenticated
  using (data->>'status' = 'published');

create policy public_read on public.pricing_settings
  for select to anon, authenticated
  using (true);

create policy public_read on public.therapist_settings
  for select to anon, authenticated
  using (true);

-- Recensioni: NESSUNA lettura diretta (contengono email dei clienti).
-- Le recensioni approvate si leggono con la RPC approved_reviews().
-- TreatmentPackage: pacchetti assegnati ai clienti -> non pubblici.

-- ---- Clienti loggati: i propri record --------------------------------------
create policy client_read on public.appointment
  for select to authenticated
  using (lower(data->>'email') = (select public.auth_email()));

create policy client_update on public.appointment
  for update to authenticated
  using (lower(data->>'email') = (select public.auth_email()))
  with check (
    lower(data->>'email') = (select public.auth_email())
    and data->>'status' = 'cancelled'
  );

create policy client_read on public.intake_form
  for select to authenticated
  using (lower(data->>'email') = (select public.auth_email()));

create policy client_read on public.client_account
  for select to authenticated
  using (lower(data->>'email') = (select public.auth_email()));

create policy client_insert on public.client_account
  for insert to authenticated
  with check (lower(data->>'email') = (select public.auth_email()));

create policy client_update on public.client_account
  for update to authenticated
  using (lower(data->>'email') = (select public.auth_email()))
  with check (lower(data->>'email') = (select public.auth_email()));

create policy client_read on public.treatment_package
  for select to authenticated
  using (lower(data->>'client_email') = (select public.auth_email()));

create policy client_read on public.treatment_progress
  for select to authenticated
  using (lower(data->>'client_email') = (select public.auth_email()));

create policy client_read on public.treatment_report
  for select to authenticated
  using (
    lower(data->>'client_email') = (select public.auth_email())
    and coalesce(data->'visible_to_client', 'true'::jsonb) = 'true'::jsonb
  );

create policy client_read on public.exercise_program
  for select to authenticated
  using (
    lower(data->>'client_email') = (select public.auth_email())
    and coalesce(data->>'status', 'draft') <> 'draft'
  );

create policy client_read on public.patient_document
  for select to authenticated
  using (lower(data->>'client_email') = (select public.auth_email()));

create policy client_read on public.health_data
  for select to authenticated
  using (lower(data->>'client_email') = (select public.auth_email()));

create policy client_insert on public.health_data
  for insert to authenticated
  with check (lower(data->>'client_email') = (select public.auth_email()));

create policy client_update on public.health_data
  for update to authenticated
  using (lower(data->>'client_email') = (select public.auth_email()))
  with check (lower(data->>'client_email') = (select public.auth_email()));

create policy client_delete on public.health_data
  for delete to authenticated
  using (lower(data->>'client_email') = (select public.auth_email()));

create policy client_read on public.message
  for select to authenticated
  using (lower(data->>'client_email') = (select public.auth_email()));

-- il cliente può solo segnare come letti i messaggi del terapista
create policy client_update on public.message
  for update to authenticated
  using (
    lower(data->>'client_email') = (select public.auth_email())
    and data->>'sender' = 'therapist'
  )
  with check (
    lower(data->>'client_email') = (select public.auth_email())
    and data->>'sender' = 'therapist'
  );

-- -----------------------------------------------------------------------------
-- 5. Funzioni RPC (db.functions.invoke(name, payload))
-- -----------------------------------------------------------------------------

-- Orari occupati (senza dati personali) per il calendario prenotazioni.
create or replace function public.booked_slots(p_from text default null, p_to text default null)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'date', a.data->>'preferred_date',
           'time', a.data->>'preferred_time',
           'duration', a.data->'duration',
           'treatment_type', a.data->>'treatment_type',
           'status', a.data->>'status'
         ) order by a.data->>'preferred_date', a.data->>'preferred_time'), '[]'::jsonb)
  from public.appointment a
  where a.data->>'status' in ('pending', 'confirmed')
    and (p_from is null or a.data->>'preferred_date' >= p_from)
    and (p_to is null or a.data->>'preferred_date' <= p_to)
$$;

-- Vista limitata di un appuntamento, solo con id + token corretti.
create or replace function public.appointment_by_token(p_id uuid, p_token text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
           'id', a.id,
           'first_name', a.data->>'first_name',
           'treatment_type', a.data->>'treatment_type',
           'preferred_date', a.data->>'preferred_date',
           'preferred_time', a.data->>'preferred_time',
           'status', a.data->>'status',
           'client_confirmed', coalesce((a.data->>'client_confirmed')::boolean, false),
           'email', a.data->>'email'
         )
  from public.appointment a
  where a.id = p_id
    and coalesce(length(p_token), 0) >= 32
    and a.data->>'access_token' = p_token
$$;

-- Conferma / annulla da link email. Solo pending/confirmed -> confirmed/cancelled.
create or replace function public.appointment_respond(p_id uuid, p_token text, p_action text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  new_status text;
  cur text;
begin
  new_status := case p_action
                  when 'confirm' then 'confirmed'
                  when 'cancel' then 'cancelled'
                end;
  if new_status is null then
    raise exception 'Azione non valida' using errcode = '22023';
  end if;

  select a.data->>'status' into cur
  from public.appointment a
  where a.id = p_id
    and coalesce(length(p_token), 0) >= 32
    and a.data->>'access_token' = p_token
  for update;

  if not found then
    return null;
  end if;

  -- D3: il link con token NON approva la prenotazione. "confirm" registra solo
  -- la presenza del cliente (client_confirmed); lo stato lo decide il terapista.
  if p_action = 'confirm' and cur in ('pending', 'confirmed') then
    update public.appointment
       set data = data || jsonb_build_object('client_confirmed', true,
                                             'client_confirmed_at', now())
     where id = p_id;
  elsif p_action = 'cancel' and cur in ('pending', 'confirmed') then
    update public.appointment
       set data = data || jsonb_build_object('status', 'cancelled')
     where id = p_id;
  end if;

  return (
    select jsonb_build_object(
             'id', a.id,
             'first_name', a.data->>'first_name',
             'treatment_type', a.data->>'treatment_type',
             'preferred_date', a.data->>'preferred_date',
             'preferred_time', a.data->>'preferred_time',
             'status', a.data->>'status',
             'client_confirmed', coalesce((a.data->>'client_confirmed')::boolean, false),
             'email', a.data->>'email'
           )
    from public.appointment a
    where a.id = p_id
  );
end;
$$;

-- Valutazione post-seduta (dolore iniziale/finale) da link email.
create or replace function public.submit_session_feedback(
  p_appointment_id uuid,
  p_token text,
  p_initial_score int,
  p_final_score int,
  p_problem_area text default '',
  p_notes text default ''
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  appt public.appointment;
  prog public.treatment_progress;
  v_email text;
  v_date text;
  v_treatment text;
begin
  if p_initial_score is null or p_final_score is null
     or p_initial_score not between 0 and 10
     or p_final_score not between 0 and 10 then
    raise exception 'Punteggio non valido' using errcode = '22023';
  end if;

  select * into appt
  from public.appointment a
  where a.id = p_appointment_id
    and coalesce(length(p_token), 0) >= 32
    and a.data->>'access_token' = p_token;

  if not found then
    raise exception 'Link non valido' using errcode = '42501';
  end if;

  v_email := lower(appt.data->>'email');
  v_date := appt.data->>'preferred_date';
  v_treatment := appt.data->>'treatment_type';

  select * into prog
  from public.treatment_progress p
  where lower(p.data->>'client_email') = v_email
    and p.data->>'session_date' = v_date
    and p.data->>'treatment_type' = v_treatment
  order by p.created_date desc
  limit 1;

  if found then
    update public.treatment_progress
       set data = data || jsonb_build_object(
             'initial_score', p_initial_score,
             'final_score', p_final_score,
             'problem_area', coalesce(nullif(left(p_problem_area, 500), ''), data->>'problem_area', ''),
             'notes', coalesce(nullif(left(p_notes, 5000), ''), data->>'notes', ''),
             'appointment_id', appt.id
           )
     where id = prog.id;
  else
    insert into public.treatment_progress (data, created_by)
    values (
      jsonb_build_object(
        'client_email', v_email,
        'client_name', trim(coalesce(appt.data->>'first_name', '') || ' ' || coalesce(appt.data->>'last_name', '')),
        'session_date', v_date,
        'treatment_type', v_treatment,
        'problem_area', coalesce(left(p_problem_area, 500), ''),
        'initial_score', p_initial_score,
        'final_score', p_final_score,
        'notes', coalesce(left(p_notes, 5000), ''),
        'appointment_id', appt.id
      ),
      v_email
    );
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

-- Recensioni approvate senza dati personali (no email, no appointment_id).
create or replace function public.approved_reviews(p_limit int default 6, p_treatment_type text default null)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(x.obj order by x.created_date desc), '[]'::jsonb)
  from (
    select r.created_date,
           jsonb_build_object(
             'id', r.id,
             'client_name', r.data->>'client_name',
             'rating', r.data->'rating',
             'text', r.data->>'text',
             'treatment_type', r.data->>'treatment_type',
             'created_date', r.created_date
           ) as obj
    from public.review r
    where r.data->>'status' = 'approved'
      and (p_treatment_type is null or r.data->>'treatment_type' = p_treatment_type)
    order by r.created_date desc
    limit least(greatest(coalesce(p_limit, 6), 1), 100)
  ) x
$$;

-- Aggiornamento "merge" usato da db.entities.X.update(id, patch).
-- SECURITY INVOKER: valgono le regole RLS e i trigger del chiamante.
create or replace function public.merge_record(p_table text, p_id uuid, p_patch jsonb)
returns jsonb
language plpgsql
volatile
security invoker
set search_path = public
as $$
declare
  result jsonb;
begin
  if p_table is null or not (p_table = any (public.app_tables())) then
    raise exception 'Tabella non valida' using errcode = '42501';
  end if;
  execute format(
    'update public.%I as t set data = t.data || $1 where t.id = $2 returning to_jsonb(t.*)',
    p_table)
  into result
  using coalesce(p_patch, '{}'::jsonb) - 'id' - 'created_date' - 'updated_date' - 'created_by', p_id;
  if result is null then
    raise exception 'Record non trovato o permesso negato' using errcode = 'P0002';
  end if;
  return result;
end;
$$;

revoke all on function public.booked_slots(text, text) from public;
revoke all on function public.appointment_by_token(uuid, text) from public;
revoke all on function public.appointment_respond(uuid, text, text) from public;
revoke all on function public.submit_session_feedback(uuid, text, int, int, text, text) from public;
revoke all on function public.approved_reviews(int, text) from public;
revoke all on function public.merge_record(text, uuid, jsonb) from public;

grant execute on function public.booked_slots(text, text) to anon, authenticated;
grant execute on function public.appointment_by_token(uuid, text) to anon, authenticated;
grant execute on function public.appointment_respond(uuid, text, text) to anon, authenticated;
grant execute on function public.submit_session_feedback(uuid, text, int, int, text, text) to anon, authenticated;
grant execute on function public.approved_reviews(int, text) to anon, authenticated;
grant execute on function public.merge_record(text, uuid, jsonb) to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.auth_email() to anon, authenticated;
grant execute on function public.app_tables() to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 6. Storage: bucket "uploads" (lettura pubblica tramite URL, max 10 MB)
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('uploads', 'uploads', true, 10485760,
        array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Nessuna policy SELECT per anon: i file si aprono con il loro URL pubblico,
-- ma l'elenco del bucket non è consultabile.
-- Sicurezza: niente upload dei clienti nel bucket PUBBLICO (solo il terapista
-- carica le immagini del blog). Prima qualunque utente registrato poteva
-- ospitare file arbitrari (anche HTML/SVG) su un URL pubblico.
-- Le immagini sono permesse solo nei formati elencati (niente SVG).
drop policy if exists uploads_insert on storage.objects;

drop policy if exists uploads_admin_all on storage.objects;
create policy uploads_admin_all on storage.objects
  for all to authenticated
  using (bucket_id = 'uploads' and (select public.is_admin()))
  with check (bucket_id = 'uploads' and (select public.is_admin()));

-- -----------------------------------------------------------------------------
-- 6b. Storage: bucket PRIVATO "documents" (referti, radiografie, PatientDocument)
--     Percorso file: <email cliente in minuscolo>/<YYYY-MM-DD>/<uuid>.<ext>
--     Lettura (URL firmati temporanei): admin e il cliente proprietario.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('documents', 'documents', false, 10485760)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit;

drop policy if exists documents_admin_all on storage.objects;
create policy documents_admin_all on storage.objects
  for all to authenticated
  using (bucket_id = 'documents' and (select public.is_admin()))
  with check (bucket_id = 'documents' and (select public.is_admin()));

drop policy if exists documents_owner_read on storage.objects;
create policy documents_owner_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = (select public.auth_email())
  );

-- Sicurezza: i clienti NON caricano documenti (nessuna pagina lo prevede; i
-- referti li carica il terapista). Rimosso per evitare abusi di spazio.
drop policy if exists documents_owner_insert on storage.objects;

-- -----------------------------------------------------------------------------
-- 7. Realtime (db.entities.X.subscribe). Le RLS valgono anche qui.
-- -----------------------------------------------------------------------------
do $$
declare
  t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array public.app_tables() loop
      if not exists (
        select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
      ) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end
$$;
