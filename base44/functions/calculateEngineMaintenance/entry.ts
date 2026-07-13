import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const PROJECT_NAME = 'IntraZone';
const FAA_DRS_URL = 'https://drs.faa.gov/';
const normalizeReg = (value) => {
  const clean = String(value || '').trim().toUpperCase().replace(/\s+/g, '').replace(/^N/, '');
  return clean ? `N${clean}` : '';
};
const sqlText = (value) => String(value || '').replaceAll("'", "''");
const finiteNumber = (value) => value !== null && value !== '' && Number.isFinite(Number(value)) ? Number(value) : null;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const requested = Array.isArray(body.registrations) ? body.registrations : [body.registration];
    const registrations = [...new Set(requested.map(normalizeReg).filter(Boolean))].slice(0, 50);
    if (!registrations.length) return Response.json({ error: 'registration required' }, { status: 400 });

    const entities = base44.asServiceRole.entities;
    const nNumbers = registrations.map((registration) => registration.replace(/^N/, ''));
    const [faaRows, listingRows, passportRows, previousRows] = await Promise.all([
      entities.FAAAircraft.filter({ n_number: { $in: nNumbers } }, '-updated_date', 100),
      entities.AircraftListing.filter({ registration: { $in: registrations } }, '-updated_date', 250),
      entities.ATIPassport.filter({ registration: { $in: registrations } }, '-updated_date', 250),
      entities.EngineMaintenance.filter({ registration: { $in: registrations } }, '-updated_date', 100),
    ]);

    const engineCodes = [...new Set(faaRows.map((item) => String(item.eng_mfr_mdl || '').trim()).filter(Boolean))];
    const specs = engineCodes.length
      ? await entities.EngineSpec.filter({ engine_code: { $in: engineCodes } }, '-updated_date', 100)
      : [];
    const specByCode = new Map(specs.map((item) => [String(item.engine_code || '').trim(), item]));

    let officialRows = [];
    let officialAvailable = true;
    if (specs.length) {
      try {
        const { accessToken } = await base44.asServiceRole.connectors.getConnection('supabase');
        const projectsResponse = await fetch('https://api.supabase.com/v1/projects', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!projectsResponse.ok) throw new Error('FAA source project unavailable');
        const projects = await projectsResponse.json();
        const project = projects.find((item) => String(item.name || '').toLowerCase() === PROJECT_NAME.toLowerCase());
        if (!project) throw new Error('FAA source project unavailable');

        const clauses = specs.map((spec) => {
          const manufacturer = sqlText(spec.manufacturer || '');
          const model = sqlText(spec.model_name || '');
          return `(lower(coalesce(manufacturer,'')) like lower('%${manufacturer}%') or lower(coalesce(aircraft_applicability::text,'')) like lower('%${model}%'))`;
        }).join(' or ');
        const query = `select ad_number,title,effective_date,status,manufacturer,aircraft_applicability from faa_ad where ${clauses} order by effective_date desc nulls last limit 500`;
        const response = await fetch(`https://api.supabase.com/v1/projects/${project.id}/database/query/read-only`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
        });
        if (!response.ok) throw new Error('FAA DRS data unavailable');
        const data = await response.json();
        officialRows = Array.isArray(data) ? data.flat().filter(Boolean) : [];
      } catch (_) {
        officialAvailable = false;
      }
    }

    const now = new Date().toISOString();
    const results = [];
    for (const registration of registrations) {
      const faa = faaRows.find((item) => normalizeReg(item.n_number) === registration);
      const engineCode = String(faa?.eng_mfr_mdl || '').trim();
      if (!engineCode) {
        results.push({ registration, status: 'skipped', reason: 'no engine assigned' });
        continue;
      }

      const spec = specByCode.get(engineCode) || null;
      const listings = listingRows.filter((item) => normalizeReg(item.registration) === registration);
      const passports = passportRows.filter((item) => normalizeReg(item.registration) === registration);
      const previous = previousRows.find((item) => normalizeReg(item.registration) === registration && item.engine_code === engineCode);

      let currentHours = registrations.length === 1 ? finiteNumber(body.engine_hours) : null;
      let hoursSource = currentHours !== null ? 'submitted' : 'unavailable';
      if (currentHours === null) {
        const listing = listings.find((item) => finiteNumber(item.engine_hours) !== null);
        if (listing) { currentHours = finiteNumber(listing.engine_hours); hoursSource = 'listing'; }
      }
      if (currentHours === null) {
        const passport = passports.find((item) => finiteNumber(item.engine_current_hours) !== null);
        if (passport) { currentHours = finiteNumber(passport.engine_current_hours); hoursSource = 'digital_twin'; }
      }
      if (currentHours === null && finiteNumber(previous?.current_engine_hours) !== null) {
        currentHours = finiteNumber(previous.current_engine_hours);
        hoursSource = 'last_record';
      }

      const tboHours = finiteNumber(spec?.tbo_hours);
      const remainingHours = tboHours !== null && currentHours !== null ? Math.max(0, tboHours - currentHours) : null;
      const remainingPct = tboHours && remainingHours !== null ? Math.max(0, Math.min(100, Math.round((remainingHours / tboHours) * 100))) : null;
      const manufacturerNeedle = String(spec?.manufacturer || '').toLowerCase();
      const modelNeedle = String(spec?.model_name || '').toLowerCase();
      const applicable = officialRows.filter((item) => {
        const text = JSON.stringify(item).toLowerCase();
        return (manufacturerNeedle && text.includes(manufacturerNeedle)) || (modelNeedle && text.includes(modelNeedle));
      }).slice(0, 25);
      const bulletinStatus = !officialAvailable ? 'unavailable' : applicable.length ? 'review_required' : 'no_current_items_found';
      const maintenanceData = {
        registration,
        engine_code: engineCode,
        engine_spec_id: spec?.id || null,
        engine_manufacturer: spec?.manufacturer || faa?.engine_mfr || '',
        engine_model: spec?.model_name || faa?.engine_model || '',
        tbo_hours: tboHours,
        current_engine_hours: currentHours,
        remaining_hours: remainingHours,
        remaining_pct: remainingPct,
        hours_source: hoursSource,
        service_bulletin_status: bulletinStatus,
        service_bulletin_count: applicable.length,
        service_bulletins: applicable.map((item) => ({
          number: item.ad_number || '',
          title: item.title || '',
          effective_date: item.effective_date || '',
          status: item.status || '',
        })),
        service_bulletin_source: FAA_DRS_URL,
        calculated_at: now,
      };

      if (previous) await entities.EngineMaintenance.update(previous.id, maintenanceData);
      else await entities.EngineMaintenance.create(maintenanceData);

      if (tboHours !== null) {
        const listingUpdates = listings.filter((item) => finiteNumber(item.tbo) !== tboHours).map((item) => ({ id: item.id, tbo: tboHours }));
        if (listingUpdates.length) await entities.AircraftListing.bulkUpdate(listingUpdates);
      }
      const passportUpdates = passports.filter((item) =>
        item.engine_spec_id !== (spec?.id || null) || finiteNumber(item.engine_tbo_hours) !== tboHours || finiteNumber(item.engine_remaining_pct) !== remainingPct
      ).map((item) => ({
        id: item.id,
        engine_spec_id: spec?.id || null,
        engine_tbo_hours: tboHours,
        engine_remaining_pct: remainingPct,
      }));
      if (passportUpdates.length) await entities.ATIPassport.bulkUpdate(passportUpdates);

      results.push({ ...maintenanceData, status: 'calculated' });
    }

    return Response.json({ processed: results.length, results });
  } catch (error) {
    return Response.json({ error: error.message || String(error) }, { status: 500 });
  }
});