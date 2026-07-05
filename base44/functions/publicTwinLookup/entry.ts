import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// PUBLIC endpoint — anonymous N-Number / registration / serial lookup (CarVertical model).
// SECURITY: Returns ONLY non-sensitive, intentionally-public data:
//   - Registration, year, make/model (public FAA registry data)
//   - Owner name is MASKED (first letter + asterisks)
//   - Serial number is MASKED (first 3 chars + asterisks)
//   - ATI numeric score is LOCKED (not returned — requires payment)
//   - No email, no internal IDs, no financial data, no broker/owner contact info

function normalizeReg(input) {
  const clean = String(input || '').trim().toUpperCase().replace(/^N/, '');
  return clean ? `N${clean}` : '';
}

function maskOwner(name) {
  if (!name) return null;
  const parts = String(name).trim().split(/\s+/);
  return parts.map(p => p.length > 1 ? `${p[0]}${'*'.repeat(Math.min(p.length - 1, 6))}` : p).join(' ');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const query = String(body.query || '').trim().toUpperCase();
    if (!query || query.length < 2) {
      return Response.json({ error: 'query required (N-Number, registration or serial number)' }, { status: 400 });
    }

    const svc = base44.asServiceRole.entities;
    const nLookup = query.replace(/^N/, '');

    // 1) Try N-Number match
    let faaRecs = await svc.FAAAircraft.filter({ n_number: nLookup }, '-created_date', 1);
    // 2) Fall back to serial number match
    if (faaRecs.length === 0) {
      faaRecs = await svc.FAAAircraft.filter({ serial_number: query }, '-created_date', 1);
    }
    const faa = faaRecs[0];
    if (!faa) {
      return Response.json({ found: false, query });
    }

    const reg = normalizeReg(faa.n_number);

    // Look up passport + listing in parallel
    const [passports, listings] = await Promise.all([
      svc.ATIPassport.filter({ registration: reg }, '-created_date', 1),
      svc.AircraftListing.filter({ registration: reg }, '-created_date', 1),
    ]);
    const passport = passports[0] || null;
    const listing = listings[0] || null;

    // Resolve make/model — prefer listing, fall back to FAA code
    const make = listing?.make || null;
    const model = listing?.model || faa.mfr_mdl_code || null;

    return Response.json({
      found: true,
      registration: reg,
      serial_number_masked: faa.serial_number
        ? `${faa.serial_number.slice(0, 3)}${'*'.repeat(Math.max(0, faa.serial_number.length - 3))}`
        : null,
      year: faa.year_mfr || null,
      make,
      model,
      owner_masked: maskOwner(faa.name),
      owner_state: faa.state || null,
      registration_status: faa.status_code === 'V' ? 'Valid' : faa.status_code || 'Unknown',
      has_ati_report: !!passport,
      score_label: passport?.score_label || null,
      // Score number is LOCKED — only revealed after payment
      ati_score_locked: true,
      data_points_available: passport ? [
        'FAA Registry Verification',
        passport.engine_spec_id ? 'Engine Specifications & TBO' : null,
        (passport.data_gaps || []).includes('No ADS-B traffic records observed') ? null : 'Flight Activity History',
        'Ownership & Document Trail',
        'Market Position Analysis',
      ].filter(Boolean) : [],
      is_for_sale: !!(listing && listing.status === 'active'),
      report_price_eur: 29,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});