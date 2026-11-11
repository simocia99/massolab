import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Send, User } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { db } from '@/api/client';
import { absolutePageUrl, escapeHtml } from '@/lib/utils';
import { SectionHeader } from './shared';

const Avatar = ({ name }) => (
  <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
    <span className="text-red-600 font-bold text-sm">{(name || '?').charAt(0).toUpperCase()}</span>
  </div>
);

export default function MessagesTab({ appointments }) {
  const [messages, setMessages] = useState([]);
  const [selected, setSelected] = useState(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const endRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    db.entities.ClientAccount.list()
      .then((rows) => !cancelled && setAccounts(rows))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const contacts = useMemo(() => {
    const map = {};
    accounts.forEach((c) => {
      map[c.email] = { email: c.email, name: `${c.first_name} ${c.last_name}` };
    });
    appointments
      .filter((a) => !a.is_guest && a.email)
      .forEach((a) => {
        if (!map[a.email]) map[a.email] = { email: a.email, name: `${a.first_name} ${a.last_name}` };
      });
    return Object.values(map);
  }, [accounts, appointments]);

  const load = useCallback(async () => {
    try {
      const rows = await db.entities.Message.list('-created_date', 200);
      setMessages(rows.reverse());
    } catch {
      toast.error('Impossibile caricare i messaggi');
    }
  }, []);

  useEffect(() => {
    load();
    return db.entities.Message.subscribe((ev) => {
      // Events without payload (e.g. another tab changed data) -> reload.
      if (!ev?.data) return load();
      setMessages((prev) => {
        if (ev.type === 'create') return prev.some((m) => m.id === ev.data.id) ? prev : [...prev, ev.data];
        if (ev.type === 'update') return prev.map((m) => (m.id === ev.id ? ev.data : m));
        if (ev.type === 'delete') return prev.filter((m) => m.id !== ev.id);
        return prev;
      });
    });
  }, [load]);

  const thread = selected ? messages.filter((m) => m.client_email === selected.email) : [];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [thread.length, selected]);

  const unreadFor = (email) => messages.filter((m) => m.client_email === email && m.sender === 'client' && !m.read).length;

  const send = async () => {
    const content = text.trim();
    if (!content || !selected || sending) return;
    setSending(true);
    try {
      await db.entities.Message.create({
        client_email: selected.email,
        client_name: selected.name,
        sender: 'therapist',
        content,
        read: true,
      });
      setText('');
      db.integrations.Core.SendEmail({
        to: selected.email,
        from_name: 'MassoLab — Simone Ciacchi',
        subject: 'Hai un nuovo messaggio da Simone Ciacchi',
        body: `<div style="font-family:sans-serif;max-width:520px;margin:auto;padding:28px;background:#f9fafb;border-radius:16px;">
        <h2 style="color:#dc2626;margin-bottom:8px;">Nuovo messaggio dal terapista</h2>
        <p style="color:#374151;">Ciao <strong>${escapeHtml(selected.name.split(' ')[0])}</strong>, hai ricevuto un messaggio da <strong>Simone Ciacchi</strong>:</p>
        <div style="background:#fff;border-left:4px solid #dc2626;border-radius:8px;padding:16px 20px;margin:20px 0;color:#111827;white-space:pre-line;">
          ${escapeHtml(content)}
        </div>
        <div style="text-align:center;margin:24px 0;">
          <a href="${absolutePageUrl('ClientArea')}" style="background:#dc2626;color:white;padding:12px 28px;border-radius:12px;text-decoration:none;font-weight:bold;">💬 Rispondi nell'Area Clienti</a>
        </div>
        <p style="color:#9ca3af;font-size:12px;text-align:center;">MassoLab — Simone Ciacchi</p>
      </div>`,
      }).catch(() => toast.error('Messaggio salvato, ma la notifica email non è stata inviata'));
    } catch (e) {
      toast.error(e.message || 'Invio non riuscito');
    } finally {
      setSending(false);
    }
  };

  const open = async (contact) => {
    setSelected(contact);
    const unread = messages.filter((m) => m.client_email === contact.email && m.sender === 'client' && !m.read);
    try {
      await Promise.all(unread.map((m) => db.entities.Message.update(m.id, { read: true })));
      setMessages((prev) => prev.map((m) => (unread.some((u) => u.id === m.id) ? { ...m, read: true } : m)));
    } catch {
      /* non-blocking */
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader title="Messaggi" subtitle="Chat con i tuoi clienti registrati" />
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex h-[calc(100dvh-220px)] min-h-[420px] lg:h-[560px]">
        <div className={`w-full md:w-64 border-r border-gray-100 flex-col flex-shrink-0 ${selected ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-gray-100">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Clienti</p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {contacts.length === 0 && <p className="p-4 text-sm text-gray-400">Nessun cliente registrato.</p>}
            {contacts.map((c) => {
              const unread = unreadFor(c.email);
              return (
                <button
                  key={c.email}
                  onClick={() => open(c)}
                  className={`w-full text-left p-4 hover:bg-gray-50 transition-colors flex items-center gap-3 ${selected?.email === c.email ? 'bg-red-50' : ''}`}
                >
                  <Avatar name={c.name} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                  </div>
                  {unread > 0 && (
                    <span
                      className="w-5 h-5 bg-red-600 rounded-full text-white text-xs flex items-center justify-center flex-shrink-0"
                      aria-label={`${unread} non letti`}
                    >
                      {unread}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        <div className={`flex-1 flex-col min-w-0 ${selected ? 'flex' : 'hidden md:flex'}`}>
          {selected ? (
            <>
              <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                <button
                  onClick={() => setSelected(null)}
                  aria-label="Torna alla lista clienti"
                  className="md:hidden p-1 -ml-1 rounded-lg hover:bg-gray-100"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-500" />
                </button>
                <Avatar name={selected.name} />
                <p className="font-semibold text-gray-900 truncate">{selected.name}</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {thread.length === 0 && (
                  <p className="text-center text-gray-400 text-sm">Nessun messaggio ancora. Inizia la conversazione!</p>
                )}
                {thread.map((m) => (
                  <div key={m.id} className={`flex ${m.sender === 'therapist' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] lg:max-w-md rounded-2xl px-4 py-2.5 ${m.sender === 'therapist' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-900'}`}
                    >
                      <p className="text-sm whitespace-pre-line break-words">{m.content}</p>
                      <p className={`text-xs mt-1 ${m.sender === 'therapist' ? 'text-red-200' : 'text-gray-400'}`}>
                        {m.created_date ? format(new Date(m.created_date), 'HH:mm') : ''}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={endRef} />
              </div>
              <div className="p-3 sm:p-4 border-t border-gray-100">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
                    placeholder="Scrivi un messaggio..."
                    aria-label="Messaggio"
                    className="flex-1 min-w-0 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-400"
                  />
                  <button
                    onClick={send}
                    disabled={!text.trim() || sending}
                    aria-label="Invia messaggio"
                    className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-4 py-2.5 transition-colors disabled:opacity-40"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Seleziona un cliente per chattare</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
