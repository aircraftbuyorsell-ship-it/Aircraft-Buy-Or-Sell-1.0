import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const PRICING = [
  { key: 'API_STARTER', name: 'ABOS API — Starter', price_eur: 690, billing: 'per month', best_for: 'Developers and initial production integrations' },
  { key: 'API_PROFESSIONAL', name: 'ABOS API — Professional', price_eur: 1890, billing: 'per month', best_for: 'Platforms, brokers, dealers and production products' },
  { key: 'API_ENTERPRISE', name: 'ABOS API — Enterprise', price_eur: 3900, billing: 'per month / contract', best_for: 'Enterprise aviation infrastructure' },
  { key: 'WHITE_LABEL_LICENSE', name: 'ABOS White-Label Integration License', price_eur: 2500, billing: 'one-time', best_for: 'Approved white-label partners' },
];
const POSITIONS = new Set(['Founder','CEO','CTO','CSO','COO','Developer','Engineering','Product','Marketing','Other']);
const CHANNELS = new Set(['Facebook','Google','Instagram','LinkedIn','YouTube','Email','Direct / Organic','Other']);
const AUDIENCES = new Set(['Aircraft buyers','Aircraft sellers','Brokers / dealers','Owners','Operators','Maintenance / service','Lenders / finance','Other']);
const clean = (v: unknown, max = 500) => String(v ?? '').trim().slice(0, max);
const list = (v: unknown, allowed: Set<string>) => Array.isArray(v) ? v.map(x => clean(x, 80)).filter(x => allowed.has(x)).slice(0, 12) : [];
function recommended(requested: string, views: string) {
  if (PRICING.some(p => p.name === requested)) return requested;
  const n = Number(views.replace(/[^0-9.]/g, ''));
  if (Number.isFinite(n) && n >= 100000) return PRICING[2].name;
  if (Number.isFinite(n) && n >= 10000) return PRICING[1].name;
  return PRICING[0].name;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return Response.json({ error: 'POST required' }, { status: 405 });
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const honeypot = clean(body.website);
    if (honeypot) return Response.json({ ok: true, pricing_unlocked: true, spam: true });

    const email = clean(body.email, 320).toLowerCase();
    const fullName = clean(body.full_name || body.name, 200);
    const companyName = clean(body.company_name || body.company, 200);
    const companyUrl = clean(body.company_url || body.website_url, 500);
    const position = clean(body.position, 100);
    const privacyAcknowledged = body.privacy_acknowledged === true;
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) return Response.json({ error: 'A valid business email is required.' }, { status: 400 });
    if (!fullName || !companyName || !companyUrl || !position) return Response.json({ error: 'Full name, company name, company URL and position are required.' }, { status: 400 });
    if (!POSITIONS.has(position)) return Response.json({ error: 'Invalid position.' }, { status: 400 });
    if (!privacyAcknowledged) return Response.json({ error: 'Privacy acknowledgement is required.' }, { status: 400 });

    const monthlyViews = clean(body.monthly_listing_views, 100);
    const monthlyVisitors = clean(body.monthly_unique_visitors, 100);
    const marketingChannels = list(body.marketing_channels, CHANNELS);
    const targetAudience = list(body.target_audience, AUDIENCES);
    const useCase = clean(body.use_case, 2000);
    const requestedPlan = clean(body.requested_plan, 200);
    const registration = clean(body.aircraft_registration || body.registration, 32).toUpperCase();
    const recommendedPlan = recommended(requestedPlan, monthlyViews);

    const inquiry = await base44.asServiceRole.entities.ApiInstallerInquiry.create({
      full_name: fullName, email, company_name: companyName, company_url: companyUrl, position,
      aircraft_registration: registration, monthly_listing_views: monthlyViews, monthly_unique_visitors: monthlyVisitors,
      marketing_channels: marketingChannels, target_audience: targetAudience, use_case: useCase, requested_plan: requestedPlan,
      privacy_acknowledged: true, source: 'api-installer-request', pricing_unlocked: true,
      recommended_plan: recommendedPlan, created_at_client: clean(body.created_at_client, 80),
    });

    // Only explicitly configured admin webhooks receive this business-demographic data.
    const webhooks = await base44.asServiceRole.entities.WebhookConfig.filter({ is_active: true });
    const payload = {
      inquiry_id: inquiry.id, event: 'api.installer_request.created',
      full_name: fullName, email, company_name: companyName, company_url: companyUrl, position,
      aircraft_registration: registration, monthly_listing_views: monthlyViews, monthly_unique_visitors: monthlyVisitors,
      marketing_channels: marketingChannels, target_audience: targetAudience, use_case: useCase,
      requested_plan: requestedPlan, recommended_plan: recommendedPlan, purpose: 'personalized_api_offer_only',
    };
    for (const wh of (webhooks || []).filter(w => w.events?.includes('api.installer_request.created'))) {
      const bodyText = JSON.stringify(payload);
      const headers: Record<string, string> = { 'Content-Type': 'application/json', 'X-ABOS-Event': 'api.installer_request.created', 'X-ABOS-Timestamp': Date.now().toString() };
      if (wh.secret) {
        const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(wh.secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
        const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(bodyText));
        headers['X-ABOS-Signature'] = `sha256=${Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')}`;
      }
      try { await fetch(wh.url, { method: 'POST', headers, body: bodyText, signal: AbortSignal.timeout(8000) }); } catch (_) {}
    }

    return Response.json({ ok: true, pricing_unlocked: true, submitted_email: email, recommended_plan: recommendedPlan, pricing: PRICING, integration_kit: { filename: 'ABOS-API-Integration-Kit.json', url: '/ABOS-API-Integration-Kit.json' }, inquiry_id: inquiry.id });
  } catch (error) {
    return Response.json({ error: error?.message || 'Request failed.' }, { status: 500 });
  }
});
