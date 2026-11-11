// Authentication for both clients (email + password) and the therapist
// (Google or email + password). The therapist is recognised by e-mail;
// in production the database enforces this too (admins table + RLS).
import { DEMO_THERAPIST_PASSWORD, IS_DEMO, THERAPIST_EMAIL } from './config';
import { supabase } from './supabaseClient';
import { pageUrl } from '@/lib/utils';

const SESSION_KEY = 'massolab:session';
const USERS_KEY = 'massolab:users';

export const isTherapistEmail = (email) => (email || '').toLowerCase().trim() === THERAPIST_EMAIL;

const unauthorized = () => Object.assign(new Error('Non autenticato'), { status: 401 });

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

const toUser = (u) =>
  u && {
    id: u.id,
    email: (u.email || '').toLowerCase(),
    full_name:
      u.user_metadata?.full_name ||
      [u.user_metadata?.first_name, u.user_metadata?.last_name].filter(Boolean).join(' ') ||
      u.full_name ||
      u.email,
    first_name: u.user_metadata?.first_name ?? u.first_name ?? '',
    last_name: u.user_metadata?.last_name ?? u.last_name ?? '',
    phone: u.user_metadata?.phone ?? u.phone ?? '',
    // UI hint only: the database decides (admins table + confirmed e-mail).
    role: isTherapistEmail(u.email) && (IS_DEMO || u.email_confirmed_at) ? 'admin' : 'client',
  };

/* ------------------------------ DEMO (local) ----------------------------- */
const local = {
  users() {
    try {
      return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    } catch {
      return [];
    }
  },
  save(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },
  session() {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    } catch {
      return null;
    }
  },
  setSession(u) {
    if (u) localStorage.setItem(SESSION_KEY, JSON.stringify(u));
    else localStorage.removeItem(SESSION_KEY);
    window.dispatchEvent(new Event('massolab:auth'));
  },
};

/* --------------------------------- API ----------------------------------- */
export const auth = {
  /** Current user or throws {status:401}. */
  async me() {
    if (IS_DEMO) {
      const s = local.session();
      if (!s) throw unauthorized();
      return toUser(s);
    }
    const { data } = await supabase.auth.getUser();
    if (!data?.user) throw unauthorized();
    return toUser(data.user);
  },

  async isAuthenticated() {
    try {
      await this.me();
      return true;
    } catch {
      return false;
    }
  },

  async signUp({ email, password, first_name = '', last_name = '', phone = '' }) {
    email = email.toLowerCase().trim();
    if (IS_DEMO) {
      const users = local.users();
      if (users.some((u) => u.email === email)) throw new Error('Email già registrata. Accedi.');
      const user = { id: crypto.randomUUID(), email, first_name, last_name, phone, password_hash: await sha256(password) };
      local.save([...users, user]);
      const { password_hash, ...session } = user;
      local.setSession(session);
      return { user: toUser(session), needsConfirmation: false };
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name, last_name, phone, full_name: `${first_name} ${last_name}`.trim() },
        emailRedirectTo: window.location.origin + pageUrl('ClientArea'),
      },
    });
    if (error) throw new Error(translateAuthError(error.message));
    return { user: toUser(data.user), needsConfirmation: !data.session };
  },

  async signIn({ email, password }) {
    email = email.toLowerCase().trim();
    if (IS_DEMO) {
      if (isTherapistEmail(email)) {
        if (password !== DEMO_THERAPIST_PASSWORD) throw new Error('Password errata.');
        const session = { id: 'therapist', email, full_name: 'Simone Ciacchi' };
        local.setSession(session);
        return toUser(session);
      }
      const user = local.users().find((u) => u.email === email);
      if (!user) throw new Error('Email non trovata. Registrati prima.');
      if (user.password_hash !== (await sha256(password))) throw new Error('Password errata.');
      const { password_hash, ...session } = user;
      local.setSession(session);
      return toUser(session);
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(translateAuthError(error.message));
    return toUser(data.user);
  },

  async loginWithProvider(provider = 'google', redirectTo = window.location.href) {
    if (IS_DEMO) throw new Error("L'accesso con Google è disponibile solo con Supabase configurato.");
    const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
    if (error) throw new Error(error.message);
  },

  async resetPassword(email) {
    if (IS_DEMO) throw new Error('Il recupero password non è disponibile in modalità demo.');
    const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
      redirectTo: window.location.origin + pageUrl('ClientLogin') + '?reset=1',
    });
    if (error) throw new Error(translateAuthError(error.message));
  },

  async updatePassword(newPassword) {
    if (IS_DEMO) throw new Error('Non disponibile in modalità demo.');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(translateAuthError(error.message));
  },

  async logout(redirectUrl) {
    if (IS_DEMO) local.setSession(null);
    else await supabase.auth.signOut();
    if (redirectUrl) window.location.href = redirectUrl;
  },

  redirectToLogin(nextUrl = window.location.href) {
    window.location.href = `${pageUrl('ClientLogin')}?next=${encodeURIComponent(nextUrl)}`;
  },

  /** Subscribe to login/logout. Returns an unsubscribe function. */
  onChange(cb) {
    if (IS_DEMO) {
      const h = () => cb(local.session() ? toUser(local.session()) : null);
      window.addEventListener('massolab:auth', h);
      window.addEventListener('storage', h);
      return () => {
        window.removeEventListener('massolab:auth', h);
        window.removeEventListener('storage', h);
      };
    }
    const { data } = supabase.auth.onAuthStateChange((_e, session) => cb(session?.user ? toUser(session.user) : null));
    return () => data.subscription.unsubscribe();
  },
};

function translateAuthError(msg = '') {
  const m = msg.toLowerCase();
  if (m.includes('invalid login')) return 'Email o password non corretti.';
  if (m.includes('already registered')) return 'Email già registrata. Accedi.';
  if (m.includes('email not confirmed')) return "Conferma prima l'email: controlla la tua casella di posta.";
  if (m.includes('password should be')) return 'La password deve avere almeno 6 caratteri.';
  if (m.includes('rate limit')) return 'Troppi tentativi. Riprova tra qualche minuto.';
  return msg;
}
