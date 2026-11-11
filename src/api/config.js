// Central runtime configuration.
// When the Supabase variables are missing the app runs in DEMO mode:
// every record lives in the visitor's browser (localStorage).

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
export const IS_DEMO = !SUPABASE_URL || !SUPABASE_ANON_KEY;

export const THERAPIST_EMAIL = (
  import.meta.env.VITE_THERAPIST_EMAIL || 'massolab.simoneciacchi@gmail.com'
).toLowerCase();

// Demo-only therapist password (never used when Supabase is configured).
export const DEMO_THERAPIST_PASSWORD = 'massolab-demo';

export const BUSINESS = {
  name: 'Masso Lab',
  owner: 'Simone Ciacchi',
  phone: '+39 339 108 4384',
  phoneRaw: '+393391084384',
  whatsapp: '393391084384',
  email: 'massolab.simoneciacchi@gmail.com',
  city: 'Lacchiarella',
  radiusKm: 20,
  logo: import.meta.env.BASE_URL + 'images/logo.png',
};

export const whatsappUrl = (text = 'Ciao Simone, vorrei informazioni sui trattamenti') =>
  `https://wa.me/${BUSINESS.whatsapp}?text=${encodeURIComponent(text)}`;
