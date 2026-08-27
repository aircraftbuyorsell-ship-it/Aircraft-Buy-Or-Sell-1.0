import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const MAX_TRIAL_USERS = 50;
const GIFT_OPTIONS = [
  { id: 'bonus_tokens', title: '200 Bonus Tokens', description: 'Double tokens for ATI reports, Deal Radar & more.' },
  { id: 'extended_trial', title: '45-Day Extended Pro', description: '15 extra days of full Pro access — 45 days total.' },
  { id: 'discount_voucher', title: '€25 Voucher', description: 'Save €25 on any token pack after your trial.' },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const userEmail = user.email;
    let body = {};
    try {
      const rawBody = await req.json();
      if (rawBody && typeof rawBody === 'object') {
        body = rawBody;
      }
    } catch (err) {
      console.error('JSON parse error (will use empty body):', err.message);
      // Empty body is ok, will just use default values
    }

    const { checkOnly, giftChoice } = body;

    // ── Check if trial already exists for this user ──
    const existingTrials = await base44.asServiceRole.entities.TierChange.filter({
      user_email: userEmail,
      change_reason: 'promotion',
      new_tier: 'pro'
    });

    if (existingTrials && existingTrials.length > 0) {
      const trial = existingTrials[0];
      const startDate = new Date(trial.effective_date);
      const isExtended = trial.description?.includes('extended_trial') || trial.processing_notes?.includes('45-day');
      const days = isExtended ? 45 : 30;
      const endDate = new Date(startDate.getTime() + days * 86400000);

      const affiliateLinks = await base44.asServiceRole.entities.AffiliateLink.filter({
        owner_email: userEmail, target_type: 'checkout'
      });

      // Fetch voucher from UserProfile metadata
      let voucherCode = null;
      const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_email: userEmail });
      if (profiles?.[0]?.metadata?.pro_trial_voucher) {
        voucherCode = profiles[0].metadata.pro_trial_voucher;
      }

      const gift = trial.description?.includes('bonus_tokens') ? 'bonus_tokens'
        : trial.description?.includes('extended_trial') ? 'extended_trial'
        : trial.description?.includes('discount_voucher') ? 'discount_voucher'
        : 'bonus_tokens';

      return Response.json({
        ok: true,
        alreadyGranted: true,
        trialStartDate: trial.effective_date,
        trialEndDate: endDate.toISOString(),
        bonusTokens: gift === 'bonus_tokens' ? 200 : 100,
        referralSlug: affiliateLinks[0]?.slug || null,
        giftChoice: gift,
        voucherCode,
      });
    }

    // ── Count total trials (for 50-user limit) ──
    const allTrials = await base44.asServiceRole.entities.TierChange.filter(
      { change_reason: 'promotion', new_tier: 'pro' },
      '-created_date',
      MAX_TRIAL_USERS + 1
    );
    const slotsLeft = Math.max(0, MAX_TRIAL_USERS - (allTrials?.length || 0));

    // ── If checkOnly, return status without granting ──
    if (checkOnly) {
      return Response.json({
        ok: true,
        alreadyGranted: false,
        slotsLeft,
        maxUsers: MAX_TRIAL_USERS,
        giftOptions: GIFT_OPTIONS,
      });
    }

    // ── Grant new trial ──
    if (slotsLeft === 0) {
      return Response.json({
        ok: false,
        limitReached: true,
        message: 'All 50 trial slots have been claimed.',
      });
    }

    // Default to bonus_tokens if no choice or invalid choice provided
    const validGift = GIFT_OPTIONS.find(g => g.id === giftChoice);
    const chosenGift = validGift ? giftChoice : 'bonus_tokens';
    const TRIAL_DAYS = chosenGift === 'extended_trial' ? 45 : 30;
    const BONUS_TOKENS = chosenGift === 'bonus_tokens' ? 200 : 100;
    const now = new Date();
    const trialEnd = new Date(now.getTime() + TRIAL_DAYS * 86400000);

    // 1. Create/update UserProfile → tier=pro
    const metadata = {};
    if (chosenGift === 'discount_voucher') {
      metadata.pro_trial_voucher = 'ABOS25-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      metadata.voucher_amount = 25;
    }
    const existingProfiles = await base44.asServiceRole.entities.UserProfile.filter({ user_email: userEmail }).catch(err => {
      console.error('UserProfile filter error:', err);
      return null;
    });

    if (existingProfiles && existingProfiles.length > 0) {
      await base44.asServiceRole.entities.UserProfile.update(existingProfiles[0].id, {
        tier: 'pro',
        sub_tier: 'plus',
        metadata: { ...(existingProfiles[0].metadata || {}), ...metadata },
      }).catch(err => {
        console.error('UserProfile update error:', err.message);
        throw new Error(`Failed to update UserProfile: ${err.message}`);
      });
    } else {
      await base44.asServiceRole.entities.UserProfile.create({
        user_email: userEmail,
        role: user.role === 'admin' ? 'admin' : 'viewer',
        tier: 'pro',
        sub_tier: 'plus',
        status: 'active',
        metadata,
      }).catch(err => {
        console.error('UserProfile create error:', err.message);
        throw new Error(`Failed to create UserProfile: ${err.message}`);
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
      processing_notes: `${TRIAL_DAYS}-day Pro trial — expires ${trialEnd.toISOString()}`,
      description: `${TRIAL_DAYS}-day free Pro trial. Gift: ${chosenGift}. Personal investment gift referral enabled.`,
    }).catch(err => {
      console.error('TierChange create error:', err.message);
      throw new Error(`Failed to create TierChange: ${err.message}`);
    });

    // 3. Bonus tokens
    const existingTx = await base44.asServiceRole.entities.TokenTransaction.filter(
      { user_email: userEmail }, '-created_date', 1
    ).catch(err => {
      console.error('TokenTransaction filter error:', err);
      return null;
    });

    const currentBalance = existingTx?.[0]?.balance_after || 0;
    await base44.asServiceRole.entities.TokenTransaction.create({
      user_email: userEmail,
      type: 'bonus',
      amount: BONUS_TOKENS,
      feature: 'pro_trial_bonus',
      balance_after: currentBalance + BONUS_TOKENS,
      description: `Pro trial welcome gift — ${BONUS_TOKENS} bonus tokens. Choice: ${chosenGift}.`,
    }).catch(err => {
      console.error('TokenTransaction create error:', err.message);
      throw new Error(`Failed to create TokenTransaction: ${err.message}`);
    });

    // 4. Referral gift link
    const slug = 'GIFT-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    await base44.asServiceRole.entities.AffiliateLink.create({
      slug,
      owner_email: userEmail,
      owner_role: 'marketplace',
      target_type: 'checkout',
      is_active: true,
      notes: 'Personal investment gift referral',
    }).catch(err => {
      console.error('AffiliateLink create error:', err.message);
      throw new Error(`Failed to create AffiliateLink: ${err.message}`);
    });

    return Response.json({
      ok: true,
      alreadyGranted: false,
      trialStartDate: now.toISOString(),
      trialEndDate: trialEnd.toISOString(),
      bonusTokens: BONUS_TOKENS,
      referralSlug: slug,
      giftChoice: chosenGift,
      voucherCode: metadata.pro_trial_voucher || null,
      slotsLeft: slotsLeft - 1,
    });
  } catch (error) {
    console.error('grantProTrial failed:', error?.message || error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
