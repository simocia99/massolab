import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { db } from '@/api/client';
import { useAuth } from '@/lib/AuthContext';
import { createPageUrl } from '@/lib/utils';
import { GoogleIcon } from '@/pages/TherapistLogin';
import { GOOGLE_AUTH } from '@/api/config';
import { ensureClientProfile, stashPendingProfile } from '@/components/client/clientProfile';

const EMPTY = { email: '', password: '', first_name: '', last_name: '', phone: '' };
const labelCls = 'block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1';
const inputCls =
  'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400';

/** Only same-origin redirects; returns a router path (without deploy base). */
function safeNext(raw) {
  const fallback = createPageUrl('ClientArea');
  if (!raw) return fallback;
  try {
    const url = new URL(raw, window.location.origin);
    if (url.origin !== window.location.origin) return fallback;
    // "//host" verrebbe letto come altro dominio: una sola barra iniziale.
    let path = url.pathname.replace(/^\/+/, '/');
    const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
    if (base && path.startsWith(base)) path = path.slice(base.length) || '/';
    if (path.startsWith(createPageUrl('ClientLogin'))) return fallback;
    return path + url.search + url.hash;
  } catch {
    return fallback;
  }
}

function PasswordInput({ id, value, onChange, autoComplete }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pr-10 text-sm focus:outline-none focus:border-red-400"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Nascondi password' : 'Mostra password'}
        className="absolute right-1 top-0 h-full w-10 flex items-center justify-center text-gray-400 hover:text-gray-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500 rounded-xl"
      >
        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

function SubmitButton({ busy, children }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl py-3 text-sm transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
    >
      {busy ? <LoaderCircle className="w-4 h-4 animate-spin" /> : null}
      {children}
    </button>
  );
}

/** Form shown when arriving from the "reset password" e-mail (?reset=1). */
function ResetPasswordForm({ onDone }) {
  const { user, isLoadingAuth } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) return setError('La password deve avere almeno 6 caratteri.');
    if (password !== confirm) return setError('Le password non coincidono.');
    setBusy(true);
    try {
      await db.auth.updatePassword(password);
      toast.success('Password aggiornata!');
      onDone();
    } catch (err) {
      setError(err.message || 'Aggiornamento non riuscito. Riprova.');
    } finally {
      setBusy(false);
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="flex justify-center py-8">
        <LoaderCircle className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }
  if (!user) {
    return (
      <p className="text-red-600 text-sm bg-red-50 rounded-xl px-4 py-2">
        Il link per reimpostare la password non è valido o è scaduto. Richiedine uno nuovo dalla pagina di accesso.
      </p>
    );
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-gray-600">
        Imposta una nuova password per <strong>{user.email}</strong>.
      </p>
      {error && <p className="text-red-600 text-sm bg-red-50 rounded-xl px-4 py-2">{error}</p>}
      <div>
        <label htmlFor="new-password" className={labelCls}>
          Nuova password *
        </label>
        <PasswordInput id="new-password" value={password} onChange={setPassword} autoComplete="new-password" />
      </div>
      <div>
        <label htmlFor="confirm-password" className={labelCls}>
          Conferma password *
        </label>
        <PasswordInput id="confirm-password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
      </div>
      <SubmitButton busy={busy}>Salva nuova password</SubmitButton>
    </form>
  );
}

export default function ClientLogin() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, isLoadingAuth } = useAuth();
  const isReset = params.get('reset') === '1';
  const next = safeNext(params.get('next'));

  const [mode, setMode] = useState('login');
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const busyRef = useRef(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const signInWithGoogle = async () => {
    setError('');
    try {
      // Torna su questa pagina (con ?next=...): l'effetto qui sotto porta poi alla destinazione.
      await db.auth.loginWithProvider('google', window.location.href);
    } catch (e) {
      setError(e.message || 'Accesso con Google non riuscito.');
    }
  };

  // Already logged in -> go straight to the destination.
  useEffect(() => {
    if (!isReset && !isLoadingAuth && user && !busyRef.current) navigate(next, { replace: true });
  }, [isReset, isLoadingAuth, user, next, navigate]);

  const run = async (fn) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError('');
    setInfo('');
    try {
      await fn();
    } catch (err) {
      setError(err.message || 'Si è verificato un errore. Riprova.');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (!form.email.trim() || !form.password) {
      setError('Inserisci email e password.');
      return;
    }
    run(async () => {
      await db.auth.signIn({ email: form.email, password: form.password });
      navigate(next, { replace: true });
    });
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setError('');
    if (!form.first_name.trim() || !form.last_name.trim() || !form.email.trim() || !form.password) {
      setError('Compila tutti i campi obbligatori.');
      return;
    }
    if (form.password.length < 6) {
      setError('La password deve avere almeno 6 caratteri.');
      return;
    }
    run(async () => {
      const profile = {
        email: form.email.toLowerCase().trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim(),
      };
      const { user: created, needsConfirmation } = await db.auth.signUp({ ...profile, password: form.password });
      if (needsConfirmation) {
        // No session yet: the profile row is created at first login.
        stashPendingProfile(profile);
        setInfo(
          `Ti abbiamo inviato un'email di conferma a ${profile.email}. Clicca sul link per attivare l'account, poi accedi.`,
        );
        setMode('login');
        setForm((f) => ({ ...EMPTY, email: f.email }));
        return;
      }
      await ensureClientProfile(created || profile, profile);
      navigate(next, { replace: true });
    });
  };

  const handleForgot = () => {
    if (!form.email.trim()) {
      setError('Inserisci la tua email per reimpostare la password.');
      setInfo('');
      return;
    }
    run(async () => {
      await db.auth.resetPassword(form.email);
      setInfo("Ti abbiamo inviato un'email con il link per reimpostare la password.");
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4 pt-24">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Area Clienti</h1>
          <p className="text-gray-500 text-sm mt-1">
            {isReset ? 'Reimposta la tua password' : 'Accedi o registrati per vedere i tuoi appuntamenti e report'}
          </p>
        </div>

        {isReset ? (
          <ResetPasswordForm onDone={() => navigate(createPageUrl('ClientArea'), { replace: true })} />
        ) : (
          <>
            <div className="flex rounded-xl bg-gray-100 p-1 mb-6" role="tablist">
              {['login', 'register'].map((m) => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => {
                    setMode(m);
                    setError('');
                    setInfo('');
                  }}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${mode === m ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
                >
                  {m === 'login' ? 'Accedi' : 'Registrati'}
                </button>
              ))}
            </div>

            {error && (
              <p role="alert" className="text-red-600 text-sm bg-red-50 rounded-xl px-4 py-2 mb-4">
                {error}
              </p>
            )}
            {info && (
              <p role="status" className="text-green-700 text-sm bg-green-50 rounded-xl px-4 py-2 mb-4">
                {info}
              </p>
            )}

            {GOOGLE_AUTH && (
              <>
            <button
              type="button"
              id="client-google-btn"
              onClick={signInWithGoogle}
              className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500"
            >
              <GoogleIcon />
              {mode === 'login' ? 'Accedi con Google' : 'Registrati con Google'}
            </button>
            <div className="flex items-center gap-3 my-4 text-xs text-gray-400">
              <span className="flex-1 h-px bg-gray-200" />
              oppure con email
              <span className="flex-1 h-px bg-gray-200" />
            </div>
              </>
            )}

            <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
              {mode === 'register' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="cl-first" className={labelCls}>
                      Nome *
                    </label>
                    <input
                      id="cl-first"
                      autoComplete="given-name"
                      value={form.first_name}
                      onChange={(e) => set('first_name', e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label htmlFor="cl-last" className={labelCls}>
                      Cognome *
                    </label>
                    <input
                      id="cl-last"
                      autoComplete="family-name"
                      value={form.last_name}
                      onChange={(e) => set('last_name', e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>
              )}
              {mode === 'register' && (
                <div>
                  <label htmlFor="cl-phone" className={labelCls}>
                    Telefono
                  </label>
                  <input
                    id="cl-phone"
                    type="tel"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={(e) => set('phone', e.target.value)}
                    className={inputCls}
                  />
                </div>
              )}
              <div>
                <label htmlFor="cl-email" className={labelCls}>
                  Email *
                </label>
                <input
                  id="cl-email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="cl-password" className={labelCls}>
                  Password *
                </label>
                <PasswordInput
                  id="cl-password"
                  value={form.password}
                  onChange={(v) => set('password', v)}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={handleForgot}
                    disabled={busy}
                    className="mt-2 text-xs text-gray-400 hover:text-red-600 transition-colors"
                  >
                    Password dimenticata?
                  </button>
                )}
              </div>
              <SubmitButton busy={busy}>{mode === 'login' ? 'Accedi' : 'Crea Account'}</SubmitButton>
            </form>
          </>
        )}

        <p className="text-center text-xs text-gray-400 mt-6">
          <Link to={createPageUrl('Home')} className="hover:text-gray-700">
            ← Torna alla Home
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
