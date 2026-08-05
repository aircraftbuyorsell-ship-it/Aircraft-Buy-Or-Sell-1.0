import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Admin-only: destructive cleanup that bypasses RLS via asServiceRole.
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden — admin only' }, { status: 403 });

    const results = {
      userProfile: { deleted: 0, kept: 0, errors: [] },
      partnerConfig: { deleted: 0, kept: 0, errors: [] },
      developerAccount: { deleted: 0, kept: 0, errors: [] },
      aircraftListing: { deleted: 0, kept: 0, errors: [] },
      salesPipeline: { deleted: 0, kept: 0, errors: [] },
      skillDefinition: { deleted: 0, kept: 0, errors: [] },
      workflow: { deleted: 0, kept: 0, errors: [] },
      marketForecast: { deleted: 0, kept: 0, errors: [] },
    };

    // 1. UserProfile — keep admin/enterprise/elite/active (6a57496e46672642404f4e64)
    try {
      const profiles = await base44.asServiceRole.entities.UserProfile.filter(
        { user_email: "aircraftbuyorsell@gmail.com" },
        undefined,
        20
      );
      const keepId = "6a57496e46672642404f4e64";
      for (const p of profiles) {
        if (p.id !== keepId) {
          try {
            await base44.asServiceRole.entities.UserProfile.delete(p.id);
            results.userProfile.deleted++;
          } catch (e) { results.userProfile.errors.push(`Failed: ${e.message}`); }
        } else { results.userProfile.kept++; }
      }
    } catch (e) { results.userProfile.errors.push(`Query failed: ${e.message}`); }

    // 2. PartnerConfig — keep newest (6a486c8ba6897a766d90e517)
    try {
      const partners = await base44.asServiceRole.entities.PartnerConfig.list('-created_date', 20);
      const keepId = "6a486c8ba6897a766d90e517";
      for (const p of partners) {
        if (p.id !== keepId) {
          try { await base44.asServiceRole.entities.PartnerConfig.delete(p.id); results.partnerConfig.deleted++; }
          catch (e) { results.partnerConfig.errors.push(`Failed: ${e.message}`); }
        } else { results.partnerConfig.kept++; }
      }
    } catch (e) { results.partnerConfig.errors.push(`Query failed: ${e.message}`); }

    // 3. DeveloperAccount — keep active (6a57496e46672642404f4e75)
    try {
      const devs = await base44.asServiceRole.entities.DeveloperAccount.list('-created_date', 20);
      const keepId = "6a57496e46672642404f4e75";
      for (const d of devs) {
        if (d.id !== keepId) {
          try { await base44.asServiceRole.entities.DeveloperAccount.delete(d.id); results.developerAccount.deleted++; }
          catch (e) { results.developerAccount.errors.push(`Failed: ${e.message}`); }
        } else { results.developerAccount.kept++; }
      }
    } catch (e) { results.developerAccount.errors.push(`Query failed: ${e.message}`); }

    // 4. AircraftListing — keep newest active (6a57496f46672642404f4eec)
    try {
      const listings = await base44.asServiceRole.entities.AircraftListing.list('-created_date', 20);
      const keepId = "6a57496f46672642404f4eec";
      for (const l of listings) {
        if (l.id !== keepId) {
          try { await base44.asServiceRole.entities.AircraftListing.delete(l.id); results.aircraftListing.deleted++; }
          catch (e) { results.aircraftListing.errors.push(`Failed: ${e.message}`); }
        } else { results.aircraftListing.kept++; }
      }
    } catch (e) { results.aircraftListing.errors.push(`Query failed: ${e.message}`); }

    // 5. SalesPipeline — delete draft N3006Q
    try { await base44.asServiceRole.entities.SalesPipeline.delete("6a57496e46672642404f4e92"); results.salesPipeline.deleted++; }
    catch (e) { results.salesPipeline.errors.push(`Failed: ${e.message}`); }

    // 6. SkillDefinition — delete older duplicate batch
    const oldSkillIds = ["6a57496f46672642404f4ed9","6a57496f46672642404f4ed3","6a57496e46672642404f4ea7","6a57496e46672642404f4e7c","6a57496e46672642404f4e74"];
    for (const id of oldSkillIds) {
      try { await base44.asServiceRole.entities.SkillDefinition.delete(id); results.skillDefinition.deleted++; }
      catch (e) { results.skillDefinition.errors.push(`${id}: ${e.message}`); }
    }

    // 7. Workflow — delete Batch A (older duplicates)
    const oldWorkflowIds = ["6a57496f46672642404f4ef0","6a57496f46672642404f4eeb","6a57496f46672642404f4ee5","6a57496f46672642404f4eda","6a57496f46672642404f4ec6"];
    for (const id of oldWorkflowIds) {
      try { await base44.asServiceRole.entities.Workflow.delete(id); results.workflow.deleted++; }
      catch (e) { results.workflow.errors.push(`${id}: ${e.message}`); }
    }

    // 8. MarketForecast — delete 7 empty Gemini forecasts
    const emptyForecastIds = ["6a6f93daf8a0bae1bb953bdc","6a665954dd140a6257f8b68d","6a5d1ede572260e66e3da412","6a57496e46672642404f4ea6","6a57496e46672642404f4e6f","6a53e45cf4af6d0b52fa782c","6a4aa9d96536aab3584f2976"];
    for (const id of emptyForecastIds) {
      try { await base44.asServiceRole.entities.MarketForecast.delete(id); results.marketForecast.deleted++; }
      catch (e) { results.marketForecast.errors.push(`${id}: ${e.message}`); }
    }

    return Response.json({ ok: true, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});