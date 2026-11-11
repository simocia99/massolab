import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Dumbbell, LoaderCircle } from 'lucide-react';
import { db } from '@/api/client';

export const CATEGORY_COLORS = {
  cervicale: 'bg-blue-100 text-blue-700',
  lombare: 'bg-orange-100 text-orange-700',
  spalla: 'bg-purple-100 text-purple-700',
  ginocchio: 'bg-green-100 text-green-700',
  postura: 'bg-indigo-100 text-indigo-700',
  mobilità: 'bg-teal-100 text-teal-700',
  rinforzo: 'bg-red-100 text-red-700',
  generale: 'bg-gray-100 text-gray-700',
};

/** Exercise image with a stick-figure fallback (bundle `X2`). */
export function ExerciseImage({ imageUrl, name }) {
  const [broken, setBroken] = useState(false);
  if (imageUrl && !broken) {
    return (
      <img
        src={imageUrl}
        alt={name}
        loading="lazy"
        decoding="async"
        onError={() => setBroken(true)}
        className="w-full h-full object-cover"
        style={{ filter: 'grayscale(50%) contrast(1.1)' }}
      />
    );
  }
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
      <svg viewBox="0 0 80 80" className="w-14 h-14 text-gray-500" aria-hidden="true">
        <circle cx="40" cy="14" r="7" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <line x1="40" y1="21" x2="40" y2="48" stroke="currentColor" strokeWidth="2.5" />
        <line x1="40" y1="30" x2="24" y2="43" stroke="currentColor" strokeWidth="2.5" />
        <line x1="40" y1="30" x2="56" y2="43" stroke="currentColor" strokeWidth="2.5" />
        <line x1="40" y1="48" x2="30" y2="66" stroke="currentColor" strokeWidth="2.5" />
        <line x1="40" y1="48" x2="50" y2="66" stroke="currentColor" strokeWidth="2.5" />
      </svg>
      <p className="text-xs text-gray-500 mt-1 text-center px-2 leading-tight">{name}</p>
    </div>
  );
}

function Stat({ label, value, color = 'gray' }) {
  return (
    <div className={`rounded-xl p-2.5 text-center ${color === 'blue' ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-700'}`}>
      <p className="text-xs text-current opacity-60 font-medium">{label}</p>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
}

function ExerciseCard({ exercise, index }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="w-full h-44 bg-gray-100 relative">
        <ExerciseImage imageUrl={exercise.image_url} name={exercise.name} />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
          <p className="text-white font-bold text-sm leading-tight">{exercise.name}</p>
        </div>
        <span className="absolute top-2 right-2 bg-white/90 text-gray-700 text-xs font-bold px-2 py-0.5 rounded-full">
          #{index + 1}
        </span>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 gap-2 mb-3">
          {exercise.sets && <Stat label="Serie" value={exercise.sets} />}
          {exercise.reps && <Stat label="Ripetizioni" value={exercise.reps} />}
          {exercise.duration && <Stat label="Durata" value={exercise.duration} />}
          {exercise.frequency && <Stat label="Frequenza" value={exercise.frequency} color="blue" />}
        </div>
        {exercise.description && (
          <>
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setOpen((o) => !o)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-600 transition-colors mb-2"
            >
              {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {open ? 'Nascondi istruzioni' : 'Mostra istruzioni'}
            </button>
            {open && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 leading-relaxed">{exercise.description}</p>
                {exercise.notes && (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                    <p className="text-xs font-semibold text-amber-700">⚠️ Nota: {exercise.notes}</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/** Home-exercise programs sent to the client (bundle `$2`). */
export default function ExercisePrograms({ clientEmail }) {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    if (!clientEmail) return undefined;
    let alive = true;
    db.entities.ExerciseProgram.filter({ client_email: clientEmail, status: 'sent' })
      .then((rows) => {
        if (!alive) return;
        const sorted = [...rows].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
        setPrograms(sorted);
        if (sorted.length) setSelectedId(sorted[0].id);
      })
      .catch(() => alive && setError('Impossibile caricare le schede esercizi.'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [clientEmail]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoaderCircle className="w-5 h-5 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!programs.length) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 text-center">
        <Dumbbell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="font-semibold text-gray-600">{error || 'Nessuna scheda esercizi'}</p>
        {!error && <p className="text-sm text-gray-500 mt-1">Il terapista non ha ancora inviato schede domiciliari.</p>}
      </div>
    );
  }

  const program = programs.find((p) => p.id === selectedId);
  return (
    <div className="space-y-5">
      {programs.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {programs.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedId(p.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${selectedId === p.id ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}
            >
              {p.title}
            </button>
          ))}
        </div>
      )}
      {program && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-5 border border-red-100">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-gray-900 text-base">{program.title}</h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-sm text-gray-500">{(program.exercises || []).length} esercizi</span>
                  {program.problem_category && (
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${CATEGORY_COLORS[program.problem_category] || 'bg-gray-100 text-gray-600'}`}
                    >
                      {program.problem_category}
                    </span>
                  )}
                </div>
              </div>
              <Dumbbell className="w-8 h-8 text-red-400 flex-shrink-0" />
            </div>
            {program.general_notes && (
              <div className="mt-3 bg-white/70 rounded-xl p-3">
                <p className="text-xs font-semibold text-gray-500 mb-1">Note del terapista</p>
                <p className="text-sm text-gray-700">{program.general_notes}</p>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...(program.exercises || [])]
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map((ex, i) => (
                <ExerciseCard key={ex.id || i} exercise={ex} index={i} />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
