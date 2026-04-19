// Called by the authenticated invitee once they complete paid verification.
// Uses the `referred_by_email` stored on the invitee's user record (set at signup
// by the UI via base44.auth.updateMe) and awards the inviter one-time per invitee.
//
// Payload: { } — no body needed; caller is the invitee.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const inviterEmail = user.referred_by_email;
    if (!inviterEmail) {
      return Response.json({ skipped: true, reason: "no referrer on account" });
    }
    if (inviterEmail.toLowerCase() === user.email.toLowerCase()) {
      return Response.json({ skipped: true, reason: "self-referral not allowed" });
    }

    // Confirm the invitee has actually paid for verification
    const behaviorList = await base44.asServiceRole.entities.UserBehavior.filter(
      { user_email: user.email }, "-created_date", 1
    );
    const behavior = behaviorList[0];
    if (!behavior?.verification_paid) {
      return Response.json({ skipped: true, reason: "invitee not verified" });
    }

    const res = await base44.asServiceRole.functions.invoke("awardMilestone", {
      user_email: inviterEmail,
      milestone_type: "referral_verified",
      reference_id: user.email,
      reference_type: "user",
      note: `${user.full_name || user.email} completed paid verification`,
    });

    return Response.json({ success: true, inviter: inviterEmail, result: res?.data || res });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});