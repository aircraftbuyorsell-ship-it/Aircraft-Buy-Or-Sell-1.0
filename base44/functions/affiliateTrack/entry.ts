// Public tracking endpoint for the affiliate program.
// Called anonymously from landing pages on click, and after lead/conversion
// events, to bump counters, fan out webhooks, and notify the link owner.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const COUNTER_FIELD = {
  click: 'click_count',
  lead: 'lead_count',
  conversion: 'conversion_count',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { event_type, slug, chain_slugs = [], metadata = {} } = body;

    if (!event_type || !COUNTER_FIELD[event_type]) {
      return Response.json({ error: 'event_type must be one of click, lead, conversion' }, { status: 400 });
    }
    if (!slug) {
      return Response.json({ error: 'slug is required' }, { status: 400 });
    }

    const links = await base44.asServiceRole.entities.AffiliateLink.filter({ slug }, '-created_date', 1);
    const link = links[0];
    if (!link || !link.is_active) {
      return Response.json({ tracked: false, reason: 'unknown_or_inactive_link' });
    }

    const field = COUNTER_FIELD[event_type];
    const patch = { [field]: (link[field] || 0) + 1 };
    if (event_type === 'click') patch.last_click_at = new Date().toISOString();
    await base44.asServiceRole.entities.AffiliateLink.update(link.id, patch);

    // Fan out to any admin-configured webhooks subscribed to this event.
    const webhookEvent = `affiliate.${event_type}`;
    const webhooks = await base44.asServiceRole.entities.WebhookConfig.filter({ is_active: true });
    const matching = (webhooks || []).filter(w => w.events?.includes(webhookEvent));
    const payload = {
      slug: link.slug,
      owner_email: link.owner_email,
      owner_role: link.owner_role,
      target_type: link.target_type,
      target_card: link.target_card,
      target_listing: link.target_listing,
      campaign_id: link.campaign_id,
      chain_slugs,
      metadata,
    };

    for (const wh of matching) {
      const deliveryBody = JSON.stringify({
        event: webhookEvent,
        timestamp: new Date().toISOString(),
        data: payload,
      });
      const headers = {
        'Content-Type': 'application/json',
        'X-ABOS-Event': webhookEvent,
        'X-ABOS-Timestamp': Date.now().toString(),
      };
      if (wh.secret) {
        const key = await crypto.subtle.importKey(
          'raw',
          new TextEncoder().encode(wh.secret),
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        );
        const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(deliveryBody));
        const hexSig = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
        headers['X-ABOS-Signature'] = `sha256=${hexSig}`;
      }
      let status = 0;
      try {
        const res = await fetch(wh.url, { method: 'POST', headers, body: deliveryBody, signal: AbortSignal.timeout(8000) });
        status = res.status;
      } catch { status = 0; }
      const success = status >= 200 && status < 300;
      await base44.asServiceRole.entities.WebhookConfig.update(wh.id, {
        last_triggered_at: new Date().toISOString(),
        last_status: status,
        trigger_count: (wh.trigger_count || 0) + (success ? 1 : 0),
      });
    }

    // Notify the affiliate owner by email on lead/conversion (not on every click).
    if (event_type !== 'click' && link.owner_email) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: link.owner_email,
          subject: event_type === 'conversion'
            ? `New conversion on your affiliate link ${link.slug}`
            : `New lead on your affiliate link ${link.slug}`,
          body: `Your affiliate link ${link.slug} just recorded a ${event_type}.\n\n` +
            `Target: ${link.target_type} ${link.target_card || link.target_listing || ''}\n` +
            `Campaign: ${link.campaign_id || 'n/a'}\n\n` +
            `Totals so far — clicks: ${link.click_count || 0}, leads: ${(link.lead_count || 0) + (event_type === 'lead' ? 1 : 0)}, conversions: ${(link.conversion_count || 0) + (event_type === 'conversion' ? 1 : 0)}.`,
        });
      } catch { /* best-effort */ }
    }

    return Response.json({ tracked: true, webhooks_delivered: matching.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
