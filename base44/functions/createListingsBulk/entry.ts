// Bulk-create AircraftListing records on behalf of admins/dealers.
// Uses service role to bypass RLS (we enforce role check manually).
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Allow admins and dealers
    if (!['admin', 'dealer'].includes(user.role)) {
      return Response.json({ error: 'Forbidden: admin or dealer role required' }, { status: 403 });
    }

    const { listings } = await req.json().catch(() => ({}));
    if (!Array.isArray(listings) || !listings.length) {
      return Response.json({ error: 'Missing listings array' }, { status: 400 });
    }

    const created = [];
    for (const raw of listings) {
      const payload = { ...raw };
      // Strip empty values
      Object.keys(payload).forEach(k => {
        if (payload[k] === "" || payload[k] == null) delete payload[k];
      });
      if (!payload.make || !payload.model) continue;
      // Ensure owner is set to current user
      payload.owner = payload.owner || user.id;
      const record = await base44.asServiceRole.entities.AircraftListing.create(payload);
      created.push(record);
    }

    return Response.json({ created_count: created.length, created });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});