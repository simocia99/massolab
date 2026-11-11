// DEMO adapter: stores every collection in localStorage.
// Same interface as the Supabase adapter so pages never care which is active.
import { ENTITY_NAMES, compareBy, normalizeListArgs } from './entities';
import { seedIfEmpty } from './demoSeed';

const KEY = (entity) => `massolab:${entity}`;
const listeners = new Map(); // entity -> Set<cb>

const uid = () =>
  (crypto.randomUUID?.() ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`);

function read(entity) {
  try {
    return JSON.parse(localStorage.getItem(KEY(entity)) || '[]');
  } catch {
    return [];
  }
}

function write(entity, rows) {
  try {
    localStorage.setItem(KEY(entity), JSON.stringify(rows));
  } catch (e) {
    console.error('[demo] storage full or blocked', e);
    throw new Error('Spazio di archiviazione del browser esaurito.');
  }
}

function emit(entity, type, data) {
  listeners.get(entity)?.forEach((cb) => {
    try {
      cb({ type, id: data?.id, data });
    } catch (e) {
      console.error(e);
    }
  });
}

const matches = (row, query = {}) =>
  Object.entries(query).every(([k, v]) => {
    // Base44 style: { status: ['pending', 'confirmed'] } means "one of"
    if (Array.isArray(v)) return v.includes(row[k]);
    if (v && typeof v === 'object') {
      if ('$in' in v) return v.$in.includes(row[k]);
      if ('$ne' in v) return row[k] !== v.$ne;
      if ('$gte' in v && !(row[k] >= v.$gte)) return false;
      if ('$lte' in v && !(row[k] <= v.$lte)) return false;
      return true;
    }
    return row[k] === v;
  });

function applySortLimit(rows, sort, limit) {
  let out = [...rows];
  if (sort) out.sort(compareBy(sort.field, sort.desc));
  if (limit) out = out.slice(0, limit);
  return out;
}

const currentUserEmail = () => {
  try {
    return JSON.parse(localStorage.getItem('massolab:session') || 'null')?.email ?? null;
  } catch {
    return null;
  }
};

const randomHex = (bytes = 16) =>
  [...crypto.getRandomValues(new Uint8Array(bytes))].map((b) => b.toString(16).padStart(2, '0')).join('');

// Mirrors the database triggers (supabase/migrations/0001_init.sql).
function prepareInsert(entity, data = {}) {
  const row = { ...data };
  if (entity === 'Appointment' && !(typeof row.access_token === 'string' && row.access_token.length >= 32)) {
    row.access_token = randomHex(16);
  }
  if (entity === 'ClientAccount') {
    delete row.password_hash;
    delete row.password;
    if (row.email) row.email = String(row.email).toLowerCase().trim();
  }
  return row;
}

function makeEntity(entity) {
  return {
    async list(sortOrOpts, limit) {
      await seedIfEmpty();
      const { sort, limit: l } = normalizeListArgs(sortOrOpts, limit);
      return applySortLimit(read(entity), sort, l);
    },
    async filter(query = {}, sortOrOpts, limit) {
      await seedIfEmpty();
      const { sort, limit: l } = normalizeListArgs(sortOrOpts, limit);
      return applySortLimit(read(entity).filter((r) => matches(r, query)), sort, l);
    },
    async get(id) {
      await seedIfEmpty();
      const row = read(entity).find((r) => r.id === id);
      if (!row) throw Object.assign(new Error('Record non trovato'), { status: 404 });
      return row;
    },
    async create(data) {
      const now = new Date().toISOString();
      const row = { ...prepareInsert(entity, data), id: uid(), created_date: now, updated_date: now, created_by: currentUserEmail() };
      write(entity, [...read(entity), row]);
      emit(entity, 'create', row);
      return row;
    },
    async bulkCreate(items = []) {
      const out = [];
      for (const it of items) out.push(await this.create(it));
      return out;
    },
    async update(id, data) {
      const rows = read(entity);
      const i = rows.findIndex((r) => r.id === id);
      if (i < 0) throw Object.assign(new Error('Record non trovato'), { status: 404 });
      rows[i] = { ...rows[i], ...data, id, updated_date: new Date().toISOString() };
      write(entity, rows);
      emit(entity, 'update', rows[i]);
      return rows[i];
    },
    async delete(id) {
      write(entity, read(entity).filter((r) => r.id !== id));
      emit(entity, 'delete', { id });
      return { id };
    },
    subscribe(cb) {
      if (!listeners.has(entity)) listeners.set(entity, new Set());
      listeners.get(entity).add(cb);
      const onStorage = (e) => e.key === KEY(entity) && cb({ type: 'update' });
      window.addEventListener('storage', onStorage);
      return () => {
        listeners.get(entity)?.delete(cb);
        window.removeEventListener('storage', onStorage);
      };
    },
  };
}

export const localEntities = Object.fromEntries(ENTITY_NAMES.map((n) => [n, makeEntity(n)]));
export const localRead = read;
