import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Admin-only: destructive cleanup that bypasses RLS via asServiceRole.
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const results = { deleted: {}, kept: {}, errors: {} };

    // Helper: delete by ID with fallback to user-scoped client
    async function tryDelete(entityName, id) {
      try {
        await base44.asServiceRole.entities[entityName].delete(id);
        return true;
      } catch (e1) {
        try {
          await base44.entities[entityName].delete(id);
          return true;
        } catch (e2) {
          if (!results.errors[entityName]) results.errors[entityName] = [];
          results.errors[entityName].push(`${id}: ${(e1?.message) || (e2?.message) || String(e1)}`);
          return false;
        }
      }
    }

    // 1. UserProfile — keep admin/enterprise/elite/active (6a57496e46672642404f4e64)
    try {
      const all = await base44.asServiceRole.entities.UserProfile.list('-created_date', 50);
      results.kept.UserProfile = 0;
      results.deleted.UserProfile = 0;
      const keepId = "6a57496e46672642404f4e64";
      for (const p of all) {
        if (p.id === keepId) { results.kept.UserProfile++; continue; }
        if (p.user_email === "aircraftbuyorsell@gmail.com") {
          if (await tryDelete("UserProfile", p.id)) results.deleted.UserProfile++;
        }
      }
    } catch (e) { results.errors.UserProfile = [`list failed: ${e?.message || String(e)}`]; }

    // 2. PartnerConfig — keep newest (6a486c8ba6897a766d90e517)
    try {
      const all = await base44.asServiceRole.entities.PartnerConfig.list('-created_date', 50);
      results.kept.PartnerConfig = 0;
      results.deleted.PartnerConfig = 0;
      const keepId = "6a486c8ba6897a766d90e517";
      for (const p of all) {
        if (p.id === keepId) { results.kept.PartnerConfig++; continue; }
        if (await tryDelete("PartnerConfig", p.id)) results.deleted.PartnerConfig++;
      }
    } catch (e) { results.errors.PartnerConfig = [`list failed: ${e?.message || String(e)}`]; }

    // 3. DeveloperAccount — keep active (6a57496e46672642404f4e75)
    try {
      const all = await base44.asServiceRole.entities.DeveloperAccount.list('-created_date', 50);
      results.kept.DeveloperAccount = 0;
      results.deleted.DeveloperAccount = 0;
      const keepId = "6a57496e46672642404f4e75";
      for (const d of all) {
        if (d.id === keepId) { results.kept.DeveloperAccount++; continue; }
        if (d.user_email === "aircraftbuyorsell@gmail.com") {
          if (await tryDelete("DeveloperAccount", d.id)) results.deleted.DeveloperAccount++;
        }
      }
    } catch (e) { results.errors.DeveloperAccount = [`list failed: ${e?.message || String(e)}`]; }

    // 4. AircraftListing — keep newest active (6a57496f46672642404f4eec)
    try {
      const all = await base44.asServiceRole.entities.AircraftListing.list('-created_date', 50);
      results.kept.AircraftListing = 0;
      results.deleted.AircraftListing = 0;
      const keepId = "6a57496f46672642404f4eec";
      for (const l of all) {
        if (l.id === keepId) { results.kept.AircraftListing++; continue; }
        if (await tryDelete("AircraftListing", l.id)) results.deleted.AircraftListing++;
      }
    } catch (e) { results.errors.AircraftListing = [`list failed: ${e?.message || String(e)}`]; }

    // 5. SkillDefinition — delete older batch (6a5749 prefix)
    try {
      const all = await base44.asServiceRole.entities.SkillDefinition.list('-created_date', 50);
      results.deleted.SkillDefinition = 0;
      for (const s of all) {
        if (s.id && s.id.startsWith("6a5749")) {
          if (await tryDelete("SkillDefinition", s.id)) results.deleted.SkillDefinition++;
        }
      }
    } catch (e) { results.errors.SkillDefinition = [`list failed: ${e?.message || String(e)}`]; }

    // 6. Workflow — delete Batch A (6a5749 prefix)
    try {
      const all = await base44.asServiceRole.entities.Workflow.list('-created_date', 50);
      results.deleted.Workflow = 0;
      for (const w of all) {
        if (w.id && w.id.startsWith("6a5749")) {
          if (await tryDelete("Workflow", w.id)) results.deleted.Workflow++;
        }
      }
    } catch (e) { results.errors.Workflow = [`list failed: ${e?.message || String(e)}`]; }

    // 7. MarketForecast — delete empty Gemini forecasts (hf_make is null)
    try {
      const all = await base44.asServiceRole.entities.MarketForecast.list('-created_date', 50);
      results.deleted.MarketForecast = 0;
      for (const f of all) {
        if (!f.hf_make && f.model_version === "gemini_3_1_pro") {
          if (await tryDelete("MarketForecast", f.id)) results.deleted.MarketForecast++;
        }
      }
    } catch (e) { results.errors.MarketForecast = [`list failed: ${e?.message || String(e)}`]; }

    // 8. SalesPipeline — delete duplicate N3006Q draft (6a57496e46672642404f4e92)
    try {
      const all = await base44.asServiceRole.entities.SalesPipeline.list('-created_date', 50);
      results.deleted.SalesPipeline = 0;
      for (const s of all) {
        if (s.id === "6a57496e46672642404f4e92") {
          if (await tryDelete("SalesPipeline", s.id)) results.deleted.SalesPipeline++;
        }
      }
    } catch (e) { results.errors.SalesPipeline = [`list failed: ${e?.message || String(e)}`]; }

    return Response.json({ ok: true, results });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
});