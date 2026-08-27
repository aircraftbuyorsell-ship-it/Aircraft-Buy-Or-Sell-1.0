import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { resolveAccess, requireCapability } from '../_shared/accessControl.ts';

const PROJECT_NAME = 'AircraftBuyOrSell_Supabase';
const PROJECT_REF = 'bsvrcnyslqrotpllwfzm';
const normalizeReg = (value) => String(value || '').trim().toUpperCase().replace(/\s+/g, '');
const normalizeText = (value) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
const sqlText = (value) => String(value || '').replaceAll("'", "''"); // rebuild

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const registration = normalizeReg(body.registration || body.query);
    if (!registration) return Response.json({ error: 'registration required' }, { status: 400 });

    let user = null;
    try { user = await base44.auth.me(); } catch (_) { user = null; }
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Access is resolved before any Supabase connector, project discovery, or
    // aircraft data query. T1 gets only the public/basic surface; T2 unlocks
    // intelligence/LLM/MCP-backed features; T3 is full/admin access.
    const access = await resolveAccess(req);
    if (!access.ok) return Response.json({ error: access.error || 'Unauthorized' }, { status: access.status || 401 });
    const capabilityError = requireCapability(access, 'advanced_intelligence');
    if (capabilityError) return capabilityError;

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('supabase');
    const projectsResponse = await fetch('https://api.supabase.com/v1/projects', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!projectsResponse.ok) return Response.json({ error: 'Aircraft data source unavailable' }, { status: 502 });
    const projects = await projectsResponse.json();
    const project = projects.find((item) => item.id === PROJECT_REF || item.ref === PROJECT_REF)
      || projects.find((item) => String(item.name || '').toLowerCase() === PROJECT_NAME.toLowerCase())
      || (projects.length === 1 ? projects[0] : null);
    if (!project) return Response.json({ error: 'Aircraft data source not found' }, { status: 502 });

    const keysResponse = await fetch(`https://api.supabase.com/v1/projects/${project.id}/api-keys`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!keysResponse.ok) return Response.json({ error: 'Aircraft data source unavailable' }, { status: 502 });
    const keys = await keysResponse.json();
    const serviceKey = keys.find((item) => item.name === 'service_role')?.api_key;
    if (!serviceKey) return Response.json({ error: 'Aircraft data source unavailable' }, { status: 502 });

    const rest = async (table, params) => {
      const response = await fetch(`https://${project.id}.supabase.co/rest/v1/${table}?${params}`, {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      });
      return response.ok ? await response.json() : [];
    };

    const nNumber = registration.replace(/^N/i, '');
    const [registryRows, catalogRows, passportRows, cardRows, listingRows, trafficRows] = await Promise.all([
      rest('faa_registry', `select=*&n_number=eq.${encodeURIComponent(nNumber)}&limit=1`),
      rest('base44_aircraft_catalog', `select=*&n_number=eq.${encodeURIComponent(nNumber)}&limit=1`),
      rest('aircraft_passports', `select=*&registration=eq.${encodeURIComponent(registration)}&limit=1`),
      rest('aircraft_cards', `select=*&registration=eq.${encodeURIComponent(registration)}&order=updated_at.desc&limit=1`),
      rest('aircraftbuyorsell_listings', `select=id,title,manufacturer,model,year,registration,price,currency,location,status,source_url,image_urls&registration=eq.${encodeURIComponent(registration)}&order=updated_at.desc&limit=1`),
      rest('live_traffic', `select=icao24,callsign,latitude,longitude,altitude_ft,ground_speed_kt,heading,on_ground,recorded_at&registration=eq.${encodeURIComponent(registration)}&order=recorded_at.desc&limit=100`),
    ]);

    const registry = registryRows[0] || null;
    const catalog = catalogRows[0] || null;
    const passport = passportRows[0] || null;
    const card = cardRows[0] || null;
    const listing = listingRows[0] || null;
    if (!registry && !catalog && !passport && !card && !listing) {
      return Response.json({ found: false, registration }, { status: 404 });
    }

    const aircraftCode = registry?.mfr_mdl_code || catalog?.mfr_mdl_code || null;
    const engineCode = registry?.eng_mfr_mdl || catalog?.engine_mfr_mdl_code || null;
    const [aircraftRefRows, engineRefRows, atiSignalRows, operatorAircraftRows, dealerRows, scoreRows, marketRows] = await Promise.all([
      aircraftCode ? rest('faa_acftref', `select=*&code=eq.${encodeURIComponent(aircraftCode.trim())}&limit=1`) : [],
      engineCode ? rest('faa_engine', `select=*&code=eq.${encodeURIComponent(engineCode.trim())}&limit=1`) : [],
      rest('faa_ati_signals', `select=*&n_number=eq.${encodeURIComponent(nNumber)}&limit=1`),
      rest('faa_operator_aircraft', `select=*&n_number=eq.${encodeURIComponent(registration)}&limit=1`),
      registry?.state ? rest('faa_dealers', `select=cert_num,name,city,state,ownership_type,cert_date,expiration_date,is_active&state=eq.${encodeURIComponent(registry.state)}&is_active=eq.true&limit=25`) : [],
      passport?.id ? rest('score_runs', `select=*&passport_id=eq.${encodeURIComponent(passport.id)}&order=created_at.desc&limit=1`) : [],
      rest('market_pulse', 'select=*&order=period_end.desc&limit=12'),
    ]);
    const operatorRows = operatorAircraftRows[0]?.operator_id
      ? await rest('faa_certificated_operators', `select=id,cfr,chdo,designator,name,source_updated_at&id=eq.${encodeURIComponent(operatorAircraftRows[0].operator_id)}&limit=1`)
      : [];
    const aircraftRef = aircraftRefRows[0] || null;
    const engineRef = engineRefRows[0] || null;
    const atiSignal = atiSignalRows[0] || null;
    const operatorAircraft = operatorAircraftRows[0] || null;
    const operator = operatorRows[0] || null;
    const scoreRun = scoreRows[0] || null;
    const make = catalog?.manufacturer || aircraftRef?.mfr || passport?.make || card?.make || listing?.manufacturer || null;
    const model = catalog?.model || aircraftRef?.model || passport?.model || card?.model || listing?.model || null;

    let unlocked = ['admin', 'super_admin'].includes(user?.role);
    if (!unlocked && user?.email) {
      const requests = await base44.asServiceRole.entities.ReportRequest.filter(
        { registration, email: user.email }, '-created_date', 10
      );
      unlocked = requests.some((item) => ['paid', 'delivered'].includes(item.status));
    }

    const enginePromise = engineCode
      ? base44.asServiceRole.entities.EngineSpec.filter({ engine_code: engineCode.trim() }, '-created_date', 1)
      : Promise.resolve([]);
    const modelNeedle = sqlText(model || '');
    const makeNeedle = sqlText(make || '');
    const complianceQuery = modelNeedle || makeNeedle ? `
      select 'ad' as kind, ad_number as number, title, effective_date as date, status
      from faa_ad
      where lower(coalesce(manufacturer,'')) like lower('%${makeNeedle}%')
         or lower(coalesce(aircraft_applicability::text,'')) like lower('%${modelNeedle}%')
      order by effective_date desc nulls last limit 50;
      select 'stc' as kind, stc_number as number, title, approval_date as date, status
      from faa_stc
      where lower(coalesce(aircraft_models::text,'')) like lower('%${modelNeedle}%')
         or lower(coalesce(description,'')) like lower('%${modelNeedle}%')
      order by approval_date desc nulls last limit 50;
    ` : '';
    const compliancePromise = complianceQuery
      ? fetch(`https://api.supabase.com/v1/projects/${project.id}/database/query/read-only`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: complianceQuery }),
        }).then(async (response) => response.ok ? await response.json() : [])
      : Promise.resolve([]);

    const [engineSpecs, compliance] = await Promise.all([enginePromise, compliancePromise]);
    const engineSpec = engineSpecs[0] || null;
    const complianceRows = Array.isArray(compliance) ? compliance.flat().filter(Boolean) : [];
    const ads = complianceRows.filter((item) => item.kind === 'ad');
    const stcs = complianceRows.filter((item) => item.kind === 'stc');
    const ownerQuery = normalizeText(body.owner_query);
    const ownerMatch = ownerQuery ? normalizeText(registry?.name) === ownerQuery : null;

    const privateData = {
      last_known_log: card?.documents || null,
      total_time: card?.ttaf ?? passport?.ttaf_hours ?? null,
      engine_time: card?.engine_smoh ?? card?.engine_total_time ?? null,
      prop_time: card?.prop_spoh ?? null,
      damage_history: card?.damage_history ?? null,
      service_bulletins: card?.documents || null,
      ati_score: scoreRun?.total_score ?? card?.ati_score ?? null,
      ati_breakdown: scoreRun ? {
        market_fit: scoreRun.dim_market_fit,
        pricing: scoreRun.dim_pricing,
        condition: scoreRun.dim_condition,
        demand: scoreRun.dim_demand,
        history: scoreRun.dim_history,
        liquidity: scoreRun.dim_liquidity,
        confidence_pct: scoreRun.confidence_pct,
      } : card?.ati_breakdown ?? null,
      valuation: scoreRun ? {
        low: scoreRun.price_range_low,
        mid: scoreRun.price_range_mid,
        high: scoreRun.price_range_high,
        currency: scoreRun.price_currency,
        verdict: scoreRun.price_verdict,
      } : null,
      capex_preview: scoreRun?.capex_preview ?? card?.capex_preview ?? null,
    };
    const premiumFields = Object.entries(privateData).filter(([, value]) => value !== null).map(([key]) => key);

    return Response.json({
      found: true,
      source: 'intrazone_federated',
      origin_label: registration.startsWith('N') ? 'United States (FAA)' : 'Global Registry',
      aircraft: {
        registration,
        make,
        model,
        year: registry?.year_mfr || catalog?.year_mfr || passport?.year_manufactured || card?.year || listing?.year || null,
        serial_number: registry?.serial_number || catalog?.serial_number || passport?.serial_number || null,
        registered_owner: '****',
        owner_match: ownerMatch,
        owner_match_label: ownerMatch === null ? null : ownerMatch ? 'Match' : 'Match failed',
        mode_s_hex: registry?.mode_s_code_hex || catalog?.mode_s_code_hex || passport?.icao24 || trafficRows[0]?.icao24 || null,
        status: registry?.status_code || catalog?.status_code || card?.status || null,
        state: registry?.state || null,
        country: registry?.country || null,
        certification: registry?.certification || catalog?.certification || null,
        cert_issue_date: registry?.cert_issue_date || catalog?.cert_issue_date || null,
        expiration_date: registry?.expiration_date || catalog?.expiration_date || null,
        air_worth_date: registry?.air_worth_date || catalog?.air_worth_date || null,
        last_action_date: registry?.last_action_date || catalog?.last_action_date || passport?.last_activity_date || null,
        engine_code: engineCode,
        engine_mfr: engineSpec?.manufacturer || engineRef?.mfr || catalog?.engine_manufacturer || null,
        engine_model: engineSpec?.model_name || engineRef?.model || catalog?.engine_model || null,
        engine_type: engineSpec?.engine_type || engineRef?.type || aircraftRef?.type_engine || catalog?.type_engine || card?.engine_type || null,
        horsepower: engineRef?.horsepower || catalog?.horsepower || null,
        thrust: engineRef?.thrust || catalog?.thrust || null,
        seats: aircraftRef?.no_seats || catalog?.seat_count || null,
        cruise_speed_mph: aircraftRef?.speed_mph || catalog?.cruise_speed_mph || null,
        engine_tbo_hours: engineSpec?.tbo_hours || card?.engine_tbo || null,
      },
      certificates: {
        airworthiness: { available: !!(registry?.air_worth_date || catalog?.air_worth_date), date: registry?.air_worth_date || catalog?.air_worth_date || null },
        ad: { count: ads.length, items: ads },
        stc: { count: stcs.length, items: stcs },
        sb: { available: !!privateData.service_bulletins, locked: !unlocked },
        damage_history_check: { available: privateData.damage_history !== null, locked: !unlocked },
      },
      traffic: {
        sightings: trafficRows.length,
        last_seen: trafficRows[0]?.recorded_at || null,
        latest: trafficRows[0] || null,
        history: trafficRows,
      },
      registry_filings: atiSignal ? {
        bill_of_sale_count: atiSignal.bos_count,
        security_agreement_count: atiSignal.sa_count,
        release_count: atiSignal.rel_count,
        total_documents: atiSignal.total_docs,
        latest_filing: atiSignal.latest_filing,
        ati_signal: atiSignal.ati_signal,
      } : null,
      commercial_operator: operator ? {
        name: operator.name,
        cfr: operator.cfr,
        designator: operator.designator,
        certificate_office: operator.chdo,
        aircraft_reference: operatorAircraft?.aircraft_mms || null,
        source_updated_at: operator.source_updated_at,
      } : null,
      service_network: { state: registry?.state || null, active_dealers: dealerRows },
      market_context: marketRows,
      listing,
      premium: {
        unlocked,
        fields_available: premiumFields,
        data: unlocked ? privateData : null,
      },
      data_sources: [
        'FAA Registry',
        (catalog || aircraftRef) ? 'Aircraft Reference' : null,
        engineRef ? 'FAA Engine Reference' : null,
        atiSignal ? 'FAA Filing Signals' : null,
        operator ? 'FAA Certificated Operators' : null,
        dealerRows.length ? 'FAA Dealer Network' : null,
        scoreRun ? 'ATI Score Runs' : null,
        marketRows.length ? 'Market Pulse' : null,
        passport ? 'Digital Twin' : null,
        trafficRows.length ? 'Live Traffic' : null,
        listing ? 'Marketplace' : null,
      ].filter(Boolean),
      searchedAt: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message || String(error) }, { status: 500 });
  }
});