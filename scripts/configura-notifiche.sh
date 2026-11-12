#!/usr/bin/env bash
# MassoLab Studio - notifiche del mattino in UN solo comando.
#
# Cosa fa (si puo' rilanciare: e' idempotente):
#   1. crea in locale le chiavi VAPID (servono alle notifiche Web Push) e un segreto
#      nuovo per il job che ogni mattina chiama la funzione "daily-report";
#   2. applica su Supabase la migration 0002 (tabella dei dispositivi + job pg_cron);
#   3. salva il segreto del job nel Vault di Supabase;
#   4. salva chiave privata, chiave pubblica e segreto nei secrets delle Edge Functions;
#   5. pubblica la funzione "daily-report";
#   6. imposta su GitHub la variabile pubblica VITE_VAPID_PUBLIC_KEY.
#
# Uso:    bash scripts/configura-notifiche.sh
#         bash scripts/configura-notifiche.sh --nuove-chiavi   (rigenera anche le chiavi VAPID:
#                                                               poi su ogni dispositivo va ripremuto
#                                                               "Attiva notifiche del mattino")
# Prova:  bash scripts/configura-notifiche.sh --dry-run
#         (non chiama Supabase ne' GitHub: controlla solo chiavi e file temporanei)
#
# Sicurezza: chiave privata e segreto non passano mai negli argomenti di un comando,
# nella history o in un file del progetto. Vengono creati da Node direttamente in file
# temporanei (permessi 600) cancellati a fine lavoro anche in caso di errore.
# Compatibile con bash 3.2 (macOS).

set -euo pipefail
umask 077

# ---- Impostazioni (nessun segreto qui) --------------------------------------
PROJECT_REF="afbjvvdxeqjdzpvztqpg"
GH_REPO="simocia99/massolab"
CONTACT="mailto:massolab.simoneciacchi@gmail.com"
FUNCTION_NAME="daily-report"
VAULT_NAME="daily_report_secret"
GH_VAR="VITE_VAPID_PUBLIC_KEY"
SUPABASE_CLI_VERSION="3.1.0"   # versione fissata (quella provata)

DRY_RUN=0
NEW_KEYS=0
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    --nuove-chiavi) NEW_KEYS=1 ;;
    -h|--help) sed -n '2,24p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "Opzione sconosciuta: $arg (usa --dry-run, --nuove-chiavi oppure nessuna opzione)"; exit 2 ;;
  esac
done

say()  { printf '%s\n' "$*"; }
step() { printf '\n==> %s\n' "$*"; }
fail() { printf '\nERRORE: %s\n' "$*" >&2; exit 1; }

# ---- Cartella del progetto ---------------------------------------------------
cd "$(dirname "$0")/.."
[ -f supabase/migrations/0002_app_push_report.sql ] || fail "Non trovo la migration 0002. Lancia lo script dalla cartella del progetto MassoLab."
[ -f "supabase/functions/$FUNCTION_NAME/index.ts" ] || fail "Non trovo la funzione $FUNCTION_NAME."

# ---- Cartella temporanea, cancellata sempre ----------------------------------
TMP="$(mktemp -d "${TMPDIR:-/tmp}/massolab-notifiche.XXXXXX")"
chmod 700 "$TMP"
cleanup() { rm -rf "$TMP"; }
trap cleanup EXIT
trap 'exit 130' INT TERM HUP

ENV_FILE="$TMP/secrets.env"     # segreti per le Edge Functions
SQL_FILE="$TMP/vault.sql"       # segreto del cron per il Vault
PUB_FILE="$TMP/vapid-public.txt" # chiave PUBBLICA (non segreta)

# ---- Strumenti ------------------------------------------------------------------
command -v node >/dev/null 2>&1 || fail "Manca Node.js. Installalo da https://nodejs.org e riprova."
sb() { npx --yes "supabase@$SUPABASE_CLI_VERSION" "$@"; }
GH="$(command -v gh 2>/dev/null || true)"
[ -n "$GH" ] || GH="$HOME/.local/gh-dl/gh_2.103.3_macOS_amd64/bin/gh"

if [ "$DRY_RUN" -eq 0 ]; then
  command -v npx >/dev/null 2>&1 || fail "Manca npx (arriva con Node.js)."
  [ -x "$GH" ] || fail "Non trovo il comando gh di GitHub (cercato in $GH)."
  step "Controllo il collegamento a GitHub"
  "$GH" auth status >/dev/null 2>&1 || fail "gh non e' collegato a GitHub. Esegui:  \"$GH\" auth login  e rilancia lo script."
  say "OK: GitHub collegato."
  step "Controllo il collegamento a Supabase"
  if ! LISTA="$(sb projects list 2>/dev/null)"; then
    fail "La CLI di Supabase non e' collegata al tuo account.
Esegui questo comando, accedi dal browser che si apre, poi rilancia lo script:
    npx supabase login"
  fi
  case "$LISTA" in
    *"$PROJECT_REF"*) say "OK: trovato il progetto MassoLab ($PROJECT_REF)." ;;
    *) fail "Il tuo account Supabase non vede il progetto $PROJECT_REF." ;;
  esac
fi

# ---- Chiavi: nuove o gia' presenti? ------------------------------------------------
# Le chiavi VAPID si generano UNA volta: se cambiano, i dispositivi gia' iscritti
# vanno riattivati. Il segreto del cron invece si rinnova a ogni lancio.
EXISTING_PUB=""
if [ "$DRY_RUN" -eq 0 ] && [ "$NEW_KEYS" -eq 0 ]; then
  NOMI="$(sb secrets list --remote="$PROJECT_REF" 2>/dev/null || true)"
  case "$NOMI" in
    *VAPID_PRIVATE_KEY*)
      EXISTING_PUB="$("$GH" variable get "$GH_VAR" --repo "$GH_REPO" 2>/dev/null || true)"
      EXISTING_PUB="$(printf '%s' "$EXISTING_PUB" | tr -d '[:space:]')"
      ;;
  esac
fi
if [ -n "$EXISTING_PUB" ]; then
  say "Chiavi VAPID gia' presenti: le tengo (i dispositivi iscritti restano attivi)."
  say "(Per rigenerarle: bash scripts/configura-notifiche.sh --nuove-chiavi)"
  KEEP_KEYS=1
else
  KEEP_KEYS=0
fi

# ---- Generazione in locale (Node, Web Crypto) ---------------------------------------
step "Preparo chiavi e segreto nei file temporanei (verranno cancellati)"
: > "$ENV_FILE"; : > "$SQL_FILE"; : > "$PUB_FILE"
chmod 600 "$ENV_FILE" "$SQL_FILE" "$PUB_FILE"
# Il codice qui sotto non contiene segreti: li genera e li scrive direttamente nei file.
node --input-type=module - "$ENV_FILE" "$SQL_FILE" "$PUB_FILE" "$KEEP_KEYS" "$CONTACT" "$VAULT_NAME" <<'NODE'
import { writeFileSync } from 'node:fs';
const [envFile, sqlFile, pubFile, keep, contact, vaultName] = process.argv.slice(2);
const s = globalThis.crypto.subtle;
const b64u = (buf) => Buffer.from(buf).toString('base64url');
const secret = Buffer.from(globalThis.crypto.getRandomValues(new Uint8Array(32))).toString('hex');
const lines = [];
if (keep !== '1') {
  const kp = await s.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const pub = b64u(await s.exportKey('raw', kp.publicKey)); // 65 byte -> 87 caratteri
  const priv = (await s.exportKey('jwk', kp.privateKey)).d; // 32 byte -> 43 caratteri
  if (pub.length !== 87 || priv.length !== 43) throw new Error('Chiavi VAPID con formato inatteso');
  lines.push(`VAPID_PUBLIC_KEY=${pub}`, `VAPID_PRIVATE_KEY=${priv}`);
  writeFileSync(pubFile, pub + '\n', { mode: 0o600 });
}
lines.push(`VAPID_SUBJECT=${contact}`, `DAILY_REPORT_SECRET=${secret}`);
writeFileSync(envFile, lines.join('\n') + '\n', { mode: 0o600 });
// Upsert nel Vault (il segreto e' esadecimale: nessun problema di virgolette).
// Due SELECT semplici e NON un blocco "do $$": pg_stat_statements salva il testo dei
// blocchi DO cosi' com'e' (segreto compreso), mentre nelle SELECT sostituisce i valori con $1.
if (!/^[a-z_]+$/.test(vaultName) || !/^[0-9a-f]{64}$/.test(secret)) throw new Error('Valori inattesi');
writeFileSync(
  sqlFile,
  `select vault.update_secret(id, '${secret}') from vault.secrets where name = '${vaultName}';
select vault.create_secret('${secret}', '${vaultName}', 'MassoLab: segreto del job daily-report')
  where not exists (select 1 from vault.secrets where name = '${vaultName}');
`,
  { mode: 0o600 },
);
NODE
chmod -R go-rwx "$TMP"

if [ "$KEEP_KEYS" -eq 1 ]; then
  PUB="$EXISTING_PUB"
else
  PUB="$(tr -d '[:space:]' < "$PUB_FILE")"
fi
[[ "$PUB" =~ ^[A-Za-z0-9_-]{87}$ ]] || fail "Chiave pubblica VAPID non valida. Rilancia con --nuove-chiavi."

# ---- Prova a secco: controlli e uscita ------------------------------------------
if [ "$DRY_RUN" -eq 1 ]; then
  step "Prova a secco: controlli"
  say "Cartella temporanea: $TMP"
  say "Permessi: secrets.env $(stat -f '%Lp' "$ENV_FILE"), vault.sql $(stat -f '%Lp' "$SQL_FILE") (atteso 600)"
  say "Contenuto di secrets.env (valori nascosti):"
  sed 's/=.*/=***/' "$ENV_FILE" | sed 's/^/    /'
  PRIV_LINE="$(grep '^VAPID_PRIVATE_KEY=' "$ENV_FILE" | cut -d= -f2-)"
  SEC_LINE="$(grep '^DAILY_REPORT_SECRET=' "$ENV_FILE" | cut -d= -f2-)"
  say "Chiave privata: ${#PRIV_LINE} caratteri (attesi 43); file che la contengono: $(grep -rlF -- "$PRIV_LINE" "$TMP" | wc -l | tr -d ' ') (atteso 1)"
  say "Segreto cron: ${#SEC_LINE} caratteri (attesi 64); file che lo contengono: $(grep -rlF -- "$SEC_LINE" "$TMP" | wc -l | tr -d ' ') (atteso 2: secrets.env e vault.sql)"
  say "Chiave pubblica (non segreta, andra' su GitHub): ${PUB:0:12}... (${#PUB} caratteri)"
  say "Comandi che verrebbero eseguiti:"
  say "    supabase db push --remote=$PROJECT_REF"
  say "    supabase db query --remote=$PROJECT_REF --file <vault.sql>"
  say "    supabase secrets set --env-file <secrets.env> --remote=$PROJECT_REF"
  say "    supabase functions deploy $FUNCTION_NAME --remote=$PROJECT_REF --no-verify-jwt --use-api"
  say "    gh variable set $GH_VAR --repo $GH_REPO"
  unset PRIV_LINE SEC_LINE
  if [ "${MASSOLAB_DRYRUN_FAIL:-0}" = "1" ]; then
    say "(simulo un errore per provare la pulizia automatica)"
    false
  fi
  say "Fatto (prova a secco). I file temporanei vengono cancellati ora."
  exit 0
fi

# ---- 1) Migration -----------------------------------------------------------------
step "1/5 Applico la migration delle notifiche (tabella dispositivi + job del mattino)"
say "La CLI mostra le migration da applicare: deve esserci SOLO 0002_app_push_report.sql."
say "Se e' cosi' scrivi: Y (o Yes) e premi Invio. Se vedi altro rispondi n e avvisa l'architetto."
sb db push --remote="$PROJECT_REF" || fail "Migration non applicata. Rilancia lo script; se l'errore resta, copia il messaggio all'architetto."

# ---- 2) Segreto del cron nel Vault ----------------------------------------------------
step "2/5 Salvo il segreto del job nel Vault di Supabase"
say "(Se la CLI chiede conferma, scrivi: Yes e premi Invio)"
sb db query --remote="$PROJECT_REF" --file "$SQL_FILE" >/dev/null \
  || fail "Segreto non salvato nel Vault. Rilancia lo script."
say "OK: segreto salvato nel Vault (nome: $VAULT_NAME)."

# ---- 3) Segreti delle Edge Functions --------------------------------------------------
step "3/5 Salvo chiavi e segreto nelle Edge Functions"
say "(Se la CLI chiede conferma, scrivi: Yes e premi Invio)"
sb secrets set --env-file "$ENV_FILE" --remote="$PROJECT_REF" \
  || fail "Segreti non salvati. Rilancia lo script (il Vault verra' riallineato)."
NOMI="$(sb secrets list --remote="$PROJECT_REF" 2>/dev/null || true)"
MANCANTI=""
for n in VAPID_PUBLIC_KEY VAPID_PRIVATE_KEY VAPID_SUBJECT DAILY_REPORT_SECRET; do
  case "$NOMI" in *"$n"*) ;; *) MANCANTI="$MANCANTI $n" ;; esac
done
[ -z "$MANCANTI" ] && say "OK: i 4 segreti sono presenti." \
  || say "Attenzione: non vedo$MANCANTI (potrebbe essere un ritardo: rilancia lo script)."

# ---- 4) Funzione daily-report ------------------------------------------------------------
step "4/5 Pubblico la funzione $FUNCTION_NAME"
sb functions deploy "$FUNCTION_NAME" --remote="$PROJECT_REF" --no-verify-jwt --use-api \
  || fail "Pubblicazione della funzione non riuscita. Rilancia lo script."

# ---- 5) Variabile pubblica su GitHub ------------------------------------------------------
step "5/5 Imposto su GitHub la chiave PUBBLICA ($GH_VAR)"
printf '%s' "$PUB" | "$GH" variable set "$GH_VAR" --repo "$GH_REPO" \
  || fail "Variabile GitHub non impostata. Rilancia lo script."
say "OK: variabile $GH_VAR impostata."

# ---- Verifica finale (sola lettura) -------------------------------------------------------
step "Verifica del job del mattino"
sb db query --remote="$PROJECT_REF" --read-only \
  "select jobname, schedule, active from cron.job where jobname = 'massolab-daily-report'" 2>/dev/null \
  || say "(Verifica non riuscita: non e' un problema, il job e' nella migration.)"

step "Fatto ✓"
say "Ora serve una nuova pubblicazione del sito (la fa l'architetto) perche' l'app legga la chiave."
say "Poi, sull'iPhone: apri il sito in Safari → .../TherapistDashboard → Condividi → \"Aggiungi alla schermata Home\","
say "apri MassoLab dalla Home, accedi e premi \"Attiva notifiche del mattino\" (poi \"Prova\")."
say "Sul Mac: Safari → File → \"Aggiungi al Dock\" e lo stesso pulsante."
say "I file temporanei con chiavi e segreto sono stati cancellati."
