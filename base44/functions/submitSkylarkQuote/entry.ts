import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const clean = (v: unknown, max = 500) => String(v ?? '').trim().slice(0, max);
const cleanList = (v: unknown) => Array.isArray(v) ? v.map(x => clean(x, 150)).filter(Boolean).slice(0, 20) : [];

Deno.serve(async (req) => {
  if (req.method !== 'POST') return Response.json({ error: 'POST required' }, { status: 405 });
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    if (clean(body.website)) return Response.json({ ok: true, spam: true });

    const name = clean(body.name, 200);
    const email = clean(body.email, 320).toLowerCase();
    const country = clean(body.country, 100);
    const language = body.language === 'cs' ? 'cs' : 'en';
    const consent = body.consent === true;
    if (!name || !email || !/^\S+@\S+\.\S+$/.test(email)) return Response.json({ error: 'Valid name and email are required.' }, { status: 400 });
    if (!consent) return Response.json({ error: 'Consent is required.' }, { status: 400 });

    const requestRecord = await base44.asServiceRole.entities.SkylarkQuoteRequest.create({
      name,
      email,
      country,
      language,
      engine: clean(body.engine, 100),
      avionics: clean(body.avionics, 200),
      equipment: cleanList(body.equipment),
      paint: clean(body.paint, 100),
      estimated_price: Number.isFinite(Number(body.estimated_price)) ? Number(body.estimated_price) : null,
      currency: 'EUR',
      price_status: ['indicative', 'configuration_required', 'not_configured'].includes(body.price_status) ? body.price_status : 'not_configured',
      campaign: clean(body.campaign, 100),
      affiliate_slug: clean(body.affiliate_slug, 100),
      referrer: clean(body.referrer, 500),
      demo_flight_interest: body.demo_flight_interest === true,
      consent: true,
      status: 'new',
    });

    const equipment = cleanList(body.equipment);
    const price = Number(body.estimated_price);
    const priceLine = Number.isFinite(price) && price > 0
      ? `Indicative configuration price: €${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
      : 'Indicative price: to be confirmed by AirVisions from the selected configuration.';

    const message = [
      language === 'cs' ? 'Nová poptávka — LANDA Aircraft Skylark / ABOS' : 'New request — LANDA Aircraft Skylark / ABOS',
      '',
      `Name: ${name}`,
      `Email: ${email}`,
      `Country: ${country || '—'}`,
      `Engine: ${clean(body.engine, 100) || '—'}`,
      `Avionics: ${clean(body.avionics, 200) || '—'}`,
      `Equipment: ${equipment.join(', ') || '—'}`,
      `Paint: ${clean(body.paint, 100) || '—'}`,
      priceLine,
      `Demo flight interest: ${body.demo_flight_interest === true ? 'YES — DirectFly Brno' : 'No'}`,
      `Campaign: ${clean(body.campaign, 100) || '—'}`,
      `Affiliate/referral: ${clean(body.affiliate_slug, 100) || '—'}`,
      `Referrer: ${clean(body.referrer, 500) || '—'}`,
      `Request ID: ${requestRecord.id}`,
      `Timestamp: ${new Date().toISOString()}`,
    ].join('\n');

    const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' }, '-created_date', 50).catch(() => []);
    let notified = 0;
    for (const admin of admins || []) {
      if (!admin?.email) continue;
      try {
        await base44.integrations.Core.SendEmail({ to: admin.email, subject: `Skylark buyer lead — ${name}`, body: message });
        notified++;
      } catch (_) {}
    }

    try {
      await base44.integrations.Core.SendEmail({
        to: email,
        subject: language === 'cs' ? 'Vaše konfigurace LANDA Skylark — Aircraft Buy Or Sell' : 'Your LANDA Skylark configuration — Aircraft Buy Or Sell',
        body: language === 'cs'
          ? `Děkujeme za váš zájem o LANDA Aircraft Skylark.\n\n${priceLine}\n\nVaše konfigurace:\nMotor: ${clean(body.engine, 100) || '—'}\nAvionika: ${clean(body.avionics, 200) || '—'}\nVýbava: ${equipment.join(', ') || '—'}\nBarva: ${clean(body.paint, 100) || '—'}\n\nTato kalkulace je nezávazná a finální cenu potvrdí AirVisions. Další informace získáte na oficiálním webu AirVisions.`
          : `Thank you for your interest in the LANDA Aircraft Skylark.\n\n${priceLine}\n\nYour configuration:\nEngine: ${clean(body.engine, 100) || '—'}\nAvionics: ${clean(body.avionics, 200) || '—'}\nEquipment: ${equipment.join(', ') || '—'}\nPaint: ${clean(body.paint, 100) || '—'}\n\nThis is a non-binding indicative calculation. Final pricing will be confirmed by AirVisions. Please continue to the official AirVisions website for the next step.`,
      });
    } catch (_) {}

    return Response.json({ ok: true, request_id: requestRecord.id, notified_admins: notified, affiliate_slug: clean(body.affiliate_slug, 100) });
  } catch (error) {
    return Response.json({ error: error?.message || 'Request failed.' }, { status: 500 });
  }
});
