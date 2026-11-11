import { useEffect, useState } from 'react';
import { CircleCheckBig, Clock, Euro, Eye, EyeOff, LoaderCircle, Save } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/api/client';

export const PRICED_TREATMENTS = [
  { item_key: 'massaggio-rilassante', name: 'Massaggio Tradizionale/Rilassante', item_type: 'treatment' },
  { item_key: 'massaggio-sportivo', name: 'Massaggio Sportivo', item_type: 'treatment' },
  { item_key: 'massaggio-miofasciale', name: 'Massaggio Miofasciale', item_type: 'treatment' },
  { item_key: 'linfodrenaggio', name: 'Linfodrenaggio', item_type: 'treatment' },
  { item_key: 'massaggio-connettivale', name: 'Massaggio Connettivale', item_type: 'treatment' },
  { item_key: 'kinesiotaping', name: 'Kinesiotaping', item_type: 'treatment' },
  { item_key: 'coppettazione', name: 'Coppettazione', item_type: 'treatment' },
  { item_key: 'bendaggio', name: 'Bendaggio Funzionale', item_type: 'treatment' },
];

export const PRICED_PACKAGES = [
  { item_key: 'percorso-benessere-3', name: 'Percorso Benessere (3 sedute)', item_type: 'package' },
  { item_key: 'percorso-intensivo-5', name: 'Percorso Intensivo (5 sedute)', item_type: 'package' },
  { item_key: 'percorso-riabilitativo-6', name: 'Percorso Riabilitativo (6 sedute)', item_type: 'package' },
  { item_key: 'percorso-mantenimento-8', name: 'Percorso Mantenimento (8 sedute)', item_type: 'package' },
];

const str = (v) => (v === null || v === undefined ? '' : String(v));

/** Price / duration / note / visibility editor for one item. */
export function PriceItemEditor({ item, record, onSave }) {
  const [price, setPrice] = useState(str(record?.price));
  const [duration, setDuration] = useState(str(record?.duration_minutes));
  const [note, setNote] = useState(record?.price_note ?? '');
  const [visible, setVisible] = useState(record?.visible ?? true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(t);
  }, [saved]);

  // Compare as strings: inputs hold strings, records hold numbers.
  const dirty =
    price !== str(record?.price) ||
    duration !== str(record?.duration_minutes) ||
    note !== (record?.price_note ?? '') ||
    visible !== (record?.visible ?? true);

  const save = async () => {
    setSaving(true);
    try {
      await onSave(item, {
        price: price === '' ? null : Number(price),
        duration_minutes: duration === '' ? null : Number(duration),
        price_note: note,
        visible,
      });
      setSaved(true);
    } catch {
      toast.error('Salvataggio non riuscito. Riprova.');
    } finally {
      setSaving(false);
    }
  };

  const fieldCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400';
  const labelCls = 'block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="font-bold text-gray-900 text-sm">{item.name}</p>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${
              item.item_type === 'package' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
            }`}
          >
            {item.item_type === 'package' ? 'Pacchetto' : 'Trattamento'}
          </span>
        </div>
        <button
          onClick={() => setVisible((v) => !v)}
          title={visible ? 'Nascondi prezzo al pubblico' : 'Mostra prezzo al pubblico'}
          aria-label={visible ? 'Nascondi prezzo al pubblico' : 'Mostra prezzo al pubblico'}
          aria-pressed={visible}
          className={`p-2 rounded-xl transition-colors ${
            visible ? 'text-green-600 bg-green-50 hover:bg-green-100' : 'text-gray-500 bg-gray-100 hover:bg-gray-200'
          }`}
        >
          {visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div>
          <label className={`${labelCls} flex items-center gap-1`} htmlFor={`price-${item.item_key}`}>
            <Euro className="w-3 h-3" /> Prezzo (€)
          </label>
          <input
            id={`price-${item.item_key}`}
            type="number"
            inputMode="decimal"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="es. 65"
            className={`${fieldCls} font-semibold`}
          />
        </div>
        <div>
          <label className={`${labelCls} flex items-center gap-1`} htmlFor={`dur-${item.item_key}`}>
            <Clock className="w-3 h-3" /> Durata (min)
          </label>
          <input
            id={`dur-${item.item_key}`}
            type="number"
            inputMode="numeric"
            min="0"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="es. 60"
            className={fieldCls}
          />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className={labelCls} htmlFor={`note-${item.item_key}`}>
            Nota
          </label>
          <input
            id={`note-${item.item_key}`}
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="es. IVA inclusa"
            className={fieldCls}
          />
        </div>
      </div>
      {(dirty || saved) && (
        <button
          onClick={save}
          disabled={saving || !dirty}
          className="mt-4 flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          {saving ? (
            <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
          ) : saved ? (
            <CircleCheckBig className="w-3.5 h-3.5" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          {saved ? 'Salvato!' : 'Salva'}
        </button>
      )}
      {!dirty && !saved && record && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {record.price != null && record.price !== '' && (
            <span className="text-base font-bold text-gray-900">€{record.price}</span>
          )}
          {!!record.duration_minutes && <span className="text-sm text-gray-500">· {record.duration_minutes} min</span>}
          {record.price_note && <span className="text-xs text-gray-500 italic">{record.price_note}</span>}
          {!record.visible && <span className="text-xs text-orange-500 font-semibold">nascosto al pubblico</span>}
        </div>
      )}
    </div>
  );
}

export default function PricingSettings() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setRecords(await db.entities.PricingSettings.list());
    } catch {
      toast.error('Impossibile caricare i prezzi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Throws on failure so the item editor can show the error.
  const save = async (item, values) => {
    const existing = records.find((r) => r.item_key === item.item_key);
    if (existing) await db.entities.PricingSettings.update(existing.id, { ...values });
    else
      await db.entities.PricingSettings.create({
        item_key: item.item_key,
        item_type: item.item_type,
        name: item.name,
        ...values,
      });
    await load();
  };

  const recordFor = (key) => records.find((r) => r.item_key === key);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoaderCircle className="w-6 h-6 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-4 sm:p-6 border border-red-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Prezzi &amp; Durate</h2>
        <p className="text-gray-500 text-sm">
          Le modifiche vengono mostrate in tempo reale ai visitatori nella sezione trattamenti e nella pagina Percorsi.
        </p>
        <div className="flex items-center gap-2 mt-3">
          <Eye className="w-4 h-4 text-green-600 flex-shrink-0" />
          <span className="text-xs text-gray-500">
            Usa <strong>l'occhio</strong> per scegliere se mostrare il prezzo pubblicamente o tenerlo nascosto.
          </span>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-600 inline-block" />
          Trattamenti singoli
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PRICED_TREATMENTS.map((item) => (
            <PriceItemEditor key={item.item_key} item={item} record={recordFor(item.item_key)} onSave={save} />
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
          Pacchetti / Percorsi
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PRICED_PACKAGES.map((item) => (
            <PriceItemEditor key={item.item_key} item={item} record={recordFor(item.item_key)} onSave={save} />
          ))}
        </div>
      </div>
    </div>
  );
}
