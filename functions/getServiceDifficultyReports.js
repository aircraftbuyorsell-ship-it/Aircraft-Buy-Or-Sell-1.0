import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { nNumber } = await req.json();
    
    if (!nNumber || typeof nNumber !== 'string') {
      return Response.json({ source: 'faa_sdr', data: null, fetched_at: new Date().toISOString(), status: 'error', error: 'nNumber is required' }, { status: 400 });
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

    // FAA Service Difficulty Reports (SDR) data
    // The SDR database is available at: https://sdrs.faa.gov/
    const sdrData = [];
    
    if (make) {
      try {
        const searchUrl = `https://sdrs.faa.gov/Home/Search?manufacturer=${encodeURIComponent(make)}&model=${encodeURIComponent(model || '')}`;
        const response = await fetch(searchUrl, {
          headers: {
            'User-Agent': 'NAircraft/1.0 (aviation data platform)',
            'Accept': 'text/html'
          }
        });

        if (response.ok) {
          const html = await response.text();
          // Parse SDR table data from HTML
          const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
          const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
          let rowMatch;
          let rowCount = 0;

          while ((rowMatch = rowRegex.exec(html)) !== null && rowCount < 30) {
            const cells = [];
            let cellMatch;
            const rowHtml = rowMatch[1];
            
            while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
              cells.push(cellMatch[1].replace(/<[^>]+>/g, '').trim());
            }
            
            if (cells.length >= 4 && (cells.some(c => c.includes(make)) || rowCount < 5)) {
              sdrData.push({
                report_number: cells[0] || null,
                date: cells[1] || null,
                aircraft: cells[2] || null,
                description: cells[3] || null,
                part_name: cells[4] || null
              });
              rowCount++;
            }
          }
        }
      } catch (_) {
        // SDR lookup failed gracefully
      }
    }

    return Response.json({
      source: 'faa_sdr',
      data: {
        n_number: cleanN,
        make,
        model,
        total_reports: sdrData.length,
        reports: sdrData
      },
      fetched_at: new Date().toISOString(),
      status: sdrData.length > 0 ? 'success' : 'data_unavailable'
    });
  } catch (error) {
    return Response.json({
      source: 'faa_sdr',
      data: null,
      fetched_at: new Date().toISOString(),
      status: 'error',
      error: error.message
    }, { status: 500 });
  }
});