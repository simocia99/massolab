import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { db } from '@/api/client';

// Visible only when Supabase is not configured. On the mobile Home it sits
// above the sticky "Prenota ora" bar; elsewhere it stays in the corner.
export default function DemoBanner() {
  const { pathname } = useLocation();
  const [hidden, setHidden] = useState(() => {
    try {
      return sessionStorage.getItem('demo-banner') === '0';
    } catch {
      return false;
    }
  });
  if (!db.isDemo || hidden) return null;
  const onHome = pathname === '/' || pathname === '/Home';
  return (
    <div
      role="status"
      className={`fixed ${onHome ? 'bottom-24' : 'bottom-3'} md:bottom-3 left-3 z-[60] max-w-[calc(100vw-1.5rem)] md:max-w-xs rounded-2xl bg-amber-50/95 border border-amber-200 text-amber-900 text-xs px-3 py-2 shadow-lg`}
    >
      <b>Modalità demo</b> — i dati restano solo in questo browser.
      <button
        type="button"
        className="ml-2 underline font-semibold"
        onClick={() => {
          try {
            sessionStorage.setItem('demo-banner', '0');
          } catch {
            /* storage blocked */
          }
          setHidden(true);
        }}
      >
        Chiudi
      </button>
    </div>
  );
}
