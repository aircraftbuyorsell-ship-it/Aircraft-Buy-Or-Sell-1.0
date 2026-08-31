import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { event_type, payload, webhook_id } = await req.json();

    if (!event_type) {
      return Response.json({ error: 'event_type is required' }, { status: 400 });
    }

    // Fetch matching active webhooks
    let webhooks = [];
    if (webhook_id) {
      const wh = await base44.asServiceRole.entities.WebhookConfig.filter({ id: webhook_id });
      webhooks = wh || [];
    } else {
      const all = await base44.asServiceRole.entities.WebhookConfig.filter({ is_active: true });
      webhooks = (all || []).filter(w => w.events?.includes(event_type));
    }

    if (webhooks.length === 0) {
      return Response.json({ delivered: 0, message: 'No matching webhooks found' });
    }

    const results = [];

    for (const wh of webhooks) {
      const body = JSON.stringify({
        event: event_type,
        timestamp: new Date().toISOString(),
        data: payload || {},
      });

      const headers = {
        'Content-Type': 'application/json',
        'X-ABOS-Event': event_type,
        'X-ABOS-Timestamp': Date.now().toString(),
      };

      // HMAC signature if secret provided
      if (wh.secret) {
        const key = await crypto.subtle.importKey(
          'raw',
          new TextEncoder().encode(wh.secret),
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign']
        );
        const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
        const hexSig = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
        headers['X-ABOS-Signature'] = `sha256=${hexSig}`;
      }

      let status = 0;
      try {
        const res = await fetch(wh.url, {
          method: 'POST',
          headers,
          body,
          signal: AbortSignal.timeout(8000),
        });
        status = res.status;
      } catch (err) {
        status = 0;
      }

      const success = status >= 200 && status < 300;

      // Update webhook metadata
      await base44.asServiceRole.entities.WebhookConfig.update(wh.id, {
        last_triggered_at: new Date().toISOString(),
        last_status: status,
        trigger_count: (wh.trigger_count || 0) + (success ? 1 : 0),
      });

      results.push({ webhook_id: wh.id, name: wh.name, status, success });
    }

    return Response.json({ delivered: results.filter(r => r.success).length, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});