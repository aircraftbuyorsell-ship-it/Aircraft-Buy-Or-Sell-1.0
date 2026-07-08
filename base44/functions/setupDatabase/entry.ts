import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// setupDatabase — idempotent Supabase schema initializer.
// Creates the ai_config singleton table (AI safety defaults) and the
// pipeline_step_logs event table, seeds defaults on first run, and
// returns a report with the active AI safety configuration.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const accessToken = Deno.env.get('SUPABASE_ACCESS_TOKEN');
    const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL');
    if (!accessToken || !supabaseUrl) {
      return Response.json({ error: 'Supabase credentials not configured' }, { status: 500 });
    }
    const projectRef = new URL(supabaseUrl).hostname.split('.')[0];

    const runSql = async (query) => {
      const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(`SQL failed (${res.status}): ${text}`);
      try { return JSON.parse(text); } catch (_e) { return text; }
    };

    // ── Create tables + RLS (idempotent) ──
    await runSql(`
      CREATE TABLE IF NOT EXISTS ai_config (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        confidence_threshold NUMERIC DEFAULT 0.75,
        daily_ai_steps_cap INTEGER DEFAULT 10,
        require_human_approval_above_usd NUMERIC DEFAULT 500000,
        ai_audit_enabled BOOLEAN DEFAULT TRUE,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS pipeline_step_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        pipeline_id TEXT NOT NULL,
        step_id TEXT,
        event_type TEXT NOT NULL,
        payload JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_step_logs_pipeline_event
        ON pipeline_step_logs(pipeline_id, event_type, created_at);

      ALTER TABLE ai_config ENABLE ROW LEVEL SECURITY;
      ALTER TABLE pipeline_step_logs ENABLE ROW LEVEL SECURITY;

      -- SELECT for authenticated users; writes only via service role (bypasses RLS)
      DO $$ BEGIN
        CREATE POLICY ai_config_read ON ai_config FOR SELECT TO authenticated USING (true);
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
      DO $$ BEGIN
        CREATE POLICY step_logs_read ON pipeline_step_logs FOR SELECT TO authenticated USING (true);
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    // ── Seed defaults only if table is empty (idempotent) ──
    const seedResult = await runSql(`
      INSERT INTO ai_config (confidence_threshold, daily_ai_steps_cap, require_human_approval_above_usd, ai_audit_enabled)
      SELECT 0.75, 10, 500000, TRUE
      WHERE NOT EXISTS (SELECT 1 FROM ai_config)
      RETURNING confidence_threshold, daily_ai_steps_cap, require_human_approval_above_usd, ai_audit_enabled;
    `);
    const seeded = Array.isArray(seedResult) && seedResult.length > 0;

    const rows = seeded
      ? seedResult
      : await runSql(`SELECT confidence_threshold, daily_ai_steps_cap, require_human_approval_above_usd, ai_audit_enabled FROM ai_config LIMIT 1;`);
    const defaults = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;

    return Response.json({
      ok: true,
      ai_config: { created: true, seeded, defaults },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});