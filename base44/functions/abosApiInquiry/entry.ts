import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

/**
 * Public API pricing / access request webhook.
 * Collects a lightweight lead, notifies ABOS admins, and returns a safe
 * confirmation payload. No Stripe secrets or internal pricing logic live here.
 */
Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') return Response.json({ error: 'POST required' }, { status: 405 });

    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    // Honeypot for basic bot protection.
    if (body.website) return Response.json({ ok: true });

    const email = String(body.email || '').trim().toLowerCase();
    const name = String(body.name || '').trim();
    const company = String(body.company || '').trim();
    const useCase = String(body.use_case || '').trim();
    const volume = String(body.volume || '').trim();
    const planInterest = String(body.plan_interest || '').trim();

    if (!email || !email.includes('@')) {
      return Response.json({ error: 'A valid email is required.' }, { status: 400 });
    }

    const requester = await base44.auth.me().catch(() => null);
    const requesterEmail = requester?.email || email;

    const admins = await base44.asServiceRole.entities.User.filter(
      { role: 'admin' },
      '-created_date',
      50
    ).catch(() => []);

    const subject = `ABOS API access request — ${company || name || email}`;
    const message = [
      'New ABOS API access / pricing request',
      '',
      `Name: ${name || '—'}`,
      `Email: ${requesterEmail}`,
      `Company: ${company || '—'}`,
      `Use case: ${useCase || '—'}`,
      `Expected volume: ${volume || '—'}`,
      `Plan interest: ${planInterest || '—'}`,
      `Source: ${body.source || 'aircraftbuyorsell.com/api'}`,
      `Timestamp: ${new Date().toISOString()}`,
    ].join('\n');

    let notified = 0;
    for (const admin of admins) {
      if (!admin?.email) continue;
      try {
        await base44.integrations.Core.SendEmail({
          to: admin.email,
          subject,
          body: message,
        });
        notified++;
      } catch (_) {}
    }

    if (notified === 0 && requesterEmail) {
      // Keep the request observable even if no admin recipient is configured.
      try {
        await base44.integrations.Core.SendEmail({
          to: requesterEmail,
          subject: 'ABOS API request received',
          body: 'Your ABOS API access request was received. Our team will follow up with the appropriate API pricing and integration options.',
        });
      } catch (_) {}
    }

    return Response.json({
      ok: true,
      request_received: true,
      pricing_unlocked: true,
      notified_admins: notified,
      pricing_version: '2026-08-api-catalog-v1',
    });
  } catch (error) {
    return Response.json({ error: error?.message || 'Request failed' }, { status: 500 });
  }
});
