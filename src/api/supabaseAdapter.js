// Supabase adapter. Every entity is a table with the same shape:
//   id uuid, created_date timestamptz, updated_date timestamptz,
//   created_by text, data jsonb
// Records are flattened to { id, created_date, ..., ...data } for the UI.
// Access rules are enforced server-side by Row Level Security
// (see supabase/migrations).
import { ENTITY_NAMES, normalizeListArgs, tableName } from './entities';
import { supabase } from './supabaseClient';

const COLUMNS = new Set(['id', 'created_date', 'updated_date', 'created_by']);
const col = (field) => (COLUMNS.has(field) ? field : `data->>${field}`);

const flatten = (row) =>
  row ? { ...(row.data || {}), id: row.id, created_date: row.created_date, updated_date: row.updated_date, created_by: row.created_by } : row;

const strip = (data = {}) => {
  const { id, created_date, updated_date, created_by, ...rest } = data;
  return rest;
};

function fail(error) {
  const err = new Error(error.message || 'Errore del server');
  err.status = error.code === 'PGRST301' || error.code === '42501' ? 403 : error.status;
  err.cause = error;
  throw err;
}

function applyQuery(q, query = {}) {
  const plain = {};
  for (const [k, v] of Object.entries(query)) {
    if (COLUMNS.has(k)) {
      q = Array.isArray(v) ? q.in(k, v) : q.eq(k, v);
    } else if (Array.isArray(v)) {
      // Base44 style: { status: ['pending', 'confirmed'] } means "one of"
      q = q.in(col(k), v.map(String));
    } else if (v && typeof v === 'object') {
      if ('$in' in v) q = q.in(col(k), v.$in.map(String));
      if ('$ne' in v) q = q.neq(col(k), String(v.$ne));
      if ('$gte' in v) q = q.gte(col(k), String(v.$gte));
      if ('$lte' in v) q = q.lte(col(k), String(v.$lte));
    } else {
      plain[k] = v;
    }
  }
  if (Object.keys(plain).length) q = q.contains('data', plain);
  return q;
}

function applySortLimit(q, sort, limit) {
  if (sort) q = q.order(col(sort.field), { ascending: !sort.desc, nullsFirst: false });
  else q = q.order('created_date', { ascending: false });
  return q.limit(limit || 1000);
}

function makeEntity(entity) {
  const table = tableName(entity);
  return {
    async list(sortOrOpts, limit) {
      const { sort, limit: l } = normalizeListArgs(sortOrOpts, limit);
      const { data, error } = await applySortLimit(supabase.from(table).select('*'), sort, l);
      if (error) fail(error);
      return data.map(flatten);
    },
    async filter(query = {}, sortOrOpts, limit) {
      const { sort, limit: l } = normalizeListArgs(sortOrOpts, limit);
      const q = applyQuery(supabase.from(table).select('*'), query);
      const { data, error } = await applySortLimit(q, sort, l);
      if (error) fail(error);
      return data.map(flatten);
    },
    async get(id) {
      const { data, error } = await supabase.from(table).select('*').eq('id', id).maybeSingle();
      if (error) fail(error);
      if (!data) throw Object.assign(new Error('Record non trovato'), { status: 404 });
      return flatten(data);
    },
    async create(payload) {
      // No .select() on insert: anonymous visitors may insert (e.g. a booking)
      // without being allowed to read rows back. We return what we sent.
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const { error } = await supabase.from(table).insert({ id, data: strip(payload) });
      if (error) fail(error);
      return { ...strip(payload), id, created_date: now, updated_date: now };
    },
    async bulkCreate(items = []) {
      const rows = items.map((it) => ({ id: crypto.randomUUID(), data: strip(it) }));
      const { error } = await supabase.from(table).insert(rows);
      if (error) fail(error);
      return rows.map(flatten);
    },
    async update(id, patch) {
      // Merge server-side to avoid overwriting fields changed concurrently.
      const { data, error } = await supabase.rpc('merge_record', {
        p_table: table,
        p_id: id,
        p_patch: strip(patch),
      });
      if (error) fail(error);
      if (!data) throw Object.assign(new Error('Record non trovato'), { status: 404 });
      return flatten(data);
    },
    async delete(id) {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) fail(error);
      return { id };
    },
    subscribe(cb) {
      const channel = supabase
        .channel(`rt-${table}-${Math.random().toString(36).slice(2)}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
          const type = payload.eventType === 'INSERT' ? 'create' : payload.eventType === 'DELETE' ? 'delete' : 'update';
          const row = payload.new && Object.keys(payload.new).length ? flatten(payload.new) : { id: payload.old?.id };
          cb({ type, id: row.id, data: row });
        })
        .subscribe();
      return () => supabase.removeChannel(channel);
    },
  };
}

export const supabaseEntities = Object.fromEntries(ENTITY_NAMES.map((n) => [n, makeEntity(n)]));
