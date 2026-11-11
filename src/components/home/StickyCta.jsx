import { Link } from 'react-router-dom';
import { Calendar, MessageCircle } from 'lucide-react';
import { createPageUrl } from '@/lib/utils';
import { whatsappUrl } from '@/api/config';

/** Mobile-only sticky booking bar (original `D3`). */
export default function StickyCta() {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-white border-t border-gray-200 px-4 py-3 flex gap-3 shadow-2xl"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <Link
        to={createPageUrl('GuestBooking')}
        className="flex-1 w-full inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white rounded-xl py-3.5 font-bold text-sm transition-colors"
      >
        <Calendar className="w-4 h-4" />
        Prenota ora
      </Link>
      <a
        href={whatsappUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 w-full inline-flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl py-3.5 font-bold text-sm transition-colors"
      >
        <MessageCircle className="w-4 h-4 text-green-400" />
        WhatsApp
      </a>
    </div>
  );
}
