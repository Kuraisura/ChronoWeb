import { supabase, requireSupabase } from './supabaseClient';

const throwIfError = ({ error, data }) => {
  if (error) throw error;
  return data;
};

const withoutUnsupportedColumns = async (payload, execute) => {
  const compatible = { ...payload };
  for (let attempt = 0; attempt <= Object.keys(payload).length; attempt += 1) {
    const result = await execute(compatible);
    if (!result.error) return result.data;
    const missing = result.error.message?.match(/(?:the\s+)?['"]([^'"]+)['"]\s+column/i)?.[1];
    if (!missing || !(missing in compatible)) throw result.error;
    delete compatible[missing];
  }
  throw new Error('The Supabase table is missing all writable task fields.');
};

const currentUserId = async () => {
  requireSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error('You must be signed in.');
  return data.user.id;
};

const normalizeTask = (row) => ({
  ...row,
  title: row.title || row.task || 'Untitled Task',
  description: row.description || row.tip || '',
  start_time: row.start_time || row.time || '00:00',
  end_time: row.end_time || '',
  checklist: Array.isArray(row.checklist) ? row.checklist : [],
});

const taskPayload = async (values) => {
  const payload = {
    ...values,
    user_id: await currentUserId(),
    updated_at: new Date().toISOString(),
  };
  if ('title' in values || 'task' in values) {
    payload.title = values.title || values.task || 'Untitled Task';
    payload.task = payload.title;
  }
  if ('description' in values || 'tip' in values) {
    payload.description = values.description ?? values.tip ?? '';
    payload.tip = payload.description;
  }
  if ('start_time' in values || 'time' in values) {
    payload.start_time = values.start_time || values.time || '00:00';
    payload.time = payload.start_time;
  }
  return payload;
};

export const tasksService = {
  async list(limit = 100) {
    requireSupabase();
    const result = await supabase.from('tasks').select('*').order('updated_at', { ascending: false }).limit(limit);
    return throwIfError(result).map(normalizeTask);
  },
  async create(values) {
    const data = await withoutUnsupportedColumns(await taskPayload(values), (payload) => supabase.from('tasks').insert(payload).select().single());
    return normalizeTask(data);
  },
  async update(id, values) {
    const data = await withoutUnsupportedColumns(await taskPayload(values), (payload) => supabase.from('tasks').update(payload).eq('id', id).select().single());
    return normalizeTask(data);
  },
  async remove(id) {
    return throwIfError(await supabase.from('tasks').delete().eq('id', id));
  },
};

const normalizeJournal = (row) => ({
  ...row,
  title: row.title || row.task || 'Untitled Entry',
  content: row.content || row.note || '',
});

const journalPayload = async (values) => {
  const payload = {
    ...values,
    user_id: await currentUserId(),
    updated_at: new Date().toISOString(),
  };
  if ('title' in values || 'task' in values) {
    payload.title = values.title || values.task || 'Untitled Entry';
    payload.task = payload.title;
  }
  if ('content' in values || 'note' in values) {
    payload.content = values.content ?? values.note ?? '';
    payload.note = payload.content;
  }
  return payload;
};

export const journalService = {
  async list(limit = 100) {
    requireSupabase();
    const result = await supabase.from('journal_entries').select('*').order('updated_at', { ascending: false }).limit(limit);
    return throwIfError(result).map(normalizeJournal);
  },
  async create(values) {
    const data = await withoutUnsupportedColumns(await journalPayload(values), (payload) => supabase.from('journal_entries').insert(payload).select().single());
    return normalizeJournal(data);
  },
  async update(id, values) {
    const data = await withoutUnsupportedColumns(await journalPayload(values), (payload) => supabase.from('journal_entries').update(payload).eq('id', id).select().single());
    return normalizeJournal(data);
  },
  async remove(id) {
    return throwIfError(await supabase.from('journal_entries').delete().eq('id', id));
  },
};

export async function uploadJournalImage(file) {
  const userId = await currentUserId();
  const extension = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const path = `${userId}/web/${crypto.randomUUID()}.${extension}`;
  throwIfError(await supabase.storage.from('journal-photos').upload(path, file, {
    cacheControl: '3600',
    contentType: file.type,
    upsert: false,
  }));
  const { data } = supabase.storage.from('journal-photos').getPublicUrl(path);
  return data.publicUrl;
}
