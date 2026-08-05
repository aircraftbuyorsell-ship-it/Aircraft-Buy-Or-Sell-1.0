import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { aircraft, budget, timeline } = await req.json();
    if (!aircraft || !budget || !timeline) return Response.json({ error: 'Complete all 3 buyer questions' }, { status: 400 });
    const profiles = await base44.entities.UserProfile.filter({ user_email: user.email }, '-created_date', 1);
    const now = new Date();
    const trialExpires = new Date(now.getTime() + 3 * 86400000).toISOString();
    const existing = profiles[0];
    const nextRole = existing?.pipeline_role === 'seller' || existing?.pipeline_role === 'both' ? 'both' : 'buyer';
    const payload = { pipeline_role: nextRole, trial_started_at: existing?.trial_started_at || now.toISOString(), trial_expires_at: existing?.trial_expires_at || trialExpires, buyer_pro_active: existing?.buyer_pro_active || false, buyer_plan: existing?.buyer_plan || 'none', metadata: { ...(existing?.metadata || {}), buyer_brief: { aircraft, budget: Number(budget), timeline } } };
    const profile = existing ? await base44.entities.UserProfile.update(existing.id, payload) : await base44.entities.UserProfile.create({ user_email: user.email, role: 'buyer', tier: 'free_explorer', status: 'active', ...payload });
    return Response.json({ ok: true, profile, trialExpiresAt: payload.trial_expires_at });
  } catch (error) { return Response.json({ error: error.message }, { status: 500 }); }
});