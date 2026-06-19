import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { nNumber } = await req.json();
    
    if (!nNumber || typeof nNumber !== 'string') {
      return Response.json({ source: 'ntsb_accidents', data: null, fetched_at: new Date().toISOString(), status: 'error', error: 'nNumber is required' }, { status: 400 });
    }

    const cleanN = nNumber.toUpperCase().replace(/[^A-Z0-9]/g, '').trim();
    
    // NTSB Aviation Accident Database query
    // The NTSB CAROL query accepts N-number as a search parameter
    const url = `https://www.ntsb.gov/_layouts/ntsb.aviation/Results.aspx?query=nNumber:${encodeURIComponent(cleanN)}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'NAircraft/1.0 (aviation data platform)',
        'Accept': 'text/html'
      }
    });

    if (!response.ok) {
      return Response.json({
        source: 'ntsb_accidents',
        data: [],
        fetched_at: new Date().toISOString(),
        status: 'data_unavailable',
        error: `NTSB returned ${response.status}`
      });
    }

    const html = await response.text();
    const accidents = parseNTSBResults(html, cleanN);

    return Response.json({
      source: 'ntsb_accidents',
      data: {
        n_number: cleanN,
        total_records: accidents.length,
        accidents
      },
      fetched_at: new Date().toISOString(),
      status: 'success'
    });
  } catch (error) {
    return Response.json({
      source: 'ntsb_accidents',
      data: null,
      fetched_at: new Date().toISOString(),
      status: 'error',
      error: error.message
    }, { status: 500 });
  }
});

function parseNTSBResults(html, nNumber) {
  const accidents = [];
  
  // Extract table rows from NTSB results page
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
  let rowMatch;
  
  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const cells = [];
    let cellMatch;
    const rowHtml = rowMatch[1];
    
    while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
      cells.push(cellMatch[1].replace(/<[^>]+>/g, '').trim());
    }
    
    if (cells.length >= 5 && cells.some(c => c.toUpperCase().includes(nNumber))) {
      accidents.push({
        event_id: cells[0] || null,
        event_date: cells[1] || null,
        location: cells[2] || null,
        make_model: cells[3] || null,
        injury_severity: cells[4] || null,
        event_type: cells[5] || 'Accident',
        n_number: nNumber
      });
    }
  }
  
  return accidents;
}