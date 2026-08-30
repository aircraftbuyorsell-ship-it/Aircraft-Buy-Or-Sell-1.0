import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const KEY = 'abos.stelmo.tasks.v1';

function loadLocal() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
}
function saveLocal(tasks) {
  try { localStorage.setItem(KEY, JSON.stringify(tasks)); } catch {}
}

export async function createStElmoTask({ prompt, conversationId, metadata = {} }) {
  const id = crypto.randomUUID();
  const task = {
    id,
    conversation_id: conversationId || null,
    prompt,
    status: 'queued',
    phase: 'queued',
    result: null,
    error: null,
    metadata,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const tasks = loadLocal();
  tasks[id] = task;
  saveLocal(tasks);

  if (supabase) {
    const { error } = await supabase.from('st_elmo_tasks').insert(task);
    if (!error) return task;
  }
  return task;
}

export async function updateStElmoTask(id, patch) {
  const tasks = loadLocal();
  const current = tasks[id] || { id };
  const next = { ...current, ...patch, updated_at: new Date().toISOString() };
  tasks[id] = next;
  saveLocal(tasks);
  if (supabase) await supabase.from('st_elmo_tasks').update(patch).eq('id', id);
  return next;
}

export async function getStElmoTask(id) {
  if (supabase) {
    const { data } = await supabase.from('st_elmo_tasks').select('*').eq('id', id).maybeSingle();
    if (data) return data;
  }
  return loadLocal()[id] || null;
}

export async function listActiveStElmoTasks() {
  if (supabase) {
    const { data } = await supabase
      .from('st_elmo_tasks')
      .select('*')
      .in('status', ['queued', 'running', 'reasoning', 'tools', 'synthesis'])
      .order('created_at', { ascending: false });
    if (data) return data;
  }
  return Object.values(loadLocal()).filter(t => !['completed', 'failed'].includes(t.status));
}

export function subscribeToStElmoTask(id, onChange) {
  if (!supabase) return () => {};
  const channel = supabase
    .channel(`st-elmo-task-${id}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'st_elmo_tasks', filter: `id=eq.${id}` }, payload => onChange(payload.new))
    .subscribe();
  return () => supabase.removeChannel(channel);
}
