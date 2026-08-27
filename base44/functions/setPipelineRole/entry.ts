import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const BUYER_ROLES = ['buyer', 'both'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { pipeline_role } = await req.json();
    if (!['buyer', 'seller', 'both'].includes(pipeline_role)) {
      return Response.json({ error: 'pipeline_role must be buyer, seller, or both' }, { status: 400 });
    }

    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_email: user.email }, '-created_date', 1);
    const profile = profiles[0];
    const update = { pipeline_role };
    if (BUYER_ROLES.includes(pipeline_role) && !profile?.trial_started_at && !profile?.buyer_pro_active) {
      const now = new Date();
      update.trial_started_at = now.toISOString();
      update.trial_expires_at = new Date(now.getTime() + 3 * 86400000).toISOString();
    }

    const saved = profile
      ? await base44.asServiceRole.entities.UserProfile.update(profile.id, update)
      : await base44.asServiceRole.entities.UserProfile.create({
          user_email: user.email,
          role: 'viewer',
          tier: 'free_explorer',
          status: 'active',
          buyer_plan: 'none',
          seller_free_listing_used: false,
          total_listings_count: 0,
          ...update,
        });
    return Response.json({ pipeline_role: saved.pipeline_role, trial_started_at: saved.trial_started_at, trial_expires_at: saved.trial_expires_at });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});