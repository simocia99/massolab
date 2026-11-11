# MassoLab · Simone Ciacchi

Sito di MassoLab (massoterapia a domicilio a Lacchiarella e dintorni): pagine pubbliche,
prenotazioni, area clienti e area terapista.

Tecnologie: React + Vite + Tailwind, database e login su Supabase, email con Resend,
pubblicazione su GitHub Pages.

## Messa online
Segui la guida passo-passo: **[docs/GUIDA-SETUP.md](docs/GUIDA-SETUP.md)**.

## Comandi
```bash
npm install      # solo la prima volta
npm run dev      # prova il sito sul Mac: http://localhost:5173
npm run build    # crea la versione da pubblicare (cartella dist/)
```

Senza le variabili `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (file `.env.local`) il sito
parte in **modalità demo**: i dati restano nel browser. Accesso terapista in demo:
email `massolab.simoneciacchi@gmail.com`, password `massolab-demo`.

## Struttura
- `src/pages`, `src/components` — pagine e componenti
- `src/api` — accesso ai dati (Supabase oppure demo nel browser)
- `supabase/migrations/0001_init.sql` — tabelle e regole di sicurezza del database
- `supabase/functions/send-email` — funzione per l'invio delle email
- `.github/workflows/deploy.yml` — pubblicazione automatica su GitHub Pages a ogni `git push`
