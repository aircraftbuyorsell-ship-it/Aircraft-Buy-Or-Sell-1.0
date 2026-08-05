import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const profiles = await base44.entities.UserProfile.filter({ user_email: user.email }, '-created_date', 1);
    const profile = profiles[0];
    const hasAccess = Boolean(profile?.buyer_pro_active) || Boolean(profile?.trial_expires_at && new Date(profile.trial_expires_at) > new Date());
    if (!hasAccess) return Response.json({ error: 'Buyer trial expired', upgrade_url: '/buy?upgrade=1' }, { status: 402 });
    return Response.json({ ok: true, buyer_pro_active: Boolean(profile?.buyer_pro_active), trial_expires_at: profile?.trial_expires_at || null });
  } catch (error) { return Response.json({ error: error.message }, { status: 500 }); }
});