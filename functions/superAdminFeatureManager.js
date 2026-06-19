import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'super_admin') {
      return Response.json({ error: 'Forbidden: Super admin access required' }, { status: 403 });
    }

    const { action, feature_name, data } = await req.json();

    switch (action) {

      case 'list_all_features': {
        const toggles = await base44.asServiceRole.entities.FeatureToggle.list('-created_date', 500);
        return Response.json({ toggles, count: toggles.length });
      }

      case 'bulk_enable_all': {
        const { tier } = data || {};
        const toggles = await base44.asServiceRole.entities.FeatureToggle.list('-created_date', 500);
        const results = [];
        for (const t of toggles) {
          const updated = await base44.asServiceRole.entities.FeatureToggle.update(t.id, {
            enabled_for_tiers: { ...(t.enabled_for_tiers || {}), [tier]: true },
            status: 'enabled',
            modified_by: user.email,
            last_modified: new Date().toISOString(),
          });
          results.push(updated.feature_name);
        }
        return Response.json({ success: true, updated: results.length, features: results });
      }

      case 'bulk_disable_all': {
        const { tier } = data || {};
        const toggles = await base44.asServiceRole.entities.FeatureToggle.list('-created_date', 500);
        const results = [];
        for (const t of toggles) {
          const updated = await base44.asServiceRole.entities.FeatureToggle.update(t.id, {
            enabled_for_tiers: { ...(t.enabled_for_tiers || {}), [tier]: false },
            status: 'disabled',
            modified_by: user.email,
            last_modified: new Date().toISOString(),
          });
          results.push(updated.feature_name);
        }
        return Response.json({ success: true, updated: results.length, features: results });
      }

      case 'reset_all': {
        const toggles = await base44.asServiceRole.entities.FeatureToggle.list('-created_date', 500);
        let deleted = 0;
        for (const t of toggles) {
          await base44.asServiceRole.entities.FeatureToggle.delete(t.id);
          deleted++;
        }
        return Response.json({ success: true, deleted });
      }

      case 'sync_catalog': {
        // Get all existing toggles
        const existing = await base44.asServiceRole.entities.FeatureToggle.list('-created_date', 500);
        const existingKeys = new Set(existing.map(t => t.feature_name));

        return Response.json({
          existing_count: existing.length,
          existing_keys: [...existingKeys],
          summary: `Found ${existing.length} existing toggles`,
        });
      }

      default:
        return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});