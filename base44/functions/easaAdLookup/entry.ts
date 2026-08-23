import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// EASA Airworthiness Directives lookup for Digital Twin.
// Resolves manufacturer/model from FAA registry + marketplace listing,
// then uses LLM with web search to find applicable EASA ADs/PADs/SIBs.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { registration, manufacturer, model } = await req.json().catch(() => ({}));
    if (!registration && !manufacturer) {
      return Response.json({ error: 'registration or manufacturer required' }, { status: 400 });
    }

    const svc = base44.asServiceRole.entities;
    let make = (manufacturer || '').trim();
    let mdl = (model || '').trim();

    // Try to resolve make/model from our data sources
    if (!make && registration) {
      const reg = registration.toUpperCase().trim();
      const nLookup = reg.replace(/^N/, '');
      const [faaRecs, listings] = await Promise.allSettled([
        svc.FAAAircraft.filter({ n_number: nLookup }, '-created_date', 1),
        svc.AircraftListing.filter({ registration: reg }, '-created_date', 1),
      ]);
      const faa = faaRecs.status === 'fulfilled' ? faaRecs.value[0] : null;
      const listing = listings.status === 'fulfilled' ? listings.value[0] : null;
      if (listing?.make) make = listing.make;
      if (listing?.model) mdl = listing.model;
      // If still no make, use FAA mfr_mdl_code as fallback context
      if (!make && faa?.mfr_mdl_code) {
        make = `FAA code ${faa.mfr_mdl_code}`;
      }
    }

    const aircraftLabel = [make, mdl].filter(Boolean).join(' ') || registration || 'unknown aircraft';

    // Use InvokeLLM with web search (gemini_3_flash) to find EASA ADs
    const llmResponse = await base44.integrations.Core.InvokeLLM({
      prompt: `Search the EASA Safety Publications Tool (ad.easa.europa.eu) for all current Airworthiness Directives and safety publications applicable to the following aircraft:

Aircraft: ${aircraftLabel}
Registration: ${registration || 'N/A'}

Search the EASA AD database at https://ad.easa.europa.eu/ for publications matching this aircraft type (by manufacturer and model). Include:
- Airworthiness Directives (AD)
- Proposed ADs (PAD)
- Safety Information Bulletins (SIB)

For each publication found, provide the AD number, title/subject, issue date, effective date, publication type, and the direct URL on ad.easa.europa.eu.

Only include publications that are genuinely applicable to this aircraft type. If none are found, return an empty list.`,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          publications: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                number: { type: 'string', description: 'AD number e.g. 2026-0139' },
                title: { type: 'string', description: 'Subject/title of the AD' },
                issue_date: { type: 'string', description: 'Issue date YYYY-MM-DD' },
                effective_date: { type: 'string', description: 'Effective date YYYY-MM-DD if available' },
                publication_type: { type: 'string', description: 'AD, PAD, SIB, or SD' },
                url: { type: 'string', description: 'Direct URL on ad.easa.europa.eu' },
                superseded: { type: 'boolean', description: 'Whether this AD has been superseded' }
              }
            }
          }
        }
      }
    });

    const publications = llmResponse?.publications || [];

    return Response.json({
      ok: true,
      aircraft: { manufacturer: make, model: mdl, registration: registration || null },
      aircraft_label: aircraftLabel,
      publications,
      count: publications.length,
      source: 'EASA Safety Publications Tool',
      source_url: 'https://ad.easa.europa.eu/',
      fetched_at: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});