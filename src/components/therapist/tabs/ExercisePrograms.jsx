import { useEffect, useMemo, useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Copy, LoaderCircle, Pen, Plus, Save, Search, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/api/client';
import { absolutePageUrl, escapeHtml } from '@/lib/utils';
import { CATEGORY_COLORS, EXERCISE_CATEGORIES, PROGRAM_TEMPLATES } from './exerciseTemplates';
import { ExerciseCard, ExerciseEditor, Pill, StickFigure } from './ExerciseParts';

const stripSystem = ({ id, created_date, updated_date, created_by, ...rest }) => rest;

function programEmailHtml(program) {
  return `<div style="font-family:sans-serif;max-width:520px;margin:auto;padding:28px;background:#f9fafb;border-radius:16px;">
        <h2 style="color:#dc2626;margin-top:0;">🏃 La tua scheda esercizi è pronta!</h2>
        <p>Ciao <strong>${escapeHtml(program.client_name || program.client_email)}</strong>,</p>
        <p>Simone ti ha preparato una nuova scheda di esercizi domiciliari: <strong>${escapeHtml(program.title)}</strong>.</p>
        <p style="margin:20px 0;">
          <a href="${absolutePageUrl('ClientArea')}" style="display:inline-block;background:#dc2626;color:white;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:bold;">
            📋 Visualizza la scheda nell'area clienti
          </a>
        </p>
        <p style="color:#6b7280;font-size:13px;">Trovi la scheda nella sezione <strong>Indicazioni → Esercizi</strong> della tua area personale.</p>
        <p style="color:#9ca3af;font-size:12px;margin-top:24px;"><strong>MassoLab — Simone Ciacchi</strong></p>
      </div>`;
}

const sendProgramEmail = (program) =>
  db.integrations.Core.SendEmail({
    to: program.client_email,
    from_name: 'MassoLab - Simone Ciacchi',
    subject: `La tua scheda esercizi: ${program.title}`,
    body: programEmailHtml(program),
  });

const labelCls = 'block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider';
const inputCls =
  'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400';

export default function ExercisePrograms({ appointments = [] }) {
  const [view, setView] = useState('programs'); // programs | library | new
  const [programs, setPrograms] = useState([]);
  const [library, setLibrary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clientEmail, setClientEmail] = useState('');
  const [clientName, setClientName] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('generale');
  const [exercises, setExercises] = useState([]);
  const [notes, setNotes] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [saving, setSaving] = useState(false);
  const [sendingId, setSendingId] = useState(null);
  const [filter, setFilter] = useState('tutti');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [editingProgram, setEditingProgram] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [p, ex] = await Promise.all([
        db.entities.ExerciseProgram.list('-created_date', 100),
        db.entities.Exercise.list('-created_date', 200),
      ]);
      setPrograms(p);
      setLibrary(ex);
    } catch {
      toast.error('Impossibile caricare le schede esercizi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Unique clients from appointments.
  const clients = useMemo(
    () => [
      ...new Map(
        (appointments || [])
          .filter((a) => a.email)
          .map((a) => [a.email, { email: a.email, name: `${a.first_name || ''} ${a.last_name || ''}`.trim() }]),
      ).values(),
    ],
    [appointments],
  );

  const resetForm = () => {
    setEditingProgram(null);
    setClientEmail('');
    setClientName('');
    setTitle('');
    setCategory('generale');
    setExercises([]);
    setNotes('');
  };

  const loadTemplate = (key) => {
    const tpl = PROGRAM_TEMPLATES[key];
    if (!tpl) return;
    setTitle(tpl.title);
    setCategory(key);
    setExercises(tpl.exercises.map((e, i) => ({ ...e, order: i })));
  };

  const save = async (status = 'draft') => {
    if (!clientEmail || !title) return;
    if (exercises.length === 0) {
      toast.error('Aggiungi almeno un esercizio alla scheda.');
      return;
    }
    setSaving(true);
    const data = {
      client_email: clientEmail.trim(),
      client_name: clientName,
      title,
      problem_category: category,
      exercises: exercises.map((e, i) => ({ ...e, order: i })),
      general_notes: notes,
      // Mark as sent only after the email went out (below).
      status: status === 'sent' ? editingProgram?.status || 'draft' : status,
    };
    try {
      const saved = editingProgram
        ? await db.entities.ExerciseProgram.update(editingProgram.id, data)
        : await db.entities.ExerciseProgram.create(data);
      if (status === 'sent') {
        try {
          await sendProgramEmail({ ...data, ...saved });
          await db.entities.ExerciseProgram.update(saved.id, { status: 'sent' });
          toast.success('Scheda inviata al cliente');
        } catch {
          toast.error('Scheda salvata, ma invio email non riuscito. Riprova con "Invia".');
        }
      } else {
        toast.success('Bozza salvata');
      }
      resetForm();
      setView('programs');
      load();
    } catch {
      toast.error('Salvataggio non riuscito. Riprova.');
    } finally {
      setSaving(false);
    }
  };

  const send = async (program) => {
    setSendingId(program.id);
    try {
      await sendProgramEmail(program);
      await db.entities.ExerciseProgram.update(program.id, { status: 'sent' });
      toast.success('Scheda inviata al cliente');
      load();
    } catch {
      toast.error('Invio non riuscito. Riprova.');
    } finally {
      setSendingId(null);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Eliminare questa scheda?')) return;
    try {
      await db.entities.ExerciseProgram.delete(id);
      load();
    } catch {
      toast.error('Eliminazione non riuscita.');
    }
  };

  const duplicate = async (program) => {
    try {
      await db.entities.ExerciseProgram.create({
        ...stripSystem(program),
        title: `${program.title} (copia)`,
        status: 'draft',
      });
      load();
    } catch {
      toast.error('Duplicazione non riuscita.');
    }
  };

  const edit = (program) => {
    setEditingProgram(program);
    setClientEmail(program.client_email);
    setClientName(program.client_name || '');
    setTitle(program.title);
    setCategory(program.problem_category || 'generale');
    setExercises(program.exercises || []);
    setNotes(program.general_notes || '');
    setView('new');
  };

  const addExercise = () => {
    setExercises((list) => [
      ...list,
      {
        name: 'Nuovo esercizio',
        description: '',
        image_url: '',
        sets: 3,
        reps: '10',
        duration: '',
        frequency: '1x al giorno',
        notes: '',
        order: list.length,
      },
    ]);
    setEditingIndex(exercises.length);
  };

  const filteredLibrary = library.filter(
    (e) =>
      (filter === 'tutti' || e.category === filter) && (!search || e.name?.toLowerCase().includes(search.toLowerCase())),
  );
  const filteredPrograms = programs.filter((p) => filter === 'tutti' || p.problem_category === filter);
  const knownClient = clients.some((c) => c.email === clientEmail);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Schede Esercizi</h2>
          <p className="text-gray-500">Crea e invia programmi domiciliari personalizzati</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setView('library');
              setFilter('tutti');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              view === 'library' ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <BookOpen className="w-4 h-4" /> Libreria
          </button>
          <button
            onClick={() => {
              resetForm();
              setView('new');
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors bg-red-600 text-white hover:bg-red-700"
          >
            <Plus className="w-4 h-4" /> Nuova Scheda
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
          {['tutti', ...EXERCISE_CATEGORIES].map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all border ${
                filter === c ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {c}
            </button>
          ))}
      </div>

      {view === 'programs' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <LoaderCircle className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : filteredPrograms.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Nessuna scheda trovata. Crea la prima!</p>
            </div>
          ) : (
            filteredPrograms.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 sm:p-5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-bold text-gray-900">{p.title}</p>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          p.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {p.status === 'sent' ? 'Inviata' : 'Bozza'}
                      </span>
                      {p.problem_category && (
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                            CATEGORY_COLORS[p.problem_category] || 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {p.problem_category}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 break-words">
                      {p.client_name || p.client_email} · {(p.exercises || []).length} esercizi
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                      className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors"
                      title="Espandi"
                      aria-label="Espandi"
                      aria-expanded={expandedId === p.id}
                    >
                      {expandedId === p.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => edit(p)}
                      className="p-2 hover:bg-blue-50 rounded-xl text-gray-400 hover:text-blue-600 transition-colors"
                      title="Modifica"
                      aria-label="Modifica"
                    >
                      <Pen className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => duplicate(p)}
                      className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors"
                      title="Duplica"
                      aria-label="Duplica"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    {p.status !== 'sent' && (
                      <button
                        onClick={() => send(p)}
                        disabled={sendingId === p.id}
                        aria-label="Invia"
                        className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-60"
                      >
                        {sendingId === p.id ? (
                          <LoaderCircle className="w-3 h-3 animate-spin" />
                        ) : (
                          <Send className="w-3 h-3" />
                        )}
                        <span className="hidden sm:inline">Invia</span>
                      </button>
                    )}
                    <button
                      onClick={() => remove(p.id)}
                      className="p-2 hover:bg-red-50 rounded-xl text-gray-400 hover:text-red-600 transition-colors"
                      title="Elimina"
                      aria-label="Elimina"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {expandedId === p.id && (
                  <div className="border-t border-gray-50 p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(p.exercises || []).map((ex, i) => (
                      <div key={i} className="flex gap-3 bg-gray-50 rounded-xl p-3">
                        <div className="w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                          {ex.image_url ? (
                            <img
                              src={ex.image_url}
                              alt={ex.name}
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-cover"
                              style={{ filter: 'grayscale(60%)' }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <StickFigure small className="w-8 h-8" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-gray-900">{ex.name}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {!!ex.sets && (
                              <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">{ex.sets} serie</span>
                            )}
                            {ex.reps && (
                              <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">{ex.reps} rip.</span>
                            )}
                            {ex.duration && (
                              <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">{ex.duration}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {view === 'library' && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca esercizio..."
                aria-label="Cerca esercizio"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400"
              />
            </div>
          </div>
          {loading ? (
            <div className="flex justify-center py-12">
              <LoaderCircle className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : filteredLibrary.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
              <p>Nessun esercizio in libreria per questa categoria.</p>
              <p className="text-sm mt-2">Gli esercizi aggiunti tramite le schede compariranno qui.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLibrary.map((ex) => (
                <div key={ex.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="h-36 bg-gray-100 relative overflow-hidden">
                    {ex.image_url ? (
                      <img
                        src={ex.image_url}
                        alt={ex.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                        style={{ filter: 'grayscale(60%) contrast(1.1)' }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <StickFigure className="w-16 h-16 text-gray-300" />
                      </div>
                    )}
                    <span
                      className={`absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded-full capitalize ${
                        CATEGORY_COLORS[ex.category] || 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {ex.category}
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="font-bold text-gray-900 text-sm mb-1">{ex.name}</p>
                    <p className="text-xs text-gray-500 line-clamp-2">{ex.description}</p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {!!ex.default_sets && <Pill label={`${ex.default_sets} serie`} />}
                      {ex.default_reps && <Pill label={`${ex.default_reps} rip.`} />}
                      {ex.default_duration && <Pill label={ex.default_duration} />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {view === 'new' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6 space-y-4">
            <h3 className="font-bold text-gray-900">{editingProgram ? 'Modifica scheda' : 'Nuova scheda'}</h3>
            <div>
              <label className={labelCls} htmlFor="prog-client">
                Cliente
              </label>
              <div className="flex gap-2">
                <select
                  id="prog-client"
                  value={knownClient ? clientEmail : ''}
                  onChange={(e) => {
                    const c = clients.find((x) => x.email === e.target.value);
                    setClientEmail(e.target.value);
                    setClientName(c?.name || '');
                  }}
                  className="flex-1 min-w-0 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400 bg-white"
                >
                  <option value="">Seleziona cliente...</option>
                  {clients.map((c) => (
                    <option key={c.email} value={c.email}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>
              {clientEmail && !knownClient && (
                <input
                  type="email"
                  placeholder="Email manuale"
                  aria-label="Email manuale"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className={`mt-2 ${inputCls}`}
                />
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls} htmlFor="prog-title">
                  Titolo scheda
                </label>
                <input
                  id="prog-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Es. Programma Cervicale Fase 1"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls} htmlFor="prog-category">
                  Categoria
                </label>
                <select
                  id="prog-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={`${inputCls} bg-white capitalize`}
                >
                  {EXERCISE_CATEGORIES.map((c) => (
                    <option key={c} value={c} className="capitalize">
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <p className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                Carica template preimpostato
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.keys(PROGRAM_TEMPLATES).map((k) => (
                  <button
                    key={k}
                    onClick={() => loadTemplate(k)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize border transition-all ${CATEGORY_COLORS[k]} border-transparent hover:opacity-80`}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-bold text-gray-900">Esercizi ({exercises.length})</h3>
              <button
                onClick={addExercise}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold text-gray-700 transition-colors"
              >
                <Plus className="w-4 h-4" /> Aggiungi esercizio
              </button>
            </div>
            {exercises.length === 0 && (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center text-gray-400 text-sm">
                Carica un template o aggiungi esercizi manualmente
              </div>
            )}
            {exercises.map((ex, i) => (
              <ExerciseCard
                key={i}
                exercise={ex}
                index={i}
                onEdit={(idx) => setEditingIndex(idx)}
                onRemove={(idx) => setExercises((list) => list.filter((_, j) => j !== idx))}
              />
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
            <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider" htmlFor="prog-notes">
              Note generali per il cliente
            </label>
            <textarea
              id="prog-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Es. Esegui gli esercizi con calma, senza dolore. In caso di dubbi contattami."
              className={`${inputCls} resize-none`}
            />
          </div>

          <div className="flex flex-wrap gap-3 pb-6">
            <button
              onClick={() => {
                resetForm();
                setView('programs');
              }}
              className="px-5 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Annulla
            </button>
            <button
              onClick={() => save('draft')}
              disabled={saving || !clientEmail || !title}
              className="flex items-center gap-2 px-5 py-3 bg-gray-800 hover:bg-gray-900 disabled:opacity-40 text-white rounded-2xl text-sm font-semibold transition-colors"
            >
              {saving ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salva bozza
            </button>
            <button
              onClick={() => save('sent')}
              disabled={saving || !clientEmail || !title || exercises.length === 0}
              className="flex-1 min-w-[200px] flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white rounded-2xl py-3 px-4 font-bold text-sm transition-colors"
            >
              {saving ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Salva e invia al
              cliente
            </button>
          </div>
        </div>
      )}

      {editingIndex !== null && exercises[editingIndex] && (
        <ExerciseEditor
          exercise={exercises[editingIndex]}
          onSave={(ex) => setExercises((list) => list.map((e, i) => (i === editingIndex ? ex : e)))}
          onClose={() => setEditingIndex(null)}
        />
      )}
    </div>
  );
}
