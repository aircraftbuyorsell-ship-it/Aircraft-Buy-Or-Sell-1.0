import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// action: "delete" | "mark_review" (sets status to "draft")
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const { ids, action } = await req.json();
    if (!ids || !ids.length) return Response.json({ error: 'No IDs provided' }, { status: 400 });
    if (!['delete', 'mark_review'].includes(action)) return Response.json({ error: 'Invalid action' }, { status: 400 });

    let success = 0, failed = 0;
    for (const id of ids) {
      try {
        if (action === 'delete') {
          await base44.asServiceRole.entities.AircraftListing.delete(id);
        } else {
          await base44.asServiceRole.entities.AircraftListing.update(id, { status: 'draft' });
        }
        success++;
      } catch {
        failed++;
      }
    }

    return Response.json({ ok: true, success, failed, action });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});