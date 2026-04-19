// Entity automation handler: when an AircraftListing's ati_score is updated,
// auto-award milestones if the score crossed 90 or 95 for the first time.
//
// Runs on every AircraftListing update. Awards only once per (listing, milestone)
// thanks to awardMilestone's dedupe on reference_id.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const data = payload.data;
    const oldData = payload.old_data;
    const changedFields = payload.changed_fields || [];

    if (!data || !changedFields.includes("ati_score")) {
      return Response.json({ skipped: true, reason: "ati_score not changed" });
    }

    const newScore = data.ati_score || 0;
    const prevScore = oldData?.ati_score || 0;
    const listingId = payload.event?.entity_id;

    // Identify the owner — listings carry `owner` (user id) OR `created_by` (email)
    let ownerEmail = data.created_by;
    if (!ownerEmail && data.owner) {
      try {
        const user = await base44.asServiceRole.entities.User.get(data.owner);
        ownerEmail = user?.email;
      } catch { /* ignore */ }
    }
    if (!ownerEmail) {
      return Response.json({ skipped: true, reason: "no owner email" });
    }

    const awards = [];
    const tryAward = async (milestone_type) => {
      const res = await base44.asServiceRole.functions.invoke("awardMilestone", {
        user_email: ownerEmail,
        milestone_type,
        reference_id: listingId,
        reference_type: "listing",
        note: `ATI score reached ${newScore} on listing ${data.registration || listingId}`,
      });
      awards.push({ milestone_type, result: res?.data || res });
    };

    if (newScore >= 95 && prevScore < 95) await tryAward("ati_score_95");
    if (newScore >= 90 && prevScore < 90) await tryAward("ati_score_90");

    return Response.json({ success: true, awards });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});