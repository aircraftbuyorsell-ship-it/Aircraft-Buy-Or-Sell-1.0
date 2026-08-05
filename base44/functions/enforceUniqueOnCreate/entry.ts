import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

/**
 * P0 data-integrity guard — runs on entity `create` events.
 * Enforces 1:1 / uniqueness invariants that the platform DB layer cannot:
 *   - UserProfile      : 1 row per user_email
 *   - DeveloperAccount : 1 row per user_email
 *   - PartnerConfig    : unique embed_token
 *   - AircraftListing  : 1 row per registration (status is an attribute, not a row)
 *
 * Strategy: when a new record duplicates an existing one, keep the OLDEST as the
 * canonical record, merge high-value fields from the new record into it, then delete
 * the newer duplicate(s). Safe because these entities are read by key (email/token/
 * registration), not by a stale client-cached id, so consumers always resolve to the keeper.
 */

const errToStr = (e) => {
  if (e == null) return 'Unknown error';
  if (typeof e === 'string') return e;
  if (e.message) return String(e.message);
  if (typeof e === 'object') { try { return JSON.stringify(e); } catch (_) { return '[object Object]'; } }
  return String(e);
};

// Privilege rankings for UserProfile role/tier merge (higher index = more privileged)
const ROLE_RANK = { viewer: 0, buyer: 1, seller: 2, dealer: 3, broker: 4, marketplace: 5, moderator: 6, admin: 7, super_admin: 8 };
const TIER_RANK = { free_explorer: 0, pro: 1, enterprise: 2 };
const SUB_RANK = { none: 0, starter: 1, scale: 2, plus: 3, premium: 4, elite: 5 };
const pickHigher = (a, b, rank) => (rank[b] ?? -1) > (rank[a] ?? -1) ? b : a;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Entity automations run without user context — trusted invocation
    let isAuthorized = false;
    try { const u = await base44.auth.me(); isAuthorized = u?.role === 'admin'; }
    catch (_) { isAuthorized = true; }
    if (!isAuthorized) return Response.json({ error: 'Admin access required' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { event, data } = body;
    const entityName = event?.entity_name;
    const newId = data?.id || event?.entity_id;
    if (!entityName || !newId || !data) {
      return Response.json({ skipped: true, reason: 'missing event/data' });
    }

    const E = base44.asServiceRole.entities[entityName];
    if (!E) return Response.json({ skipped: true, reason: `unknown entity ${entityName}` });

    // ── Per-entity key + query ──────────────────────────────────────────
    let keyField, keyValue;
    if (entityName === 'UserProfile' || entityName === 'DeveloperAccount') {
      keyField = 'user_email';
      keyValue = (data.user_email || '').trim().toLowerCase();
    } else if (entityName === 'PartnerConfig') {
      keyField = 'embed_token';
      keyValue = (data.embed_token || '').trim();
    } else if (entityName === 'AircraftListing') {
      keyField = 'registration';
      keyValue = (data.registration || '').trim().toUpperCase();
    } else {
      return Response.json({ skipped: true, reason: `entity ${entityName} not guarded` });
    }
    if (!keyValue) return Response.json({ skipped: true, reason: 'empty key' });

    // All records with the same key, oldest first (ascending created_date)
    const all = await E.filter({ [keyField]: keyValue }, 'created_date', 50);
    if (all.length <= 1) return Response.json({ ok: true, action: 'no_duplicates', entityName, key: keyValue });

    const keeper = all[0];
    const dups = all.filter((r) => r.id !== keeper.id); // includes the just-created record

    // ── Merge high-value fields from duplicates into the keeper ─────────
    let merged = {};
    if (entityName === 'UserProfile') {
      let role = keeper.role, tier = keeper.tier, sub = keeper.sub_tier;
      let perms = new Set(keeper.permissions || []);
      let lastLogin = keeper.last_login || '';
      for (const d of dups) {
        if (d.role) role = pickHigher(role, d.role, ROLE_RANK);
        if (d.tier) tier = pickHigher(tier, d.tier, TIER_RANK);
        if (d.sub_tier) sub = pickHigher(sub, d.sub_tier, SUB_RANK);
        for (const p of (d.permissions || [])) perms.add(p);
        if (d.last_login && d.last_login > lastLogin) lastLogin = d.last_login;
      }
      merged = { role, tier, sub_tier: sub, permissions: Array.from(perms), last_login: lastLogin || undefined };
      // Fill empties in keeper from the newest duplicate
      for (const f of ['display_name', 'bio', 'profile_image_url', 'last_ip_hash', 'custom_domain']) {
        if (!keeper[f] && dups[dups.length - 1][f]) merged[f] = dups[dups.length - 1][f];
      }
    } else if (entityName === 'AircraftListing') {
      // Status is an attribute — take the newest non-default status transition
      const newest = dups[dups.length - 1];
      merged = {};
      if (newest.status && newest.status !== keeper.status) merged.status = newest.status;
      // Fill keeper empties from the newest duplicate
      for (const f of ['make', 'model', 'year', 'total_time', 'engine_hours', 'tbo', 'last_annual', 'avionics', 'asking_price', 'ati_score', 'omvm_value', 'deal_score', 'deal_label', 'photo_url', 'photo_source', 'source_url', 'ai_summary']) {
        if (keeper[f] == null && newest[f] != null) merged[f] = newest[f];
      }
    } else if (entityName === 'DeveloperAccount') {
      const newest = dups[dups.length - 1];
      merged = {};
      for (const f of ['company_name', 'contact_email', 'website_url', 'bio', 'payout_method', 'payout_details']) {
        if (!keeper[f] && newest[f]) merged[f] = newest[f];
      }
    }
    // PartnerConfig: no merge — embed_token uniqueness only; keep oldest config intact.

    const updatePayload = { ...merged };
    if (Object.keys(updatePayload).length) {
      try { await E.update(keeper.id, updatePayload); }
      catch (e) { /* non-fatal — keep going to delete dups */ }
    }

    // ── Delete the duplicate(s) ─────────────────────────────────────────
    let deleted = 0;
    for (const d of dups) {
      try { await E.delete(d.id); deleted++; }
      catch (e) { /* log per-dup but continue */ }
    }

    return Response.json({
      ok: true,
      action: 'merged',
      entityName,
      key: keyValue,
      keeperId: keeper.id,
      deletedCount: deleted,
      mergedFields: Object.keys(updatePayload),
    });
  } catch (error) {
    return Response.json({ error: errToStr(error) }, { status: 500 });
  }
});