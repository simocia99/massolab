import { useCallback, useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { MessageCircle, Send } from 'lucide-react';
import { db } from '@/api/client';

/** "Messaggi" tab: chat with the therapist (bundle `m4`). */
export default function ClientMessages({ clientEmail, clientName }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const rows = await db.entities.Message.filter({ client_email: clientEmail });
      setMessages([...rows].sort((a, b) => new Date(a.created_date) - new Date(b.created_date)));
      rows
        .filter((m) => m.sender === 'therapist' && !m.read)
        .forEach((m) => db.entities.Message.update(m.id, { read: true }).catch(() => {}));
    } catch {
      toast.error('Impossibile caricare i messaggi.');
    }
  }, [clientEmail]);

  useEffect(() => {
    load();
    // Realtime: reload this client's thread on any change (events may lack data).
    const unsubscribe = db.entities.Message.subscribe((ev) => {
      if (!ev?.data?.client_email || ev.data.client_email === clientEmail || ev.type === 'delete') load();
    });
    return () => unsubscribe?.();
  }, [clientEmail, load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      await db.entities.Message.create({
        client_email: clientEmail,
        client_name: clientName,
        sender: 'client',
        content,
        read: false,
      });
      setText('');
      load();
      db.integrations.Core.SendNotification({
        type: 'client_message',
        data: { client_name: (clientName || '').slice(0, 100), content: content.slice(0, 2000) },
      }).catch((err) => console.warn('Notifica email non inviata:', err));
    } catch {
      toast.error('Invio del messaggio non riuscito. Riprova.');
    } finally {
      setSending(false);
    }
  };

  const unread = messages.filter((m) => m.sender === 'therapist' && !m.read).length;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-red-500" />
          Messaggi con il Terapista
          {unread > 0 && (
            <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unread} nuovi</span>
          )}
        </h2>
        <p className="text-sm text-gray-500">Comunicazione diretta con Simone Ciacchi</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col" style={{ height: '500px' }}>
        <div className="flex-1 overflow-y-auto p-4 space-y-3" aria-live="polite">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-300">
              <MessageCircle className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">
                Nessun messaggio ancora.
                <br />
                Scrivi al terapista!
              </p>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.sender === 'client' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-xs sm:max-w-sm rounded-2xl px-4 py-2.5 ${m.sender === 'client' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-900'}`}
              >
                {m.sender === 'therapist' && (
                  <p className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Simone Ciacchi</p>
                )}
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{m.content}</p>
                <p className={`text-xs mt-1 ${m.sender === 'client' ? 'text-red-200' : 'text-gray-500'}`}>
                  {m.created_date ? format(new Date(m.created_date), 'dd/MM HH:mm') : ''}
                </p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <div className="p-4 border-t border-gray-100">
          <div className="flex gap-3">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="Scrivi un messaggio..."
              aria-label="Scrivi un messaggio"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-400"
            />
            <button
              type="button"
              onClick={send}
              disabled={!text.trim() || sending}
              aria-label="Invia messaggio"
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-4 py-2.5 transition-colors disabled:opacity-40 flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
