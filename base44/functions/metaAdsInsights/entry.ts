import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['admin', 'super_admin'].includes(user.role)) return Response.json({ error: 'Forbidden' }, { status: 403 });
    const { accountId, datePreset = 'last_30d' } = await req.json().catch(() => ({}));
    if (!/^\d+$/.test(String(accountId || ''))) return Response.json({ error: 'Valid ad account required' }, { status: 400 });
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('meta_ads');
    const headers = { Authorization: `Bearer ${accessToken}` };
    const ownedRes = await fetch('https://graph.facebook.com/v25.0/me/adaccounts?fields=account_id', { headers });
    const owned = ownedRes.ok ? (await ownedRes.json()).data || [] : [];
    if (!owned.some((item) => item.account_id === String(accountId))) return Response.json({ error: 'Ad account not available' }, { status: 403 });
    const account = `act_${accountId}`;
    const campaignsUrl = `https://graph.facebook.com/v25.0/${account}/campaigns?fields=id,name,status,effective_status,objective,daily_budget,lifetime_budget&limit=100`;
    const insightFields = 'campaign_id,campaign_name,spend,impressions,reach,clicks,ctr,cpc,actions,action_values,purchase_roas,date_start,date_stop';
    const insightsUrl = `https://graph.facebook.com/v25.0/${account}/insights?fields=${insightFields}&date_preset=${encodeURIComponent(datePreset)}&level=campaign&time_increment=1&limit=500`;
    const [campaignsRes, insightsRes] = await Promise.all([fetch(campaignsUrl, { headers }), fetch(insightsUrl, { headers })]);
    if (!campaignsRes.ok || !insightsRes.ok) throw new Error('Meta Ads insight request failed');
    const campaigns = (await campaignsRes.json()).data || [];
    const rows = ((await insightsRes.json()).data || []).map((row) => ({ ...row, leads: (row.actions || []).filter((a) => ['lead', 'onsite_conversion.lead_grouped', 'offsite_conversion.fb_pixel_lead'].includes(a.action_type)).reduce((sum, a) => sum + Number(a.value || 0), 0), revenue: (row.action_values || []).filter((a) => a.action_type.includes('purchase')).reduce((sum, a) => sum + Number(a.value || 0), 0), roas: Number(row.purchase_roas?.[0]?.value || 0) }));
    return Response.json({ campaigns, rows });
  } catch (error) {
    console.error('Meta Ads insights failed', error?.message || error);
    return Response.json({ error: 'Unable to load Meta Ads performance. The connection may need renewal.' }, { status: 500 });
  }
});