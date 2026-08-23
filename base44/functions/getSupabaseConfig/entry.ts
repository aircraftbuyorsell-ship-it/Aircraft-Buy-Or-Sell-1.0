import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { createClient } from 'npm:@supabase/supabase-js@2';

// Robust error serializer — avoids "[object Object]" when an error lacks .message
const errToStr = (e) => {
  if (e == null) return 'Unknown error';
  if (typeof e === 'string') return e;
  if (e.message) return String(e.message);
  if (typeof e === 'object') {
    try { return JSON.stringify(e); } catch (_) { return '[object Object]'; }
  }
  return String(e);
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Any authenticated user can read the public API config (URL + anon key are publishable).
    let isAuthorized = false;
    try {
      const user = await base44.auth.me();
      isAuthorized = !!user;
    } catch (_) {
      isAuthorized = false;
    }
    if (!isAuthorized) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL');
    const supabaseKey = Deno.env.get('VITE_SUPABASE_PUBLISHABLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      return Response.json({
        configured: false,
        error: 'Supabase credentials not set (VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY)',
      }, { status: 503 });
    }

    // Derive project ref + region from the URL (https://<ref>.supabase.co)
    const urlMatch = supabaseUrl.match(/^https?:\/\/([a-z0-9]+)\.supabase\.(co|in|net)/i);
    const projectRef = urlMatch ? urlMatch[1] : null;

    // Lightweight connectivity probe — head count on faa_registry (no data transfer)
    let status = 'active';
    let latencyMs = null;
    let tableCount = null;
    let probeError = null;

    try {
      const probe = createClient(supabaseUrl, supabaseKey);
      const start = Date.now();
      const { count, error } = await Promise.race([
        probe.from('faa_registry').select('*', { count: 'exact', head: true }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('probe timeout')), 8000)),
      ]);
      latencyMs = Date.now() - start;
      if (error) {
        probeError = errToStr(error);
        status = 'error';
      } else {
        tableCount = count;
      }
    } catch (e) {
      const msg = errToStr(e);
      probeError = msg;
      status = msg.includes('<!DOCTYPE') || msg.includes('<html') || msg.includes('timeout')
        ? 'paused'
        : 'error';
    }

    return Response.json({
      configured: true,
      url: supabaseUrl,
      anonKey: supabaseKey,        // publishable key — safe for frontend use
      projectRef,
      status,                       // 'active' | 'paused' | 'error'
      latencyMs,
      tableCount,
      probeError,
      retrievedAt: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: errToStr(error) }, { status: 500 });
  }
});