import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { nNumber } = await req.json();
    
    if (!nNumber || typeof nNumber !== 'string') {
      return Response.json({ source: 'faa_ad', data: null, fetched_at: new Date().toISOString(), status: 'error', error: 'nNumber is required' }, { status: 400 });
    }

    const cleanN = nNumber.toUpperCase().replace(/[^A-Z0-9]/g, '').trim();

    // First get registration to determine make/model
    let make = null;
    let model = null;
    
    try {
      const regResult = await base44.functions.invoke('getFAARegistration', { nNumber: cleanN });
      if (regResult?.data?.manufacturer) make = regResult.data.manufacturer;
      if (regResult?.data?.model) model = regResult.data.model;
    } catch (_) {
      // Continue without make/model
    }

    // FAA Airworthiness Directives lookup by make/model
    // The FAA AD database can be queried at:
    // https://drs.faa.gov/browse/ADFRAWD/doctypeDetails
    const adData = [];
    
    if (make && model) {
      try {
        const searchUrl = `https://drs.faa.gov/browse/search?q=${encodeURIComponent(make + ' ' + model)}&documentType=AD`;
        const response = await fetch(searchUrl, {
          headers: {
            'User-Agent': 'NAircraft/1.0 (aviation data platform)',
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          const json = await response.json();
          if (json.results) {
            for (const result of json.results.slice(0, 20)) {
              adData.push({
                ad_number: result.adNumber || result.id || null,
                title: result.title || null,
                effective_date: result.effectiveDate || null,
                description: result.description || result.summary || null,
                status: result.status || 'Active',
                applies_to: `${make} ${model}`
              });
            }
          }
        }
      } catch (_) {
        // AD lookup failed gracefully
      }
    }

    return Response.json({
      source: 'faa_ad',
      data: {
        n_number: cleanN,
        make,
        model,
        total_applicable: adData.length,
        directives: adData
      },
      fetched_at: new Date().toISOString(),
      status: adData.length > 0 ? 'success' : 'data_unavailable'
    });
  } catch (error) {
    return Response.json({
      source: 'faa_ad',
      data: null,
      fetched_at: new Date().toISOString(),
      status: 'error',
      error: error.message
    }, { status: 500 });
  }
});