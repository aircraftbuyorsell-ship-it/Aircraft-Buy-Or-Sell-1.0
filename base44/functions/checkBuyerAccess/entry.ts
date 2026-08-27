import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { userId } = await req.json().catch(() => ({}));
    if (userId && userId !== user.id && user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_email: user.email }, '-created_date', 1);
    const profile = profiles[0];
    if (!profile || !['buyer', 'both'].includes(profile.pipeline_role)) {
      return Response.json({ error: 'Buyer role required' }, { status: 403 });
    }

    let activeProfile = profile;
    if (!profile.trial_started_at && !profile.buyer_pro_active) {
      const now = new Date();
      activeProfile = await base44.asServiceRole.entities.UserProfile.update(profile.id, {
        trial_started_at: now.toISOString(),
        trial_expires_at: new Date(now.getTime() + 3 * 86400000).toISOString(),
      });
    }

    const trialActive = !!activeProfile.trial_expires_at && new Date(activeProfile.trial_expires_at).getTime() > Date.now();
    if (trialActive || activeProfile.buyer_pro_active) {
      return Response.json({ allowed: true, access: activeProfile.buyer_pro_active ? 'pro' : 'trial', trial_expires_at: activeProfile.trial_expires_at });
    }
    return Response.json({ error: 'Buyer Pro subscription required', upgrade_url: '/pricing?plan=buyer_monthly' }, { status: 402 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});