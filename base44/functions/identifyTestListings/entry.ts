import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';


Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const { models = ['172', '150', '152'], limit = 500 } = body;

    const allListings = await base44.asServiceRole.entities.AircraftListing.filter(
      {},
      '-created_date',
      limit
    );

    const testListings = allListings.filter(l => {
      const model = (l.model || '').toUpperCase();
      const matchesModel = models.some(m => model.includes(m));
      const noRegistration = !l.registration;
      const roundPrice = l.asking_price && (l.asking_price % 50000 === 0 || l.asking_price % 25000 === 0);
      const noSourceUrl = !l.source_url;
      const missingCritical = !l.total_time || !l.engine_hours;
      return matchesModel && (roundPrice || noRegistration || noSourceUrl || missingCritical);
    });

    const realListings = allListings.filter(l => !testListings.find(t => t.id === l.id));

    const withFlags = testListings.map(l => {
      const flags = [];
      if (!l.registration) flags.push('no_n_number');
      if (l.asking_price && (l.asking_price % 50000 === 0 || l.asking_price % 25000 === 0)) flags.push('round_price');
      if (!l.source_url) flags.push('no_source_url');
      if (!l.total_time || !l.engine_hours) flags.push('missing_critical');
      return { ...l, _flags: flags };
    });

    // Flag breakdown counts
    const flagCounts = {
      no_n_number: withFlags.filter(l => l._flags.includes('no_n_number')).length,
      round_price: withFlags.filter(l => l._flags.includes('round_price')).length,
      no_source_url: withFlags.filter(l => l._flags.includes('no_source_url')).length,
      missing_critical: withFlags.filter(l => l._flags.includes('missing_critical')).length,
    };

    // Model breakdown
    const modelCounts = {};
    for (const l of withFlags) {
      const m = l.model || 'unknown';
      modelCounts[m] = (modelCounts[m] || 0) + 1;
    }

    return Response.json({
      total_scanned: allListings.length,
      real_count: realListings.length,
      test_count: testListings.length,
      flag_counts: flagCounts,
      model_counts: modelCounts,
      test_listings: withFlags,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});