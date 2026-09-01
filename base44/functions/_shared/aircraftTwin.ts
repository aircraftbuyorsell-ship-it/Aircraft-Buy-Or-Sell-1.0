import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export function normalizeRegistration(value: string | null | undefined) {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, '');
}

export function getSupabaseConfig() {
  return {
    url: Deno.env.get('SUPABASE_URL') || Deno.env.get('ABOS_SUPABASE_URL') || '',
    key: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('ABOS_SUPABASE_SERVICE_ROLE_KEY') || '',
  };
}

export async function supabaseRest(path: string, init: RequestInit = {}) {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) return null;
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

/** Canonical aircraft identity. Supabase aircraft_passports is the Digital Twin system-of-record. */
export async function resolveAircraftTwin(registration: string, seed: Record<string, unknown> = {}) {
  const reg = normalizeRegistration(registration);
  if (!reg) throw new Error('registration required');
  const existing = await supabaseRest(`aircraft_passports?registration=eq.${encodeURIComponent(reg)}&select=id,registration,serial_number,make,model,year_manufactured,icao24,faa_registry_id&limit=1`);
  if (existing?.[0]) return existing[0];

  const rows = await supabaseRest('aircraft_passports', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ registration: reg, ...seed, source: seed.source || 'user_created' }),
  });
  return rows?.[0] || null;
}

export function evidenceConfidence(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(1, n > 1 ? n / 100 : n));
}

export function buildAircraftTwinPatch(input: { registration: string; registry?: any; activity?: any; now?: string }) {
  const now = input.now || new Date().toISOString();
  const r = input.registry || {};
  return {
    registration: normalizeRegistration(input.registration),
    ...(r.serial_number ? { serial_number: r.serial_number } : {}),
    ...(r.manufacturer ? { make: r.manufacturer } : {}),
    ...(r.model ? { model: r.model } : {}),
    ...(r.year ? { year_manufactured: r.year } : {}),
    ...(r.mode_s_hex ? { icao24: String(r.mode_s_hex).toLowerCase() } : {}),
    ...(input.activity?.last_seen ? { last_activity_date: input.activity.last_seen } : {}),
    updated_at: now,
  };
}
