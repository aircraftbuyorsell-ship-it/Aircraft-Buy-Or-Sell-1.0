import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Recalculates average_review_rating + review_count for an ATICard
 * based on approved ATICardReview entries. Triggered by automation
 * on ATICardReview create/update/delete.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const review = body?.data || body?.old_data;
    const cardId = review?.ati_card;
    if (!cardId) return Response.json({ ok: false, reason: "no-card" });

    const approved = await base44.asServiceRole.entities.ATICardReview.filter({
      ati_card: cardId,
      status: "approved",
    }, "-created_date", 500);

    const count = approved.length;
    const avg = count
      ? Math.round((approved.reduce((s, r) => s + (r.rating || 0), 0) / count) * 10) / 10
      : 0;

    await base44.asServiceRole.entities.ATICard.update(cardId, {
      average_review_rating: avg,
      review_count: count,
    });

    return Response.json({ ok: true, cardId, avg, count });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});