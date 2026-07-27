import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const userEmail = user.email;
    const TRIAL_DAYS = 30;
    const BONUS_TOKENS = 100;

    // Check if trial already granted (idempotent)
    const existingTrials = await base44.asServiceRole.entities.TierChange.filter({
      user_email: userEmail,
      change_reason: 'promotion',
      new_tier: 'pro'
    });

    if (existingTrials && existingTrials.length > 0) {
      const trial = existingTrials[0];
      const affiliateLinks = await base44.asServiceRole.entities.AffiliateLink.filter({
        owner_email: userEmail,
        target_type: 'checkout'
      });
      return Response.json({
        ok: true,
        alreadyGranted: true,
        trialStartDate: trial.effective_date,
        trialEndDate: trial.effective_date
          ? new Date(new Date(trial.effective_date).getTime() + TRIAL_DAYS * 86400000).toISOString()
          : null,
        bonusTokens: BONUS_TOKENS,
        referralSlug: affiliateLinks[0]?.slug || null,
      });
    }

    // ── Grant new trial ──
    const now = new Date();
    const trialEnd = new Date(now.getTime() + TRIAL_DAYS * 86400000);

    // 1. Create/update UserProfile → tier=pro
    const existingProfiles = await base44.asServiceRole.entities.UserProfile.filter({ user_email: userEmail });
    if (existingProfiles && existingProfiles.length > 0) {
      await base44.asServiceRole.entities.UserProfile.update(existingProfiles[0].id, {
        tier: 'pro',
        sub_tier: 'plus',
      });
    } else {
      await base44.asServiceRole.entities.UserProfile.create({
        user_email: userEmail,
        role: user.role === 'admin' ? 'admin' : 'viewer',
        tier: 'pro',
        sub_tier: 'plus',
        status: 'active',
      });
    }

    // 2. TierChange record
    await base44.asServiceRole.entities.TierChange.create({
      user_email: userEmail,
      old_tier: 'free_explorer',
      new_tier: 'pro',
      old_sub_tier: 'none',
      new_sub_tier: 'plus',
      change_reason: 'promotion',
      status: 'confirmed',
      effective_date: now.toISOString(),
      billing_adjustment: 0,
      request_email: 'system',
      request_timestamp: now.toISOString(),
      confirmation_email: 'system',
      confirmation_timestamp: now.toISOString(),
      processing_notes: `30-day Pro trial — expires ${trialEnd.toISOString()}`,
      description: '30-day free Pro trial for new user. Personal investment gift referral enabled.',
    });

    // 3. Bonus tokens
    const existingTx = await base44.asServiceRole.entities.TokenTransaction.filter(
      { user_email: userEmail }, '-created_date', 1
    );
    const currentBalance = existingTx && existingTx[0] ? (existingTx[0].balance_after || 0) : 0;
    await base44.asServiceRole.entities.TokenTransaction.create({
      user_email: userEmail,
      type: 'bonus',
      amount: BONUS_TOKENS,
      feature: 'pro_trial_bonus',
      balance_after: currentBalance + BONUS_TOKENS,
      description: `30-day Pro trial welcome gift — ${BONUS_TOKENS} bonus tokens.`,
    });

    // 4. Referral gift link
    const slug = 'GIFT-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    await base44.asServiceRole.entities.AffiliateLink.create({
      slug,
      owner_email: userEmail,
      owner_role: 'marketplace',
      target_type: 'checkout',
      is_active: true,
      notes: 'Personal investment gift — 30-day Pro trial referral',
    });

    return Response.json({
      ok: true,
      alreadyGranted: false,
      trialStartDate: now.toISOString(),
      trialEndDate: trialEnd.toISOString(),
      bonusTokens: BONUS_TOKENS,
      referralSlug: slug,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});