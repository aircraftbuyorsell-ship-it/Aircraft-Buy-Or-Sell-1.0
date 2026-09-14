import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['admin', 'super_admin'].includes(user.role)) return Response.json({ error: 'Forbidden' }, { status: 403 });
    const body = await req.json().catch(() => ({}));
    const accountId = String(body.accountId || '');
    if (!/^\d+$/.test(accountId)) return Response.json({ error: 'Valid ad account required' }, { status: 400 });
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('meta_ads');
    const headers = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
    const ownedRes = await fetch('https://graph.facebook.com/v25.0/me/adaccounts?fields=account_id', { headers });
    const owned = ownedRes.ok ? (await ownedRes.json()).data || [] : [];
    if (!owned.some((item) => item.account_id === accountId)) return Response.json({ error: 'Ad account not available' }, { status: 403 });
    if (body.action === 'create') {
      const name = String(body.name || '').trim().slice(0, 200);
      const objective = ['OUTCOME_TRAFFIC', 'OUTCOME_AWARENESS'].includes(body.objective) ? body.objective : 'OUTCOME_TRAFFIC';
      const budget = Number(body.budget);
      const countries = (body.countries || []).map((x) => String(x).toUpperCase()).filter((x) => /^[A-Z]{2}$/.test(x)).slice(0, 10);
      if (!name || budget < 1 || !countries.length) return Response.json({ error: 'Name, budget, and country are required' }, { status: 400 });
      const duplicate = await base44.asServiceRole.entities.MarketingCampaign.filter({ account_id: accountId, name }, '-created_date', 1);
      if (duplicate.length) return Response.json({ error: 'A campaign with this name is already tracked' }, { status: 409 });
      const campaignRes = await fetch(`https://graph.facebook.com/v25.0/act_${accountId}/campaigns`, { method: 'POST', headers, body: JSON.stringify({ name, objective, status: 'PAUSED', special_ad_categories: [] }) });
      const campaign = await campaignRes.json();
      if (!campaignRes.ok || !campaign.id) throw new Error('Campaign creation failed');
      const terms = (body.interestTerms || []).map((x) => String(x).trim()).filter(Boolean).slice(0, 5);
      const interestResults = await Promise.all(terms.map(async (term) => { const res = await fetch(`https://graph.facebook.com/v25.0/search?type=adinterest&q=${encodeURIComponent(term)}&limit=1`, { headers }); return res.ok ? (await res.json()).data?.[0] : null; }));
      const targeting = { geo_locations: { countries }, age_min: Math.max(18, Number(body.ageMin) || 25), age_max: Math.min(65, Number(body.ageMax) || 65), ...(interestResults.filter(Boolean).length ? { interests: interestResults.filter(Boolean).map(({ id, name: label }) => ({ id, name: label })) } : {}) };
      const budgetType = body.budgetType === 'lifetime' ? 'lifetime' : 'daily';
      const adsetPayload = { name: `${name} — Audience`, campaign_id: campaign.id, billing_event: 'IMPRESSIONS', optimization_goal: objective === 'OUTCOME_AWARENESS' ? 'REACH' : 'LINK_CLICKS', bid_strategy: 'LOWEST_COST_WITHOUT_CAP', targeting, status: 'PAUSED', [budgetType === 'daily' ? 'daily_budget' : 'lifetime_budget']: Math.round(budget * 100) };
      if (budgetType === 'lifetime') { adsetPayload.start_time = new Date(Date.now() + 3600000).toISOString(); adsetPayload.end_time = new Date(Date.now() + (Math.max(2, Number(body.durationDays) || 30) * 86400000)).toISOString(); }
      const adsetRes = await fetch(`https://graph.facebook.com/v25.0/act_${accountId}/adsets`, { method: 'POST', headers, body: JSON.stringify(adsetPayload) });
      const adset = await adsetRes.json();
      if (!adsetRes.ok || !adset.id) { await fetch(`https://graph.facebook.com/v25.0/${campaign.id}`, { method: 'DELETE', headers }); throw new Error('Ad set creation failed'); }
      const audienceSummary = `${countries.join(', ')} · ages ${targeting.age_min}-${targeting.age_max}${terms.length ? ` · ${terms.join(', ')}` : ' · broad aviation audience'}`;
      const record = await base44.asServiceRole.entities.MarketingCampaign.create({ account_id: accountId, campaign_id: campaign.id, adset_id: adset.id, name, status: 'PAUSED', budget, budget_type: budgetType, objective, audience_summary: audienceSummary, countries, interest_terms: terms, created_at: new Date().toISOString() });
      return Response.json({ success: true, campaign: record });
    }
    const records = await base44.asServiceRole.entities.MarketingCampaign.filter({ account_id: accountId, campaign_id: String(body.campaignId || '') }, '-created_date', 1);
    const record = records[0];
    if (!record) return Response.json({ error: 'Tracked campaign not found' }, { status: 404 });
    if (body.action === 'status') {
      const status = body.status === 'ACTIVE' ? 'ACTIVE' : 'PAUSED';
      const response = await fetch(`https://graph.facebook.com/v25.0/${record.campaign_id}`, { method: 'POST', headers, body: JSON.stringify({ status }) });
      if (!response.ok) throw new Error('Campaign status update failed');
      await base44.asServiceRole.entities.MarketingCampaign.update(record.id, { status });
      return Response.json({ success: true, status });
    }
    if (body.action === 'budget') {
      const budget = Number(body.budget);
      if (budget < 1 || !record.adset_id) return Response.json({ error: 'Valid budget and ad set required' }, { status: 400 });
      const field = record.budget_type === 'lifetime' ? 'lifetime_budget' : 'daily_budget';
      const response = await fetch(`https://graph.facebook.com/v25.0/${record.adset_id}`, { method: 'POST', headers, body: JSON.stringify({ [field]: Math.round(budget * 100) }) });
      if (!response.ok) throw new Error('Budget update failed');
      await base44.asServiceRole.entities.MarketingCampaign.update(record.id, { budget });
      return Response.json({ success: true, budget });
    }
    return Response.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (error) {
    console.error('Meta campaign management failed', error?.message || error);
    return Response.json({ error: 'Unable to update the Meta campaign. Check the account and reconnect if needed.' }, { status: 500 });
  }
});