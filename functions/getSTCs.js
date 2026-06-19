import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { nNumber } = await req.json();
    
    if (!nNumber || typeof nNumber !== 'string') {
      return Response.json({ source: 'faa_stc', data: null, fetched_at: new Date().toISOString(), status: 'error', error: 'nNumber is required' }, { status: 400 });
    }

    const cleanN = nNumber.toUpperCase().replace(/[^A-Z0-9]/g, '').trim();

    // Get make/model from registration
    let make = null;
    let model = null;
    
    try {
      const regResult = await base44.functions.invoke('getFAARegistration', { nNumber: cleanN });
      if (regResult?.data?.manufacturer) make = regResult.data.manufacturer;
      if (regResult?.data?.model) model = regResult.data.model;
    } catch (_) {
      // Continue without make/model
    }

    // FAA Supplemental Type Certificates (STC) database
    // Available at: https://drs.faa.gov/browse/STC/doctypeDetails
    const stcData = [];
    
    if (make && model) {
      try {
        const searchUrl = `https://drs.faa.gov/browse/search?q=${encodeURIComponent(make + ' ' + model)}&documentType=STC`;
        const response = await fetch(searchUrl, {
          headers: {
            'User-Agent': 'NAircraft/1.0 (aviation data platform)',
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          const json = await response.json();
          if (json.results) {
            for (const result of json.results.slice(0, 15)) {
              stcData.push({
                stc_number: result.stcNumber || result.id || null,
                title: result.title || null,
                holder: result.holder || null,
                issue_date: result.issueDate || null,
                description: result.description || result.summary || null,
                applies_to: `${make} ${model}`
              });
            }
          }
        }
      } catch (_) {
        // STC lookup failed gracefully
      }
    }

    return Response.json({
      source: 'faa_stc',
      data: {
        n_number: cleanN,
        make,
        model,
        total_stcs: stcData.length,
        stcs: stcData
      },
      fetched_at: new Date().toISOString(),
      status: stcData.length > 0 ? 'success' : 'data_unavailable'
    });
  } catch (error) {
    return Response.json({
      source: 'faa_stc',
      data: null,
      fetched_at: new Date().toISOString(),
      status: 'error',
      error: error.message
    }, { status: 500 });
  }
});