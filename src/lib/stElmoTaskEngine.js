import { supabase } from '@/lib/supabase';
import { base44 } from '@/api/base44Client';

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

  try {
    const created = await base44.entities.StElmoTask.create({ task_id: id, conversation_id: task.conversation_id, prompt, status: task.status, phase: task.phase, result: null, error: null, metadata, created_at: task.created_at, updated_at: task.updated_at });
    return { ...task, base44_id: created?.id };
  } catch {}
  if (supabase) {
    const { error } = await supabase.from('st_elmo_tasks').insert({ task_id: id, conversation_id: task.conversation_id, prompt, status: task.status, phase: task.phase, result: null, error: null, metadata, created_at: task.created_at, updated_at: task.updated_at });
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
  try {
    const rows = await base44.entities.StElmoTask.filter({ task_id: id });
    if (rows?.[0]?.id) await base44.entities.StElmoTask.update(rows[0].id, patch);
    else if (supabase) await supabase.from('st_elmo_tasks').update(patch).eq('task_id', id);
  } catch {
    if (supabase) await supabase.from('st_elmo_tasks').update(patch).eq('task_id', id);
  }
  return next;
}

export async function getStElmoTask(id) {
  try {
    const rows = await base44.entities.StElmoTask.filter({ task_id: id });
    if (rows?.[0]) return { ...rows[0], id };
  } catch {}
  if (supabase) {
    const { data } = await supabase.from('st_elmo_tasks').select('*').eq('task_id', id).maybeSingle();
    if (data) return data;
  }
  return loadLocal()[id] || null;
}

export async function listActiveStElmoTasks() {
  try {
    const rows = await base44.entities.StElmoTask.filter({ status: { $in: ['queued', 'running', 'reasoning', 'tools', 'synthesis'] } }, '-created_at', 20);
    if (rows) return rows.map(r => ({ ...r, id: r.task_id })).filter(t => !['completed', 'failed'].includes(t.status));
  } catch {}
  if (supabase) {
    const { data } = await supabase.from('st_elmo_tasks').select('*').in('status', ['queued', 'running', 'reasoning', 'tools', 'synthesis']).order('created_at', { ascending: false });
    if (data) return data;
  }
  return Object.values(loadLocal()).filter(t => !['completed', 'failed'].includes(t.status));
}

export function subscribeToStElmoTask(id, onChange) {
  if (!supabase || !id) return () => {};

  let active = true;
  const channel = supabase
    .channel(`st-elmo-task-${id}-${Math.random().toString(36).slice(2)}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'st_elmo_tasks', filter: `task_id=eq.${id}` },
      payload => {
        if (!active) return;
        try { onChange(payload.new); } catch {}
      }
    )
    .subscribe();

  // React effect cleanup must be synchronous and must never throw.
  return () => {
    active = false;
    try {
      const result = supabase.removeChannel(channel);
      if (result && typeof result.catch === 'function') result.catch(() => {});
    } catch {}
  };
}
