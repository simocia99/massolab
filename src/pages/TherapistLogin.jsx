import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, LoaderCircle, Lock, LogOut, ShieldCheck, TriangleAlert } from 'lucide-react';
import { db } from '@/api/client';
import { DEMO_THERAPIST_PASSWORD, GOOGLE_AUTH, THERAPIST_EMAIL } from '@/api/config';
import { useAuth } from '@/lib/AuthContext';
import { absolutePageUrl, createPageUrl } from '@/lib/utils';

export function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

const inputCls =
  'w-full bg-white/10 border border-white/15 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500';

export default function TherapistLogin() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isTherapist, isLoadingAuth, logout } = useAuth();
  const [email, setEmail] = useState(db.isDemo ? THERAPIST_EMAIL : '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const state = isLoadingAuth ? 'checking' : !isAuthenticated ? 'unauth' : isTherapist ? 'authed' : 'denied';

  useEffect(() => {
    if (state !== 'authed') return;
    const t = setTimeout(() => navigate(createPageUrl('TherapistDashboard'), { replace: true }), 650);
    return () => clearTimeout(t);
  }, [state, navigate]);

  const signInWithGoogle = async () => {
    setError('');
    try {
      await db.auth.loginWithProvider('google', absolutePageUrl('TherapistLogin'));
    } catch (e) {
      setError(e.message || 'Accesso con Google non riuscito.');
    }
  };

  const signInWithPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await db.auth.signIn({ email, password });
      // AuthContext picks up the new session and the effect above redirects.
    } catch (err) {
      setError(err.message || 'Accesso non riuscito.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1816] flex items-center justify-center px-6 py-10">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-red-600 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white" style={{ letterSpacing: '-0.02em' }}>
            Area Terapista
          </h1>
          <p className="text-gray-400 mt-2">Accesso riservato a Simone Ciacchi</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-white/10">
          {state === 'checking' && (
            <div className="flex flex-col items-center py-8" role="status">
              <div className="w-8 h-8 border-4 border-white/20 border-t-red-500 rounded-full animate-spin" />
              <p className="text-gray-400 text-sm mt-4">Verifica accesso…</p>
            </div>
          )}

          {state === 'authed' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center py-6 text-center"
            >
              <div className="w-14 h-14 rounded-full bg-green-500/15 flex items-center justify-center mb-4">
                <ShieldCheck className="w-7 h-7 text-green-400" />
              </div>
              <p className="text-white font-semibold">Accesso autorizzato</p>
              <p className="text-gray-400 text-sm mt-1">Benvenuto, {user?.full_name || user?.email}. Reindirizzamento…</p>
            </motion.div>
          )}

          {state === 'unauth' && (
            <div className="space-y-5">
              {GOOGLE_AUTH ? (
                <>
              <p className="text-gray-300 text-sm text-center">
                Accedi con il tuo account Google autorizzato per entrare nell&apos;area riservata.
              </p>
              <button
                id="therapist-google-btn"
                type="button"
                onClick={signInWithGoogle}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 rounded-xl py-3.5 font-semibold transition-colors"
              >
                <GoogleIcon />
                Accedi con Google
              </button>

              <div className="flex items-center gap-3 text-gray-500 text-xs">
                <span className="flex-1 h-px bg-white/10" />
                oppure con email e password
                <span className="flex-1 h-px bg-white/10" />
              </div>
                </>
              ) : (
                <p className="text-gray-300 text-sm text-center">Accedi con email e password per entrare nell&apos;area riservata.</p>
              )}

              <form onSubmit={signInWithPassword} className="space-y-3">
                <label className="sr-only" htmlFor="therapist-email">
                  Email
                </label>
                <input
                  id="therapist-email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className={inputCls}
                />
                <div className="relative">
                  <label className="sr-only" htmlFor="therapist-password">
                    Password
                  </label>
                  <input
                    id="therapist-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className={`${inputCls} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-2.5 -mr-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-500 rounded-lg"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white rounded-xl py-3.5 font-semibold transition-colors disabled:opacity-60"
                >
                  {submitting && <LoaderCircle className="w-4 h-4 animate-spin" />}
                  Accedi
                </button>
              </form>

              {error && (
                <p className="text-red-400 text-sm text-center" role="alert">
                  {error}
                </p>
              )}

              {db.isDemo && (
                <p className="text-amber-300/90 text-xs text-center bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
                  Modalità demo — email: <strong className="break-all">{THERAPIST_EMAIL}</strong> · password:{' '}
                  <strong>{DEMO_THERAPIST_PASSWORD}</strong>
                </p>
              )}

              <p className="text-gray-500 text-xs text-center">
                Accesso consentito solo all&apos;account <span className="break-all">{THERAPIST_EMAIL}</span>
              </p>
            </div>
          )}

          {state === 'denied' && (
            <div className="space-y-5">
              <div className="flex flex-col items-center text-center py-2">
                <div className="w-14 h-14 rounded-full bg-red-500/15 flex items-center justify-center mb-4">
                  <TriangleAlert className="w-7 h-7 text-red-400" />
                </div>
                <p className="text-white font-semibold">Account non autorizzato</p>
                <p className="text-gray-400 text-sm mt-1">
                  L&apos;account con cui hai effettuato l&apos;accesso non è abilitato all&apos;area terapista.
                </p>
              </div>
              <button
                onClick={() => logout()}
                className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white rounded-xl py-3.5 font-semibold transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Esci e accedi con l&apos;account giusto
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
