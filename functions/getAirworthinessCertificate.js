import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { nNumber } = await req.json();
    
    if (!nNumber || typeof nNumber !== 'string') {
      return Response.json({ source: 'faa_certificate', data: null, fetched_at: new Date().toISOString(), status: 'error', error: 'nNumber is required' }, { status: 400 });
    }

    const cleanN = nNumber.toUpperCase().replace(/[^A-Z0-9]/g, '').trim();

    // Fetch FAA Registry page for certificate details
    const url = `https://registry.faa.gov/AircraftInquiry/Search/NNumberResult?nNumberTxt=${cleanN}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'NAircraft/1.0 (aviation data platform)',
        'Accept': 'text/html'
      }
    });

    if (!response.ok) {
      return Response.json({
        source: 'faa_certificate',
        data: null,
        fetched_at: new Date().toISOString(),
        status: 'error',
        error: `FAA Registry returned ${response.status}`
      });
    }

    const html = await response.text();
    
    // Parse certificate-specific fields
    const data = {
      n_number: cleanN,
      airworthiness_classification: extractField(html, /Classification[^<]*<[^>]*>([^<]+)</i),
      category: extractField(html, /Category[^<]*<[^>]*>([^<]+)</i),
      airworthiness_date: extractField(html, /Airworthiness\s*Date[^<]*<[^>]*>([^<]+)</i),
      certificate_issue_date: extractField(html, /Certificate\s*Issue\s*Date[^<]*<[^>]*>([^<]+)</i),
      expiration_date: extractField(html, /Expiration\s*Date[^<]*<[^>]*>([^<]+)</i),
      type_certificate: extractField(html, /Type\s*Certificate[^<]*<[^>]*>([^<]+)</i),
      approved_operations: extractField(html, /Approved\s*Operations[^<]*<[^>]*>([^<]+)</i),
      status: extractField(html, /Status[^<]*<[^>]*>([^<]+)</i),
      mode_s_code: extractField(html, /Mode\s*S\s*Code[^<]*<[^>]*>([^<]+)</i)
    };

    return Response.json({
      source: 'faa_certificate',
      data,
      fetched_at: new Date().toISOString(),
      status: 'success'
    });
  } catch (error) {
    return Response.json({
      source: 'faa_certificate',
      data: null,
      fetched_at: new Date().toISOString(),
      status: 'error',
      error: error.message
    }, { status: 500 });
  }
});

function extractField(html, regex) {
  const match = html.match(regex);
  return match ? match[1].trim() : null;
}