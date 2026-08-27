import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // This function is invoked by the Base44 scheduled workflow.
    // Scheduled workflow executions do not carry a user session, so auth.me()
    // would incorrectly return 403 and prevent the GDPR retention job from running.
    // Keep the function server-side and use the service-role client for the cleanup.
    const cutoffMs = Date.now() - NINETY_DAYS_MS;
    const sr = base44.asServiceRole;

    let deletedCount = 0;
    let eventsClearedCount = 0;
    let scanned = 0;

    // Paginate through ALL UserBehavior records
    const PAGE_SIZE = 200;
    let skip = 0;

    while (true) {
      const batch = await sr.entities.UserBehavior.list('-created_date', PAGE_SIZE, skip);
      if (!batch || batch.length === 0) break;

      for (const rec of batch) {
        scanned++;

        const lastActiveMs = rec.last_active ? new Date(rec.last_active).getTime() : null;
        const createdMs = rec.created_date ? new Date(rec.created_date).getTime() : null;

        const hasLastActive = lastActiveMs !== null && !Number.isNaN(lastActiveMs);

        if (hasLastActive) {
          // Case A: last_active older than 90 days
          if (lastActiveMs < cutoffMs) {
            const isFullyInactiveFreeUser =
              rec.tier === 'free_explorer' &&
              (rec.tokens_remaining ?? 0) <= 0 &&
              rec.verification_paid === false;

            if (isFullyInactiveFreeUser) {
              await sr.entities.UserBehavior.delete(rec.id);
              deletedCount++;
            } else {
              await sr.entities.UserBehavior.update(rec.id, {
                events: [],
                engagement_score: 0,
                session_count: 0,
              });
              eventsClearedCount++;
            }
          }
        } else {
          // Case B: no last_active but record itself is older than 90 days
          if (createdMs !== null && !Number.isNaN(createdMs) && createdMs < cutoffMs) {
            await sr.entities.UserBehavior.update(rec.id, { events: [] });
            eventsClearedCount++;
          }
        }
      }

      if (batch.length < PAGE_SIZE) break;
      skip += PAGE_SIZE;
    }

    const summary = {
      ok: true,
      scanned,
      deleted: deletedCount,
      events_cleared: eventsClearedCount,
      cutoff: new Date(cutoffMs).toISOString(),
      ran_at: new Date().toISOString(),
    };

    console.log(
      `[userBehaviorCleanup] Scanned ${scanned} records — deleted ${deletedCount}, events-cleared ${eventsClearedCount} (cutoff ${summary.cutoff})`
    );

    return Response.json(summary);
  } catch (error) {
    console.error('[userBehaviorCleanup] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});