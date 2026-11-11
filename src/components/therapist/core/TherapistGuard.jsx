import { Navigate } from 'react-router-dom';
import { LogOut, TriangleAlert } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { createPageUrl, pageUrl } from '@/lib/utils';

function FullScreenSpinner() {
  return (
    <div className="min-h-screen bg-[#1a1816] flex items-center justify-center" role="status" aria-label="Caricamento">
      <div className="w-8 h-8 border-4 border-white/20 border-t-red-500 rounded-full animate-spin" />
    </div>
  );
}

function AccessDenied({ email, onLogout }) {
  return (
    <div className="min-h-screen bg-[#1a1816] flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/10 text-center">
        <div className="w-14 h-14 rounded-full bg-red-500/15 flex items-center justify-center mb-4 mx-auto">
          <TriangleAlert className="w-7 h-7 text-danger" />
        </div>
        <p className="text-white font-semibold">Accesso negato</p>
        <p className="text-gray-500 text-sm mt-1">
          L&apos;account {email ? <strong className="text-gray-300">{email}</strong> : ''} non è abilitato all&apos;area terapista.
        </p>
        <button
          onClick={onLogout}
          className="mt-6 w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white rounded-xl py-3.5 font-semibold transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Esci e accedi con l&apos;account giusto
        </button>
      </div>
    </div>
  );
}

/**
 * Renders children only for the logged-in therapist (replaces the original
 * client-side e-mail check; RLS enforces the same rule server-side).
 */
export default function TherapistGuard({ children }) {
  const { user, isAuthenticated, isTherapist, isLoadingAuth, logout } = useAuth();
  if (isLoadingAuth) return <FullScreenSpinner />;
  if (!isAuthenticated) return <Navigate to={createPageUrl('TherapistLogin')} replace />;
  if (!isTherapist) return <AccessDenied email={user?.email} onLogout={() => logout(pageUrl('TherapistLogin'))} />;
  return children;
}
