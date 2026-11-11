#!/usr/bin/env bash
# MassoLab - configurazione delle email in UN solo comando.
#
# Cosa fa (si puo' rilanciare quante volte vuoi: sovrascrive gli stessi valori):
#   1. ti chiede la "password per le app" di Gmail (16 lettere) senza mostrarla;
#   2. la salva come segreto della funzione "send-email" su Supabase, insieme a
#      GMAIL_USER, THERAPIST_EMAIL, SITE_URL e ALLOWED_ORIGINS;
#   3. imposta lo stesso Gmail come SMTP di Supabase Auth, cosi' le email di
#      conferma registrazione arrivano a TUTTI i clienti (non solo al team).
#
# Uso:    bash scripts/configura-email.sh
# Prova:  MASSOLAB_DRYRUN_PASSWORD=abcdefghijklmnop bash scripts/configura-email.sh --dry-run
#         (non chiama Supabase, non chiede nulla: controlla solo i file temporanei)
#
# NON lanciare "supabase config push" a mano: userebbe il config.toml del progetto, che non contiene
# la sezione SMTP. Per cambiare le impostazioni di Auth passa sempre da questo script.
#
# Sicurezza: la password non finisce mai negli argomenti di un comando, nella history
# o in un file del progetto. Viaggia solo in un file temporaneo (permessi 600) cancellato
# a fine lavoro anche in caso di errore, e in una variabile d'ambiente del solo
# processo "supabase config push". Compatibile con bash 3.2 (macOS).

set -euo pipefail
umask 077

# ---- Impostazioni (nessun segreto qui) --------------------------------------
PROJECT_REF="afbjvvdxeqjdzpvztqpg"
GMAIL_ADDR="massolab.simoneciacchi@gmail.com"
SITE="https://simocia99.github.io/massolab"
ORIGIN="https://simocia99.github.io"
SMTP_RATE_LIMIT="30"   # email di Auth per ora (con SMTP personalizzato si puo' alzare da 2)

DRY_RUN=0
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    -h|--help) sed -n '2,21p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "Opzione sconosciuta: $arg (usa --dry-run oppure nessuna opzione)"; exit 2 ;;
  esac
done

say()  { printf '%s\n' "$*"; }
step() { printf '\n==> %s\n' "$*"; }
fail() { printf '\nERRORE: %s\n' "$*" >&2; exit 1; }

# ---- Cartella del progetto ---------------------------------------------------
cd "$(dirname "$0")/.."
[ -f supabase/config.toml ] || fail "Non trovo supabase/config.toml. Lancia lo script dalla cartella del progetto MassoLab."

# ---- Cartella temporanea, cancellata sempre ----------------------------------
TMP="$(mktemp -d "${TMPDIR:-/tmp}/massolab-email.XXXXXX")"
chmod 700 "$TMP"
cleanup() { rm -rf "$TMP"; stty echo 2>/dev/null || true; }
trap cleanup EXIT
trap 'exit 130' INT TERM HUP

ENV_FILE="$TMP/secrets.env"
WORKDIR="$TMP/wd"

# ---- Supabase CLI: la usiamo con "npx" (in dry-run non serve) ------------------
# Versione fissata (quella provata): evita di scaricare ogni volta l'ultima release da npm.
SUPABASE_CLI_VERSION="3.1.0"
sb() { npx --yes "supabase@$SUPABASE_CLI_VERSION" "$@"; }

if [ "$DRY_RUN" -eq 0 ]; then
  command -v npx >/dev/null 2>&1 || fail "Manca Node.js (comando npx). Installalo da https://nodejs.org e riprova."
  step "Controllo il collegamento a Supabase"
  if ! LISTA="$(sb projects list 2>/dev/null)"; then
    fail "La CLI di Supabase non e' collegata al tuo account.
Esegui questo comando, accedi dal browser che si apre, poi rilancia lo script:
    npx supabase login"
  fi
  case "$LISTA" in
    *"$PROJECT_REF"*) say "OK: trovato il progetto MassoLab ($PROJECT_REF)." ;;
    *) fail "Il tuo account Supabase non vede il progetto $PROJECT_REF.
Hai fatto l'accesso con l'account giusto? Prova: npx supabase logout  e poi  npx supabase login" ;;
  esac
fi

# ---- Password per le app di Gmail ----------------------------------------------
step "Password per le app di Gmail"
PASS=""
if [ "$DRY_RUN" -eq 1 ]; then
  PASS="$(printf '%s' "${MASSOLAB_DRYRUN_PASSWORD:-}" | tr -d '[:space:]')"
  [[ "$PASS" =~ ^[A-Za-z]{16}$ ]] || fail "Prova a secco: imposta MASSOLAB_DRYRUN_PASSWORD con 16 lettere finte."
  say "(prova a secco: uso la password finta, Supabase NON viene chiamato)"
else
  [ -t 0 ] || fail "Lancia lo script direttamente dal Terminale (non con pipe o redirect), perche' deve chiederti la password."
  say "Serve la \"password per le app\" creata su:  https://myaccount.google.com/apppasswords"
  say "(account $GMAIL_ADDR, con la verifica in due passaggi attiva)."
  say "Incollala qui: non si vedra' nulla mentre scrivi, e' normale. Puoi lasciare gli spazi."
  say "Per uscire premi Invio senza scrivere nulla."
  while :; do
    printf 'Password per le app (16 lettere): '
    IFS= read -r -s INPUT || INPUT=""
    printf '\n'
    if [ -z "$INPUT" ]; then fail "Annullato: nessuna password inserita. Nessuna modifica fatta."; fi
    PASS="$(printf '%s' "$INPUT" | tr -d '[:space:]')"
    INPUT=""
    if [[ "$PASS" =~ ^[A-Za-z]{16}$ ]]; then break; fi
    say "Non va bene: deve avere esattamente 16 lettere (gli spazi non contano) e niente numeri o simboli."
    say "Se hai la password normale di Gmail NON funziona: serve quella \"per le app\". Riprova."
  done
  say "OK: password di 16 lettere ricevuta."
fi

# ---- File temporaneo con i segreti della funzione send-email --------------------
step "Preparo i file temporanei (verranno cancellati)"
: > "$ENV_FILE"
chmod 600 "$ENV_FILE"
{
  printf 'GMAIL_USER=%s\n' "$GMAIL_ADDR"
  printf 'GMAIL_APP_PASSWORD=%s\n' "$PASS"
  printf 'THERAPIST_EMAIL=%s\n' "$GMAIL_ADDR"
  printf 'SITE_URL=%s\n' "$SITE"
  printf 'ALLOWED_ORIGINS=%s\n' "$ORIGIN"
} > "$ENV_FILE"

# ---- Configurazione temporanea di Auth (SMTP): il config.toml vero non cambia ---
# Copia di supabase/config.toml con: (a) niente [db.pooler] (cosi' non tocchiamo il database),
# (b) limite email Auth alzato, (c) blocco SMTP con la password letta da una variabile d'ambiente.
mkdir -p "$WORKDIR/supabase"
awk '/^\[/{skip=($0=="[db.pooler]")} !skip{print}' supabase/config.toml \
  | sed "s/^email_sent = .*/email_sent = $SMTP_RATE_LIMIT/" > "$WORKDIR/supabase/config.toml"
grep -q "^email_sent = $SMTP_RATE_LIMIT\$" "$WORKDIR/supabase/config.toml" \
  || fail "Non trovo la riga 'email_sent' in supabase/config.toml: avvisa l'architetto."
{
  printf '\n[auth.email.smtp]\n'
  printf 'enabled = true\n'
  printf 'host = "smtp.gmail.com"\n'
  printf 'port = 465\n'
  printf 'user = "%s"\n' "$GMAIL_ADDR"
  printf 'pass = "env(MASSOLAB_SMTP_PASS)"\n'
  printf 'admin_email = "%s"\n' "$GMAIL_ADDR"
  printf 'sender_name = "MassoLab"\n'
} >> "$WORKDIR/supabase/config.toml"
chmod -R go-rwx "$TMP"

# ---- Prova a secco: controlli e uscita ------------------------------------------
if [ "$DRY_RUN" -eq 1 ]; then
  step "Prova a secco: controlli"
  say "Cartella temporanea: $TMP"
  say "Permessi file segreti: $(stat -f '%Lp' "$ENV_FILE") (atteso 600)"
  say "Contenuto del file segreti (valori nascosti):"
  sed 's/=.*/=***/' "$ENV_FILE" | sed 's/^/    /'
  say "Password presente SOLO nel file segreti? (atteso: 1 file)"
  say "    file che la contengono: $(grep -rlF -f <(printf '%s\n' "$PASS") "$TMP" | wc -l | tr -d ' ')"
  say "Differenze tra config.toml vero e quello temporaneo (nessun segreto):"
  diff supabase/config.toml "$WORKDIR/supabase/config.toml" | sed 's/^/    /' || true
  if [ "${MASSOLAB_DRYRUN_FAIL:-0}" = "1" ]; then
    say "(simulo un errore per provare la pulizia automatica)"
    false
  fi
  say "Fatto (prova a secco). I file temporanei vengono cancellati ora."
  exit 0
fi

# ---- 1) Segreti della funzione send-email -----------------------------------------
step "1/2 Salvo i segreti della funzione email su Supabase"
say "(Se la CLI chiede conferma, scrivi: Yes e premi Invio)"
if ! sb secrets set --env-file "$ENV_FILE" --remote="$PROJECT_REF"; then
  fail "Non sono riuscito a salvare i segreti. Controlla di aver fatto l'accesso (npx supabase login) e rilancia lo script."
fi
NOMI="$(sb secrets list --remote="$PROJECT_REF" 2>/dev/null || true)"
MANCANTI=""
for n in GMAIL_USER GMAIL_APP_PASSWORD THERAPIST_EMAIL SITE_URL ALLOWED_ORIGINS; do
  case "$NOMI" in *"$n"*) ;; *) MANCANTI="$MANCANTI $n" ;; esac
done
if [ -n "$MANCANTI" ]; then
  say "Attenzione: non vedo questi segreti nell'elenco:$MANCANTI (potrebbe essere solo un ritardo: rilancia lo script)."
else
  say "OK: i 5 segreti sono presenti su Supabase."
fi

# ---- 2) SMTP di Supabase Auth ---------------------------------------------------------
step "2/2 Imposto Gmail come mittente delle email di registrazione (Supabase Auth)"
[ -n "$PASS" ] || fail "Password vuota: non invio nulla (altrimenti romperei l'SMTP). Rilancia lo script."
say "Ora la CLI mostra l'elenco delle modifiche e chiede conferma."
say "Controlla che riguardi SOLO queste righe:"
say "    - auth.email.smtp.*  (enabled, host, port, user, admin_email, sender_name, pass)"
say "    - auth.rate_limit.email_sent  (da 2 a 30; di solito e' gia' a 30 nel file)"
say "Se vedi QUALSIASI altra modifica rispondi n (No) e avvisa l'architetto."
say "Se e' tutto come sopra scrivi: Yes e premi Invio."
if ! MASSOLAB_SMTP_PASS="$PASS" sb config push --remote="$PROJECT_REF" --workdir "$WORKDIR"; then
  fail "Impostazione SMTP di Auth non completata (annullata o in errore). I segreti della funzione email sono comunque stati salvati.
Rilancia lo script; se l'errore resta, scrivi all'architetto copiando il messaggio qui sopra (non contiene la password)."
fi

unset PASS
step "Fatto ✓"
say "Le email del sito ora partono da $GMAIL_ADDR."
say "Prova: prenota come ospite oppure registra un cliente con un'altra email e controlla anche la cartella Spam."
say "I file temporanei con la password sono stati cancellati."
