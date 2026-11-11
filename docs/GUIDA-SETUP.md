# Guida alla messa online di MassoLab

Questa guida spiega passo per passo come pubblicare il sito, senza bisogno di essere programmatori.
Servono circa 1–2 ore la prima volta. Ti servono tre account gratuiti:

| Servizio | A cosa serve |
|---|---|
| **GitHub** | conserva il codice e pubblica il sito (GitHub Pages) |
| **Supabase** | database, login di clienti e terapista, file caricati |
| **Resend** | invio delle email (conferme, promemoria, messaggi) |

> **Modalità DEMO.** Finché non colleghi Supabase (punto B e D) il sito funziona in "modalità demo":
> i dati restano solo nel browser di chi lo usa. Va bene per provarlo, **non** per clienti veri.

Nei comandi qui sotto sostituisci sempre:
- `TUO-UTENTE` con il tuo nome utente GitHub
- `massolab` con il nome che darai al repository (puoi lasciarlo così)
- `tuodominio.it` con il dominio comprato su Aruba

---

## A. GitHub: caricare il codice e attivare la pubblicazione

### A1. Crea l'account e il repository
1. Vai su <https://github.com> e crea un account (gratuito).
2. In alto a destra **+ → New repository**.
3. Nome: `massolab`. Visibilità: **Public** (vedi punto F per il motivo). **Non** spuntare "Add a README".
4. Premi **Create repository**.

### A2. Crea un "token" per poter caricare il codice dal Terminale
GitHub non accetta più la password dal Terminale: serve un token.
1. Su GitHub: foto profilo → **Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token (classic)**.
2. Nota: `Mac MassoLab`. Scadenza: a scelta (es. 1 anno).
3. Spunta **repo** e **workflow** (il secondo è indispensabile: senza, GitHub rifiuta il file di pubblicazione automatica).
4. **Generate token** e copia il codice `ghp_...` (lo vedi una volta sola; conservalo in un posto sicuro).

### A3. Carica il codice
Apri l'app **Terminale** del Mac e incolla un comando alla volta:

```bash
cd ~/Desktop/"PROGETTO SITO WEB MASSOLAB"
git init
git checkout -b main
git config user.name "Simone Ciacchi"
git config user.email "massolab.simoneciacchi@gmail.com"
git add .
git commit -m "Primo caricamento del sito MassoLab"
git remote add origin https://github.com/TUO-UTENTE/massolab.git
git push -u origin main
```

Quando chiede **Username** scrivi il tuo nome utente GitHub; come **Password** incolla il **token** `ghp_...`
(mentre incolli non vedi caratteri: è normale). Il Mac lo ricorderà per le volte successive.

> Il file `.gitignore` esclude già `node_modules`, `dist` e i file `.env`: non verranno caricati.

### A4. Attiva GitHub Pages
1. Nel repository: **Settings → Pages**.
2. Alla voce **Source** scegli **GitHub Actions**.
3. Vai nella scheda **Actions** del repository: vedrai "Deploy su GitHub Pages" in esecuzione
   (se non parte, premi **Run workflow**). Dopo 1–2 minuti diventa verde.
4. Il sito è online su `https://TUO-UTENTE.github.io/massolab/` (in modalità demo finché non completi B e D).

**Aggiornamenti futuri:** ogni volta che modifichi il sito basta:
```bash
cd ~/Desktop/"PROGETTO SITO WEB MASSOLAB"
git add .
git commit -m "Descrizione della modifica"
git push
```
Il sito si ripubblica da solo in un paio di minuti.

---

## B. Supabase: database e accessi

### B1. Crea il progetto
1. Vai su <https://supabase.com> → **Start your project** → accedi (anche con GitHub).
2. **New project**: nome `massolab`, scegli una **password del database** robusta (salvala),
   regione **Central EU (Frankfurt)** (dati in Europa, utile per il GDPR). Piano **Free**.
3. Attendi un paio di minuti che il progetto sia pronto.

### B2. Crea le tabelle (esegui lo script SQL)
1. Menu a sinistra **SQL Editor → New query**.
2. Apri sul Mac il file `supabase/migrations/0001_init.sql`, copia **tutto** il contenuto e incollalo.
3. Premi **Run**. Deve comparire "Success. No rows returned".
   Lo script si può rieseguire senza perdere dati (utile in caso di aggiornamenti).

Lo script crea: le tabelle, le regole di sicurezza (chi può leggere/scrivere cosa), le funzioni usate
dai link nelle email, gli spazi per i file (`uploads` pubblico per le immagini del blog, `documents` privato per i documenti dei pazienti; max 10 MB per file) e imposta
`massolab.simoneciacchi@gmail.com` come **amministratore** (terapista).

> Per aggiungere un altro amministratore: SQL Editor →
> `insert into public.admins (email) values ('altra.email@esempio.it');` (sempre in minuscolo).

### B3. Login con email e password
1. **Authentication → Sign In / Providers → Email**: deve essere attivo.
2. Lascia **attivo "Confirm email"**. È **fondamentale per la sicurezza**: senza conferma chiunque
   potrebbe registrarsi con l'email di un'altra persona (anche la tua) e vederne i dati.
3. Password minima: 6 caratteri (o più, a tua scelta).

### B4. Login con Google (per il terapista e, se vuoi, per i clienti)
1. Vai su <https://console.cloud.google.com> → crea un progetto "MassoLab".
2. **API e servizi → Schermata consenso OAuth**: tipo **Esterno**, nome app "MassoLab",
   email di supporto la tua → salva. Poi **Pubblica l'app** (altrimenti funziona solo per gli utenti di test).
3. **API e servizi → Credenziali → Crea credenziali → ID client OAuth** → tipo **Applicazione web**.
4. In **URI di reindirizzamento autorizzati** inserisci quello mostrato da Supabase in
   **Authentication → Sign In / Providers → Google** (ha la forma
   `https://XXXXXXXX.supabase.co/auth/v1/callback`).
5. Copia **ID client** e **Client secret** dentro la pagina Google di Supabase, attiva il provider e salva.

### B5. Indirizzi del sito (Site URL e Redirect URLs)
**Authentication → URL Configuration**:
- **Site URL**: `https://TUO-UTENTE.github.io/massolab/`
- **Redirect URLs** (aggiungi una riga per ciascuno):
  - `https://TUO-UTENTE.github.io/massolab/**`
  - `http://localhost:5173/**` (solo per provare il sito sul Mac)

Servono perché i link "conferma email", "reimposta password" e il ritorno da Google
riportino sul tuo sito. Quando colleghi il dominio Aruba aggiorna questi valori (punto E5).

### B6. (Consigliato) Email di sistema tramite Resend
Supabase gratuito invia pochissime email di conferma all'ora. Dopo aver configurato Resend (punto C):
**Authentication → Emails → SMTP Settings → Enable custom SMTP**:
host `smtp.resend.com`, porta `465`, utente `resend`, password = la tua chiave API Resend,
mittente = lo stesso indirizzo di `MAIL_FROM` (es. `notifiche@tuodominio.it`).
Nella stessa sezione (**Templates**) puoi tradurre in italiano i testi delle email di conferma.

---

## C. Resend: invio delle email del sito

### C1. Account e chiave
1. Registrati su <https://resend.com> (piano gratuito: 3.000 email/mese).
2. **API Keys → Create API Key** (permesso "Sending access") → copia la chiave `re_...`.

### C2. Dominio mittente (importante)
Senza un dominio verificato Resend permette di scrivere **solo al tuo indirizzo**: i clienti non
riceverebbero le conferme. Appena hai il dominio Aruba:
1. Resend → **Domains → Add Domain** → `tuodominio.it` (regione EU).
2. Resend mostra alcuni record DNS (TXT/MX per SPF e DKIM): copiali nel pannello DNS di Aruba
   (vedi punto E2, "Aggiungi record"), poi premi **Verify** su Resend (può servire qualche ora).
3. Il mittente sarà ad esempio `notifiche@tuodominio.it`.

### C3. Pubblica la funzione "send-email" su Supabase
Serve Node.js (già installato se hai lavorato al sito). Nel Terminale:

```bash
cd ~/Desktop/"PROGETTO SITO WEB MASSOLAB"
npx supabase login
npx supabase link --project-ref XXXXXXXX
npx supabase secrets set RESEND_API_KEY=re_xxxxxxxxx MAIL_FROM=notifiche@tuodominio.it THERAPIST_EMAIL=massolab.simoneciacchi@gmail.com
npx supabase functions deploy send-email
```

- `XXXXXXXX` è il "Reference ID" del progetto (Supabase → **Project Settings → General**).
- `npx supabase login` apre il browser per autorizzare; `link` può chiedere la password del database (B1).
- Se un comando segnala che manca la configurazione, esegui prima `npx supabase init` (rispondi **N** alle domande) e ripeti.
- Finché non hai il dominio puoi usare `MAIL_FROM=onboarding@resend.dev` (solo per prove verso la tua email).
- `THERAPIST_EMAIL` può contenere più indirizzi separati da virgola (riceveranno le notifiche).
- `SITE_URL` (**obbligatorio per i link nelle email**): indirizzo del sito con il percorso base e
  senza "/" finale, es. `https://TUO-UTENTE.github.io/massolab` oppure `https://www.tuodominio.it`.
  Senza questo valore le email partono ma senza i pulsanti/link (scheda salute, dashboard, "Prenota di nuovo").
- `ALLOWED_ORIGINS` (facoltativo, consigliato): gli indirizzi da cui il sito chiama la funzione, separati
  da virgola e senza percorso, es. `https://TUO-UTENTE.github.io,https://www.tuodominio.it`.
  Se vuoto la funzione accetta chiamate da qualunque sito (le regole su chi può inviare restano comunque attive).

```bash
npx supabase secrets set SITE_URL=https://TUO-UTENTE.github.io/massolab ALLOWED_ORIGINS=https://TUO-UTENTE.github.io
```

Nota sicurezza: le email "libere" le può inviare solo il terapista; visitatori e clienti inviano solo
notifiche con testo deciso dalla funzione. Tieni **disattivato il click tracking** di Resend (i link contengono token).

La funzione controlla chi può scrivere a chi: il terapista a chiunque; un cliente loggato solo
al terapista o a sé stesso; un visitatore solo al terapista oppure all'indirizzo con cui ha appena
prenotato. Così nessuno può usare il sito per mandare spam.

---

## D. Collegare il sito a Supabase (variabili del repository)

1. Supabase → **Project Settings → API** (o **Data API / API Keys**): copia
   **Project URL** e la chiave **anon public**.
   ⚠️ Non usare mai la chiave **service_role**: è segreta e non va mai messa nel sito.
2. GitHub → repository → **Settings → Secrets and variables → Actions → scheda Variables → New repository variable**.
   Crea queste tre variabili:

| Nome | Valore |
|---|---|
| `VITE_SUPABASE_URL` | `https://XXXXXXXX.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | la chiave anon public (`eyJ...` oppure `sb_publishable_...`) |
| `VITE_THERAPIST_EMAIL` | `massolab.simoneciacchi@gmail.com` |

3. **Actions → Deploy su GitHub Pages → Run workflow** (oppure fai un nuovo `git push`).
4. Apri il sito: ora è collegato al database. Accedi all'area terapista con Google (o registrati
   con email e password usando `massolab.simoneciacchi@gmail.com` e conferma l'email).

Per provare sul Mac con il database vero, crea un file `.env.local` nella cartella del progetto
con le stesse tre righe (`VITE_SUPABASE_URL=...` ecc.) e lancia `npm run dev`.

---

## E. Collegare il dominio Aruba

### E1. Indica il dominio nel progetto
Crea il file `public/CNAME` (senza estensione) che contiene **una sola riga**, il dominio principale
con cui vuoi aprire il sito, per esempio:

```
www.tuodominio.it
```

Con questo file la pubblicazione usa automaticamente il percorso `/` invece di `/massolab/`.
Poi carica la modifica (`git add . && git commit -m "Dominio" && git push`).

### E2. Record DNS su Aruba
Area clienti Aruba → **Gestione Domini → tuodominio.it → Gestione DNS e name server** (Pannello DNS).
Elimina eventuali record **A** o **CNAME** già presenti per `@`/`tuodominio.it` e `www` (di solito
puntano alla pagina di parcheggio Aruba), poi aggiungi:

| Tipo | Nome / Host | Valore |
|---|---|---|
| A | `@` (dominio principale) | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `TUO-UTENTE.github.io` |

(Facoltativo, per IPv6: record AAAA su `@` verso `2606:50c0:8000::153`, `2606:50c0:8001::153`,
`2606:50c0:8002::153`, `2606:50c0:8003::153`.)
Le modifiche DNS possono richiedere da pochi minuti fino a 24–48 ore.

### E3. Imposta il dominio su GitHub
Repository → **Settings → Pages → Custom domain**: scrivi `www.tuodominio.it` → **Save**.
GitHub controlla i DNS (spunta verde "DNS check successful").
Il dominio senza `www` verrà reindirizzato automaticamente sul `www`.

### E4. HTTPS
Sempre in **Settings → Pages** spunta **Enforce HTTPS** (diventa disponibile quando GitHub ha
generato il certificato, di solito entro qualche ora).

### E5. Aggiorna Supabase
**Authentication → URL Configuration**:
- **Site URL**: `https://www.tuodominio.it/`
- **Redirect URLs**: aggiungi `https://www.tuodominio.it/**` e `https://tuodominio.it/**`
  (puoi lasciare anche quelli di github.io).

Su Google Cloud non serve cambiare nulla (il ritorno passa da Supabase).

---

## F. Domande frequenti

### Perché il sito non compare su Google?
È voluto: il sito si condivide solo tramite link o QR code. Ogni pagina contiene l'istruzione
`noindex` (dice ai motori di ricerca di non mostrarla) e il file `robots.txt` chiede di non esplorarla.
Se un giorno vorrai comparire su Google, togli le due righe `<meta name="robots" ...>` e
`<meta name="googlebot" ...>` da `index.html`, cambia `public/robots.txt` in
`User-agent: *` + `Allow: /` e registra il sito su Google Search Console.

### Il codice è visibile a tutti?
Con un account GitHub gratuito, GitHub Pages funziona solo con repository **pubblici**: chiunque può
leggere il **codice** del sito (testi, grafica, logica). **I dati invece no**: appuntamenti, schede
salute, messaggi, documenti dei clienti stanno su Supabase, protetti dalle regole di sicurezza del
database e dal login. La chiave "anon" presente nel sito è pubblica per natura: da sola non dà accesso
ai dati riservati.
Non mettere mai nel repository password, la chiave `service_role` o la chiave Resend.
Se preferisci un repository **privato** con GitHub Pages serve l'abbonamento **GitHub Pro** (a pagamento).

### I file caricati (documenti, referti) sono privati?
Sì. I documenti dei pazienti (referti, radiografie…) vanno in uno spazio **privato** (`documents`):
li possono aprire solo il terapista e il cliente a cui appartengono, tramite link temporanei che
scadono dopo un'ora. Lo spazio pubblico `uploads` serve solo per immagini non riservate
(es. copertine del blog).

### Come aggiungo un altro amministratore o cambio email del terapista?
Vedi B2 (riga `insert into public.admins ...`) e aggiorna la variabile `VITE_THERAPIST_EMAIL`
e il segreto `THERAPIST_EMAIL` della funzione email.

---

## G. Condividere il sito (link e QR code)

1. Accedi all'**area terapista** (Dashboard).
2. Nel menu scegli **Condividi sito**.
3. **Copia link** per incollarlo su WhatsApp, Instagram, email…
4. **Scarica QR (PNG)** per stamparlo su biglietti da visita, volantini o in studio.

Il link e il QR usano sempre l'indirizzo attuale del sito: dopo aver collegato il dominio Aruba
scarica di nuovo il QR, così punterà al dominio definitivo.
