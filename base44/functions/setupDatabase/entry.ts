import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// setupDatabase — idempotent Supabase schema initializer for the AI Governance Layer.
// Creates: ai_config (per-key versioned rows), config_change_log (audit trail),
// feature_toggles (boolean + per-role flags), pipeline_step_logs (events),
// RPC functions (get_ai_config, check_feature_flag, rollback_ai_config),
// an auto-audit trigger, and seeds default values. Governance layer v1.2.

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

    // ── 0. Migrate away from the legacy singleton ai_config shape ──
    await runSql(`
      DO $$ BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'ai_config' AND column_name = 'confidence_threshold'
        ) THEN
          DROP TABLE ai_config CASCADE;
        END IF;
      END $$;
    `);

    // ── 1. Tables + indexes + view (idempotent) ──
    await runSql(`
      CREATE TABLE IF NOT EXISTS ai_config (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key          TEXT NOT NULL UNIQUE,
        value        JSONB NOT NULL,
        version      INTEGER NOT NULL DEFAULT 1,
        schema_def   JSONB,
        description  TEXT,
        updated_at   TIMESTAMPTZ DEFAULT NOW(),
        updated_by   TEXT
      );

      CREATE OR REPLACE VIEW ai_config_snapshot AS
      SELECT jsonb_object_agg(key, value) AS config,
             MAX(version) AS max_version,
             MAX(updated_at) AS last_updated
      FROM ai_config;

      CREATE TABLE IF NOT EXISTS config_change_log (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        config_key  TEXT NOT NULL,
        old_value   JSONB,
        new_value   JSONB NOT NULL,
        version     INTEGER NOT NULL,
        changed_by  TEXT NOT NULL,
        changed_at  TIMESTAMPTZ DEFAULT NOW(),
        reason      TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_config_change_log_key
        ON config_change_log(config_key, changed_at DESC);

      CREATE TABLE IF NOT EXISTS feature_toggles (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key           TEXT NOT NULL UNIQUE,
        is_enabled    BOOLEAN NOT NULL DEFAULT FALSE,
        allowed_roles TEXT[],
        description   TEXT,
        updated_at    TIMESTAMPTZ DEFAULT NOW(),
        updated_by    TEXT
      );

      CREATE TABLE IF NOT EXISTS pipeline_step_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        pipeline_id TEXT NOT NULL,
        step_id TEXT,
        event_type TEXT NOT NULL,
        payload JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_step_logs_pipeline_event
        ON pipeline_step_logs(pipeline_id, event_type, created_at);
    `);

    // ── 2. RLS policies (idempotent) ──
    await runSql(`
      ALTER TABLE ai_config ENABLE ROW LEVEL SECURITY;
      ALTER TABLE config_change_log ENABLE ROW LEVEL SECURITY;
      ALTER TABLE feature_toggles ENABLE ROW LEVEL SECURITY;
      ALTER TABLE pipeline_step_logs ENABLE ROW LEVEL SECURITY;

      -- SELECT for authenticated users; writes only via service role (bypasses RLS)
      DO $$ BEGIN
        CREATE POLICY ai_config_read ON ai_config FOR SELECT TO authenticated USING (true);
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
      DO $$ BEGIN
        CREATE POLICY feature_toggles_read ON feature_toggles FOR SELECT TO authenticated USING (true);
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
      DO $$ BEGIN
        CREATE POLICY config_change_log_read ON config_change_log FOR SELECT TO authenticated USING (true);
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
      DO $$ BEGIN
        CREATE POLICY step_logs_read ON pipeline_step_logs FOR SELECT TO authenticated USING (true);
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);

    // ── 3. RPC functions + audit trigger ──
    await runSql(`
      CREATE OR REPLACE FUNCTION get_ai_config(p_key TEXT)
      RETURNS JSONB LANGUAGE plpgsql STABLE AS $fn$
      DECLARE result JSONB;
      BEGIN
        SELECT value INTO result FROM ai_config WHERE key = p_key;
        RETURN COALESCE(result, 'null'::JSONB);
      END; $fn$;

      CREATE OR REPLACE FUNCTION check_feature_flag(p_key TEXT, p_role TEXT DEFAULT NULL)
      RETURNS BOOLEAN LANGUAGE plpgsql STABLE AS $fn$
      DECLARE flag RECORD;
      BEGIN
        SELECT is_enabled, allowed_roles INTO flag FROM feature_toggles WHERE key = p_key;
        IF NOT FOUND THEN RETURN FALSE; END IF;
        IF NOT flag.is_enabled THEN RETURN FALSE; END IF;
        IF flag.allowed_roles IS NULL THEN RETURN TRUE; END IF;
        IF p_role IS NULL THEN RETURN FALSE; END IF;
        RETURN p_role = ANY(flag.allowed_roles);
      END; $fn$;

      CREATE OR REPLACE FUNCTION rollback_ai_config(p_key TEXT, p_target_version INTEGER, p_by TEXT DEFAULT 'admin')
      RETURNS JSONB LANGUAGE plpgsql AS $fn$
      DECLARE old_val JSONB; cur_val JSONB; new_ver INTEGER;
      BEGIN
        SELECT old_value INTO old_val FROM config_change_log
        WHERE config_key = p_key AND version = p_target_version + 1
        ORDER BY changed_at ASC LIMIT 1;
        IF old_val IS NULL THEN RAISE EXCEPTION 'Version % not found for key %', p_target_version, p_key; END IF;
        SELECT value, version INTO cur_val, new_ver FROM ai_config WHERE key = p_key;
        UPDATE ai_config SET value = old_val, version = new_ver + 1, updated_at = NOW(), updated_by = p_by WHERE key = p_key;
        INSERT INTO config_change_log (config_key, old_value, new_value, version, changed_by, reason)
        VALUES (p_key, cur_val, old_val, new_ver + 1, p_by, 'rollback to v' || p_target_version);
        RETURN jsonb_build_object('ok', true, 'key', p_key, 'restored_to_version', p_target_version);
      END; $fn$;

      CREATE OR REPLACE FUNCTION ai_config_audit_trigger()
      RETURNS TRIGGER LANGUAGE plpgsql AS $fn$
      BEGIN
        IF OLD.value IS DISTINCT FROM NEW.value THEN
          INSERT INTO config_change_log (config_key, old_value, new_value, version, changed_by)
          VALUES (NEW.key, OLD.value, NEW.value, NEW.version, COALESCE(NEW.updated_by, 'system'));
        END IF;
        RETURN NEW;
      END; $fn$;

      DROP TRIGGER IF EXISTS trg_ai_config_audit ON ai_config;
      CREATE TRIGGER trg_ai_config_audit
      AFTER UPDATE ON ai_config FOR EACH ROW EXECUTE FUNCTION ai_config_audit_trigger();
    `);

    // ── 4. Seed defaults (idempotent) ──
    const keysSeeded = await runSql(`
      INSERT INTO ai_config (key, value, description, updated_by) VALUES
        ('confidence_threshold',             '0.75',   'Min AI confidence pro auto-complete pipeline kroků', 'system'),
        ('daily_ai_steps_cap',               '10',     'Max AI-driven kroků per pipeline per den', 'system'),
        ('require_human_approval_above_usd', '500000', 'Finanční limit pro povinné human approval', 'system'),
        ('ai_audit_enabled',                 'true',   'Logovat každé AI rozhodnutí do pipeline_step_logs', 'system')
      ON CONFLICT (key) DO NOTHING
      RETURNING key;
    `);

    const flagsSeeded = await runSql(`
      INSERT INTO feature_toggles (key, is_enabled, allowed_roles, description, updated_by) VALUES
        ('enable_ai_autopublish',     FALSE, ARRAY['admin'],          'AI smí automaticky publikovat listings', 'system'),
        ('enable_market_valuation',   TRUE,  NULL,                    'OMVM valuace je dostupná', 'system'),
        ('enable_buyer_matching',     TRUE,  ARRAY['admin','broker'], 'CMR engine párování kupců', 'system'),
        ('enable_facebook_connector', FALSE, ARRAY['admin'],          'Facebook API connector', 'system'),
        ('enable_chatgpt_tools',      TRUE,  NULL,                    'ChatGPT plugin endpoints', 'system')
      ON CONFLICT (key) DO NOTHING
      RETURNING key;
    `);

    // ── 5. Report current state ──
    const configRows = await runSql(`SELECT key, value, version, updated_at, updated_by FROM ai_config ORDER BY key;`);
    const flagRows = await runSql(`SELECT key, is_enabled, allowed_roles, description FROM feature_toggles ORDER BY key;`);

    return Response.json({
      ok: true,
      governance: {
        tables_created: ['ai_config', 'config_change_log', 'feature_toggles', 'pipeline_step_logs'],
        keys_seeded: Array.isArray(keysSeeded) ? keysSeeded.map((r) => r.key) : [],
        flags_seeded: Array.isArray(flagsSeeded) ? flagsSeeded.map((r) => r.key) : [],
        ai_config: Array.isArray(configRows) ? configRows : [],
        feature_toggles: Array.isArray(flagRows) ? flagRows : [],
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});