import { Link } from 'react-router-dom';
import { House } from 'lucide-react';
import { createPageUrl } from '@/lib/utils';

/** 404 page, rendered without the Layout (original `rne`). */
export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F3F0EA] flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-8xl font-bold text-gray-200 mb-4">404</h1>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Pagina non trovata</h2>
        <p className="text-gray-500 mb-8">La pagina che stai cercando non esiste.</p>
        <Link
          to={createPageUrl('Home')}
          className="inline-flex items-center gap-2 bg-red-600 text-white rounded-full px-6 py-3 font-semibold hover:bg-red-700 transition-colors"
        >
          <House className="w-4 h-4" />
          Torna alla Home
        </Link>
      </div>
    </div>
  );
}
