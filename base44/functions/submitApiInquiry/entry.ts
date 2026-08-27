import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/** Public API inquiry gate.
 * Accepts a visitor email + optional aircraft registration/use case, records a
 * lead, notifies ABOS admins, and returns the current API pricing catalog.
 * No authentication is required: this is intentionally the public /api front door.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const email = String(body.email || '').trim().toLowerCase();
    const name = String(body.name || '').trim();
    const company = String(body.company || '').trim();
    const registration = String(body.registration || '').trim().toUpperCase();
    const useCase = String(body.use_case || '').trim();
    const requestedPlan = String(body.requested_plan || '').trim();
    const website = String(body.website || '').trim(); // honeypot

    if (website) return Response.json({ ok: true, pricing_unlocked: true, spam: true });
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: 'A valid email address is required.' }, { status: 400 });
    }

    const pricing = [
      {
        key: 'API_STARTER',
        name: 'ABOS API — Starter',
        price_eur: 690,
        billing: 'per month',
        best_for: 'Developers, small products and initial production integrations',
        included: 'Core search, ATI Score, tenant-scoped API key, aircraft intelligence endpoints, usage monitoring and API documentation.'
      },
      {
        key: 'API_PROFESSIONAL',
        name: 'ABOS API — Professional',
        price_eur: 1890,
        billing: 'per month',
        best_for: 'Aircraft platforms, brokers, dealers and production intelligence products',
        included: 'Everything in Starter plus ATI Report API, OMVM valuation, market intelligence, expanded usage and developer integration support.'
      },
      {
        key: 'API_ENTERPRISE',
        name: 'ABOS API — Enterprise',
        price_eur: 3900,
        billing: 'per month / contract',
        best_for: 'Enterprise aviation infrastructure and high-volume deployments',
        included: 'Full capability set, Aircraft Passport and registry intelligence, advanced intelligence, custom usage, dedicated onboarding and contracted support/SLA where agreed.'
      },
      {
        key: 'WHITE_LABEL_LICENSE',
        name: 'ABOS White-Label Integration License',
        price_eur: 2500,
        billing: 'one-time',
        best_for: 'Partners who want an approved white-label integration',
        included: 'Lifetime approved white-label license, production integration setup, tenant configuration and integration documentation. API usage is billed separately.'
      }
    ];

    // Record the inquiry using the existing Lead model so it immediately lands
    // in the ABOS sales pipeline without creating a parallel lead database.
    try {
      await base44.asServiceRole.entities.Lead.create({
        name: name || email.split('@')[0],
        email,
        source: 'api_pricing_request',
        status: 'new',
        listing_label: registration ? `API inquiry · ${registration}` : 'API inquiry',
        notes: [
          company ? `Company: ${company}` : '',
          registration ? `Aircraft registration: ${registration}` : '',
          requestedPlan ? `Requested plan: ${requestedPlan}` : '',
          useCase ? `Use case: ${useCase}` : ''
        ].filter(Boolean).join('\n')
      });
    } catch (_) { /* inquiry delivery should not fail if CRM write is unavailable */ }

    // Notify all ABOS admins/super-admins.
    try {
      const users = await base44.asServiceRole.entities.User.list('-created_date', 100);
      const admins = users
        .filter(u => u.role === 'admin' || u.role === 'super_admin')
        .map(u => u.email)
        .filter(Boolean);
      const subject = `[ABOS API] Pricing request${registration ? ` · ${registration}` : ''}`;
      const bodyText = `New public ABOS API pricing request\n\nName: ${name || '—'}\nEmail: ${email}\nCompany: ${company || '—'}\nRegistration: ${registration || '—'}\nRequested plan: ${requestedPlan || '—'}\nUse case: ${useCase || '—'}\n\nPricing was unlocked for the visitor after email submission.\n\n— ABOS API`;
      await Promise.all(admins.map(to => base44.asServiceRole.integrations.Core.SendEmail({
        to,
        subject,
        body: bodyText,
        from_name: 'ABOS API Requests'
      }).catch(() => null)));
    } catch (_) { /* notification is non-critical */ }

    return Response.json({
      ok: true,
      pricing_unlocked: true,
      submitted_email: email,
      pricing,
      integration_kit: {
        filename: 'ABOS-API-Integration-Kit.json',
        url: '/ABOS-API-Integration-Kit.json'
      }
    });
  } catch (error) {
    return Response.json({ error: error?.message || 'Request failed.' }, { status: 500 });
  }
});
