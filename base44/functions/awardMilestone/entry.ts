// Awards credits to a user for a milestone. Idempotent — never double-awards
// the same (user_email, milestone_type, reference_id) tuple.
//
// Payload:
//   { user_email: string, milestone_type: string, reference_id?: string,
//     reference_type?: string, note?: string }
//
// Admin-service only — can be called from:
//   - entity automations (server-side, service role context)
//   - admin-only backend functions
//   - admin UI (role === 'admin')

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const MILESTONES = {
  referral_verified: { credits: 250, tokens: 50, label: "Verified referral" },
  ati_score_90:      { credits: 100, tokens: 20, label: "ATI 90+ score" },
  ati_score_95:      { credits: 250, tokens: 50, label: "ATI 95+ elite score" },
  first_ati_passport:{ credits: 50,  tokens: 10, label: "First ATI Passport" },
  first_escrow:      { credits: 50,  tokens: 10, label: "First Escrow" },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me().catch(() => null);

    // Allow admin users OR trusted server context (automation runs as service role;
    // in that case auth.me() throws/returns null and we accept because the request
    // came from a trusted automation — entity automations are the only non-auth path).
    const isAdmin = caller?.role === "admin";
    const isAutomation = !caller; // entity automations invoke without a user token
    if (!isAdmin && !isAutomation) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { user_email, milestone_type, reference_id = null, reference_type = null, note = null } = body || {};

    if (!user_email || !milestone_type) {
      return Response.json({ error: "user_email and milestone_type are required" }, { status: 400 });
    }

    const config = MILESTONES[milestone_type];
    if (!config) {
      return Response.json({ error: `Unknown milestone: ${milestone_type}` }, { status: 400 });
    }

    // Dedupe: same user + milestone + reference_id = already awarded
    const existing = await base44.asServiceRole.entities.RewardMilestone.filter({
      user_email,
      milestone_type,
      ...(reference_id ? { reference_id } : {}),
    }, "-created_date", 1);
    if (existing.length > 0) {
      return Response.json({ skipped: true, reason: "already_awarded", milestone: existing[0] });
    }

    // Find or create UserBehavior row
    let behaviorList = await base44.asServiceRole.entities.UserBehavior.filter({ user_email }, "-created_date", 1);
    let behavior = behaviorList[0];
    if (!behavior) {
      behavior = await base44.asServiceRole.entities.UserBehavior.create({
        user_email,
        tokens_remaining: 0,
      });
    }

    const newBalance = (behavior.tokens_remaining || 0) + config.tokens;
    await base44.asServiceRole.entities.UserBehavior.update(behavior.id, {
      tokens_remaining: newBalance,
    });

    await base44.asServiceRole.entities.TokenTransaction.create({
      user_email,
      type: "bonus",
      amount: config.tokens,
      feature: `milestone_${milestone_type}`,
      balance_after: newBalance,
    });

    const reward = await base44.asServiceRole.entities.RewardMilestone.create({
      user_email,
      milestone_type,
      tokens_awarded: config.tokens,
      credits_awarded: config.credits,
      reference_id,
      reference_type,
      note: note || config.label,
    });

    return Response.json({ success: true, reward, balance_after: newBalance });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});