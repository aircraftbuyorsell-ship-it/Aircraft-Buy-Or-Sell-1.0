import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { models = ['172', '150', '152'], limit = 500 } = body;

    // Fetch listings matching test data patterns
    const allListings = await base44.asServiceRole.entities.AircraftListing.filter(
      {},
      '-created_date',
      limit
    );

    // Flag test listings
    const testFlags = allListings.filter(l => {
      const model = (l.model || '').toUpperCase();
      const matchesModel = models.some(m => model.includes(m));
      
      const noRegistration = !l.registration;
      const roundPrice = l.asking_price && (l.asking_price % 50000 === 0 || l.asking_price % 25000 === 0);
      const noSourceUrl = !l.source_url;
      const missingCritical = !l.total_time || !l.engine_hours;
      
      return matchesModel && (roundPrice || noRegistration || noSourceUrl || missingCritical);
    });

    // Group by red flag type
    const grouped = testFlags.reduce((acc, l) => {
      const flags = [];
      if (!l.registration) flags.push('no_n_number');
      if (l.asking_price && (l.asking_price % 50000 === 0 || l.asking_price % 25000 === 0)) flags.push('round_price');
      if (!l.source_url) flags.push('no_source_url');
      if (!l.total_time || !l.engine_hours) flags.push('missing_critical');
      
      const key = flags.join('|');
      if (!acc[key]) acc[key] = [];
      acc[key].push(l);
      return acc;
    }, {});

    return Response.json({
      total_scanned: allListings.length,
      test_candidates: testFlags.length,
      by_flag_pattern: Object.fromEntries(
        Object.entries(grouped).map(([flags, listings]) => [
          flags,
          { count: listings.length, samples: listings.slice(0, 3).map(l => ({ id: l.id, reg: l.registration, model: l.model, price: l.asking_price })) }
        ])
      ),
      sample_ids: testFlags.slice(0, 10).map(l => l.id)
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});