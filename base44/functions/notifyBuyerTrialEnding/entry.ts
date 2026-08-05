import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const now = Date.now();
    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ buyer_pro_active: false }, '-trial_expires_at', 500);
    let sent = 0;
    for (const profile of profiles) {
      const expiresAt = new Date(profile.trial_expires_at || '').getTime();
      const remaining = expiresAt - now;
      const sentAlready = profile.metadata?.buyer_trial_ending_notice_sent;
      if (!expiresAt || sentAlready || remaining <= 0 || remaining > 6 * 3600000) continue;
      await base44.asServiceRole.integrations.Core.SendEmail({ to: profile.user_email, from_name: 'ABOS', subject: 'Tvůj ABOS BUY trial končí za 6 hodin', body: 'Tvůj přístup k BUY intelligence zůstane otevřený pro čtení, ale nové akce se zamknou. Pokračuj bez limitů za $199/měsíc nebo $999/rok: ' + new URL(req.url).origin + '/buy' });
      await base44.asServiceRole.entities.UserProfile.update(profile.id, { metadata: { ...(profile.metadata || {}), buyer_trial_ending_notice_sent: true } });
      sent++;
    }
    return Response.json({ ok: true, sent });
  } catch (error) { return Response.json({ error: error.message }, { status: 500 }); }
});