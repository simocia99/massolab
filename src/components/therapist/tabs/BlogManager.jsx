import { useEffect, useState } from 'react';
import { Eye, EyeOff, Image as ImageIcon, LoaderCircle, Pencil, Plus, Tag, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/api/client';
import RichTextEditor from './RichTextEditor';

const SUGGESTED_TAGS = [
  'benessere',
  'massaggio',
  'salute',
  'postura',
  'rilassamento',
  'sport',
  'linfodrenaggio',
  'prevenzione',
  'consigli',
];

const EMPTY_POST = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  cover_image: '',
  tags: [],
  status: 'draft',
  reading_time: 3,
};

const slugify = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const isEmptyHtml = (html) => !html || !html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();

const labelCls = 'block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2';

export default function BlogManager() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null); // null | 'new' | id
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState(EMPTY_POST);

  const load = async () => {
    setLoading(true);
    try {
      setPosts(await db.entities.BlogPost.list('-created_date', 100));
    } catch {
      toast.error('Impossibile caricare gli articoli.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startNew = () => {
    setForm(EMPTY_POST);
    setEditingId('new');
  };
  const startEdit = (post) => {
    setForm({ ...EMPTY_POST, ...post, tags: post.tags || [] });
    setEditingId(post.id);
  };
  const close = () => {
    setEditingId(null);
    setForm(EMPTY_POST);
  };

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  // Auto-generate the slug from the title until the user customises it.
  const setTitle = (title) =>
    setForm((f) => ({
      ...f,
      title,
      slug: !f.slug || f.slug === slugify(f.title) ? slugify(title) : f.slug,
    }));

  const addTag = (raw) => {
    const t = raw.trim().toLowerCase();
    if (t && !form.tags.includes(t)) set('tags', [...form.tags, t]);
    setTagInput('');
  };
  const removeTag = (t) => set('tags', form.tags.filter((x) => x !== t));

  const uploadCover = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await db.integrations.Core.UploadFile({ file, folder: 'blog' });
      set('cover_image', file_url);
    } catch (err) {
      toast.error(err.message || 'Caricamento immagine non riuscito.');
    } finally {
      setUploading(false);
    }
  };

  const save = async (status = form.status) => {
    if (!form.title.trim() || isEmptyHtml(form.content)) {
      toast.error('Titolo e contenuto sono obbligatori.');
      return;
    }
    setSaving(true);
    const { id, created_date, updated_date, created_by, ...rest } = form;
    const data = { ...rest, slug: form.slug || slugify(form.title), status };
    try {
      if (editingId === 'new') await db.entities.BlogPost.create(data);
      else await db.entities.BlogPost.update(editingId, data);
      toast.success(status === 'published' ? 'Articolo pubblicato' : 'Bozza salvata');
      await load();
      close();
    } catch {
      toast.error('Salvataggio non riuscito. Riprova.');
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (post) => {
    try {
      await db.entities.BlogPost.update(post.id, { status: post.status === 'published' ? 'draft' : 'published' });
      load();
    } catch {
      toast.error('Operazione non riuscita.');
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Eliminare questo articolo?')) return;
    try {
      await db.entities.BlogPost.delete(id);
      load();
    } catch {
      toast.error('Eliminazione non riuscita.');
    }
  };

  if (editingId === null) {
    return (
      <div>
        <div className="flex items-center justify-between gap-3 mb-6">
          <h2 className="text-xl font-bold text-gray-900">Blog Articoli</h2>
          <button
            onClick={startNew}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" /> Nuovo Articolo
          </button>
        </div>
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Tag className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">Nessun articolo ancora.</p>
            <p className="text-sm mt-1">Crea il tuo primo articolo sul benessere!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 flex gap-3 sm:gap-4 hover:shadow-md transition-shadow"
              >
                {post.cover_image && (
                  <img
                    src={post.cover_image}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="hidden sm:block w-24 h-20 object-cover rounded-xl flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">{post.title}</h3>
                      {post.excerpt && <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{post.excerpt}</p>}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {(post.tags || []).map((t) => (
                          <span key={t} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span
                      className={`self-start flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${
                        post.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {post.status === 'published' ? 'Pubblicato' : 'Bozza'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button
                    onClick={() => startEdit(post)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                    title="Modifica"
                    aria-label="Modifica"
                  >
                    <Pencil className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => togglePublish(post)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                    title={post.status === 'published' ? 'Togli dalla pubblicazione' : 'Pubblica'}
                    aria-label={post.status === 'published' ? 'Togli dalla pubblicazione' : 'Pubblica'}
                  >
                    {post.status === 'published' ? (
                      <EyeOff className="w-4 h-4 text-amber-500" />
                    ) : (
                      <Eye className="w-4 h-4 text-green-500" />
                    )}
                  </button>
                  <button
                    onClick={() => remove(post.id)}
                    className="p-2 hover:bg-red-50 rounded-lg"
                    title="Elimina"
                    aria-label="Elimina"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">{editingId === 'new' ? 'Nuovo Articolo' : 'Modifica Articolo'}</h2>
        <button onClick={close} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Chiudi">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="space-y-5">
        <div>
          <label className={labelCls}>Immagine di Copertina</label>
          {form.cover_image ? (
            <div className="relative">
              <img src={form.cover_image} alt="" className="w-full h-48 object-cover rounded-xl" />
              <button
                onClick={() => set('cover_image', '')}
                className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-lg hover:bg-black/70"
                aria-label="Rimuovi immagine"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-red-400 bg-gray-50 hover:bg-red-50 transition-colors">
              {uploading ? (
                <LoaderCircle className="w-6 h-6 animate-spin text-red-400" />
              ) : (
                <>
                  <ImageIcon className="w-8 h-8 text-gray-300 mb-2" />
                  <span className="text-sm text-gray-400">Carica immagine</span>
                </>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={uploadCover} disabled={uploading} />
            </label>
          )}
        </div>
        <div>
          <label className={labelCls} htmlFor="blog-title">
            Titolo *
          </label>
          <input
            id="blog-title"
            value={form.title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titolo dell'articolo..."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-lg font-semibold focus:outline-none focus:border-red-400"
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="blog-excerpt">
            Anteprima
          </label>
          <textarea
            id="blog-excerpt"
            value={form.excerpt}
            onChange={(e) => set('excerpt', e.target.value)}
            placeholder="Breve descrizione che appare nella lista degli articoli..."
            rows={2}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-400 resize-none"
          />
        </div>
        <div>
          <label className={labelCls}>Contenuto *</label>
          <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
            <RichTextEditor value={form.content} onChange={(html) => set('content', html)} minHeight={280} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Tag</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {form.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium"
              >
                {t}
                <button onClick={() => removeTag(t)} aria-label={`Rimuovi tag ${t}`}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2 mb-2">
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag(tagInput);
                }
              }}
              placeholder="Aggiungi tag..."
              className="flex-1 min-w-0 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-400"
            />
            <button
              onClick={() => addTag(tagInput)}
              className="bg-gray-100 hover:bg-gray-200 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              Aggiungi
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_TAGS.filter((t) => !form.tags.includes(t)).map((t) => (
              <button
                key={t}
                onClick={() => addTag(t)}
                className="text-xs bg-gray-100 hover:bg-red-100 hover:text-red-700 text-gray-500 px-2.5 py-1 rounded-full transition-colors"
              >
                + {t}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={labelCls} htmlFor="blog-reading">
            Tempo di lettura (min)
          </label>
          <input
            id="blog-reading"
            type="number"
            min={1}
            max={60}
            value={form.reading_time}
            onChange={(e) => set('reading_time', Math.max(1, +e.target.value || 1))}
            className="w-28 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-red-400"
          />
        </div>
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={() => save('draft')}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 border border-gray-200 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {saving && <LoaderCircle className="w-4 h-4 animate-spin" />} Salva Bozza
          </button>
          <button
            onClick={() => save('published')}
            disabled={saving}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-medium text-sm transition-colors disabled:opacity-50"
          >
            {saving && <LoaderCircle className="w-4 h-4 animate-spin" />} Pubblica
          </button>
        </div>
      </div>
    </div>
  );
}
