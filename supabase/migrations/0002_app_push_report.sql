-- =============================================================================
-- MassoLab Studio — notifiche del mattino (Web Push) e resoconto giornaliero
-- Idempotente: si può rieseguire senza perdere dati.
-- Si applica con scripts/configura-notifiche.sh (che fa "supabase db push").
--
-- Contiene:
--   1. tabella push_subscription (dispositivi iscritti alle notifiche), RLS solo admin;
--   2. indice unico per non inviare due volte il resoconto dello stesso giorno;
--   3. estensioni pg_cron + pg_net (+ vault) e job che chiama la funzione
--      "daily-report" alle :30 delle ore 4-7 UTC. La funzione invia SOLO quando a
--      Roma sono le 7:30 (o recupera fino alle 9:59 se un invio è fallito),
--      quindi l'ora legale è gestita lì. La chiamata porta un segreto letto dal
--      Vault (nome "daily_report_secret"), che lo script inserisce: non è qui.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Dispositivi iscritti alle notifiche
-- -----------------------------------------------------------------------------
create table if not exists public.push_subscription (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  endpoint     text not null unique,
  p256dh       text not null,
  auth         text not null,
  device_label text,
  user_agent   text,
  created_at   timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  last_sent_at timestamptz,
  fail_count   int not null default 0
);

-- Limiti sui valori (aggiunti a parte, così la migration resta rieseguibile).
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'push_subscription_values_chk') then
    alter table public.push_subscription
      add constraint push_subscription_values_chk check (
        endpoint ~ '^https://' and length(endpoint) <= 1000
        and length(p256dh) between 40 and 200
        and length(auth) between 10 and 100
        and (device_label is null or length(device_label) <= 40)
        and (user_agent is null or length(user_agent) <= 300)
      );
  end if;
end
$$;

create index if not exists push_subscription_user_idx on public.push_subscription (user_id);

alter table public.push_subscription enable row level security;

revoke all on public.push_subscription from anon;
revoke all on public.push_subscription from authenticated;
grant select, insert, update, delete on public.push_subscription to authenticated;
grant all on public.push_subscription to service_role;

-- Solo l'admin (terapista con email confermata), e solo le proprie righe.
drop policy if exists push_subscription_admin_own on public.push_subscription;
create policy push_subscription_admin_own on public.push_subscription
  for all to authenticated
  using ((select public.is_admin()) and user_id = (select auth.uid()))
  with check ((select public.is_admin()) and user_id = (select auth.uid()));

-- -----------------------------------------------------------------------------
-- 2. Un solo resoconto al giorno (claim atomico in automation_log)
-- -----------------------------------------------------------------------------
create unique index if not exists automation_log_daily_report_uniq
  on public.automation_log ((data->>'report_date'))
  where data->>'automation_key' = 'daily_report';

-- -----------------------------------------------------------------------------
-- 3. Pianificazione: pg_cron + pg_net, segreto dal Vault
-- -----------------------------------------------------------------------------
-- Schemi come nella documentazione Supabase (se già attive, non cambia nulla).
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;
create extension if not exists supabase_vault with schema vault;

-- Il job legge il segreto dal Vault a OGNI esecuzione (mai salvato nel testo del job).
-- 30 4-7 * * *  = 4:30, 5:30, 6:30, 7:30 UTC
--   inverno (UTC+1): 5:30 6:30 7:30 8:30 a Roma  -> invio alle 7:30 (6:30 UTC)
--   estate  (UTC+2): 6:30 7:30 8:30 9:30 a Roma  -> invio alle 7:30 (5:30 UTC)
-- Le esecuzioni successive servono solo da recupero se l'invio delle 7:30 fallisce.
select cron.schedule(
  'massolab-daily-report',
  '30 4-7 * * *',
  $job$
    select net.http_post(
      url := 'https://afbjvvdxeqjdzpvztqpg.supabase.co/functions/v1/daily-report',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', coalesce(
          (select decrypted_secret from vault.decrypted_secrets where name = 'daily_report_secret' limit 1),
          ''
        )
      ),
      body := jsonb_build_object('mode', 'daily'),
      timeout_milliseconds := 30000
    );
  $job$
);
