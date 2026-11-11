// ClientAccount = profile row of a logged-in client (no password: auth is
// handled by db.auth). Owner field: `email` (= auth user e-mail, lowercase).
import { db } from '@/api/client';

const PENDING_KEY = 'massolab:pending_profile';

/** Remember signup data while the user confirms the e-mail address. */
export function stashPendingProfile(profile) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(profile));
  } catch {
    /* storage unavailable: phone number will just be empty */
  }
}

function takePendingProfile(email) {
  try {
    const p = JSON.parse(localStorage.getItem(PENDING_KEY) || 'null');
    if (p && p.email === email) {
      localStorage.removeItem(PENDING_KEY);
      return p;
    }
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Returns the ClientAccount of `user`, creating it on first login.
 * Never throws: falls back to the auth data so the area still works.
 */
export async function ensureClientProfile(user, extra = {}) {
  const email = (user.email || '').toLowerCase();
  const fallback = {
    email,
    first_name: extra.first_name ?? user.first_name ?? '',
    last_name: extra.last_name ?? user.last_name ?? '',
    phone: extra.phone ?? user.phone ?? '',
  };
  try {
    const rows = await db.entities.ClientAccount.filter({ email });
    if (rows.length) return rows[0];
    const pending = takePendingProfile(email) || {};
    return await db.entities.ClientAccount.create({
      email,
      first_name: (fallback.first_name || pending.first_name || '').trim(),
      last_name: (fallback.last_name || pending.last_name || '').trim(),
      phone: (fallback.phone || pending.phone || '').trim(),
    });
  } catch (err) {
    console.warn('Profilo cliente non disponibile:', err);
    return fallback;
  }
}
