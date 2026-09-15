import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { requirePaidEntitlement } from '../_shared/accessControl.ts';
import { getSupabaseConfig } from '../_shared/aircraftTwin.ts';

const PROJECT_REF = 'bsvrcnyslqrotpllwfzm';

function normalizeRegistration(value: unknown) {
  return String(value || '').trim().toUpperCase().replace(/\s+/g, '');
}

async function supabaseRows(base44: any, table: string, query: string) {
  try {
    const config = getSupabaseConfig();
    let baseUrl = config.url;
    let key = config.key;

    if (!baseUrl || !key) {
      const { accessToken } = await base44.asServiceRole.connectors.getConnection('supabase');
      const keysResponse = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/api-keys`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!keysResponse.ok) return [];
      const keys = await keysResponse.json();
      key = keys.find((item: any) => item.name === 'service_role')?.api_key;
      baseUrl = `https://${PROJECT_REF}.supabase.co`;
    }
    if (!baseUrl || !key) return [];

    const response = await fetch(`${baseUrl}/rest/v1/${table}?${query}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    return response.ok ? await response.json() : [];
  } catch (_) {
    return [];
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const registration = normalizeRegistration(body.registration);
    if (!registration) return Response.json({ error: 'aircraft_registration is required' }, { status: 400 });

    const authz = await requirePaidEntitlement(req, 'ATI_FULL_REPORT', registration);
    if (authz.response) return authz.response;
    const svc = base44.asServiceRole.entities;
    const userEmail = authz.access.user.email;

    // Prefer a durable purchased report when one already exists.
    const purchased = await svc.PurchasedReport.filter({
      user_email: userEmail,
      product_key: 'ATI_FULL_REPORT',
      aircraft_registration: registration,
      status: 'ready',
    }, '-created_date', 1);
    if (purchased[0]?.result_data) {
      return Response.json({
        authorized: true,
        registration,
        source: 'purchased_report',
        report: purchased[0].result_data,
        purchased_report_id: purchased[0].id,
      });
    }

    const nNumber = registration.replace(/^N/, '');
    const [faaRows, passportRows, listingRows, openSkyRows] = await Promise.all([
      registration.startsWith('N') ? svc.FAAAircraft.filter({ n_number: nNumber }, '-created_date', 1) : [],
      svc.ATIPassport.filter({ registration }, '-created_date', 1),
      svc.AircraftListing.filter({ registration, status: 'active', visibility: 'public' }, '-created_date', 5),
      supabaseRows(base44, 'opensky_aircraft_metadata', `select=*&registration=eq.${encodeURIComponent(registration)}&limit=5`),
    ]);

    const faa = faaRows[0] || null;
    const passport = passportRows[0] || null;
    const listings = listingRows || [];
    const openSky = openSkyRows[0] || null;

    if (!faa && !passport && !openSky && listings.length === 0) {
      return Response.json({ authorized: true, registration, found: false, report: null }, { status: 404 });
    }

    let engine = null;
    if (passport?.engine_spec_id) {
      engine = await svc.EngineSpec.get(passport.engine_spec_id).catch(() => null);
    } else if (faa?.eng_mfr_mdl) {
      const engines = await svc.EngineSpec.filter({ engine_code: faa.eng_mfr_mdl }, '-created_date', 1);
      engine = engines[0] || null;
    }

    const report = {
      identity: {
        registration,
        manufacturer: passport?.make || listings[0]?.make || openSky?.manufacturer_name || null,
        model: passport?.model || listings[0]?.model || openSky?.model || null,
        year: faa?.year_mfr || null,
        serial_number: faa?.serial_number || passport?.serial_number || openSky?.serial_number || null,
        mode_s_hex: faa?.mode_s_hex || passport?.icao_hex || openSky?.icao24 || null,
      },
      registry: {
        source: registration.startsWith('N') ? 'FAA Registry' : 'ABOS / federated registry data',
        status_code: faa?.status_code || null,
        certificate_issue_date: faa?.cert_issue_date || null,
        airworthiness_date: faa?.air_worth_date || null,
        registration_expiry: faa?.expiration_date || null,
        location: [faa?.city, faa?.state, faa?.country].filter(Boolean).join(', ') || null,
        owner: null,
      },
      engine: engine ? {
        manufacturer: engine.manufacturer,
        model: engine.model_name,
        type: engine.engine_type,
        horsepower: engine.hp,
        thrust: engine.thrust,
        tbo_hours: engine.tbo_hours,
        fuel_type: engine.fuel_type,
        source: engine.source,
      } : {
        manufacturer: faa?.engine_mfr || null,
        model: faa?.engine_model || null,
        type: faa?.engine_type || null,
        horsepower: faa?.horsepower || null,
        thrust: faa?.thrust || null,
        tbo_hours: null,
        source: faa ? 'FAA aircraft record' : null,
      },
      ati: passport ? {
        total: passport.ati_total ?? null,
        label: passport.score_label || null,
        data_confidence: passport.data_confidence || null,
        dimensions: {
          documentation: passport.documentation ?? null,
          maintenance: passport.technical ?? null,
          transparency: passport.transparency ?? null,
          transaction_ready: passport.transaction_ready ?? null,
          usage_mission: passport.usage_mission ?? null,
          storage_exposure: passport.storage_exposure ?? null,
          configuration: passport.config_clarity ?? null,
          market_readiness: passport.market_readiness ?? null,
        },
        strengths: passport.strengths || null,
        risks: passport.risks || null,
        recommendations: passport.recommendations || null,
        data_gaps: passport.data_gaps || [],
      } : null,
      valuation: passport ? {
        omvm_value: passport.omvm_value ?? null,
        live_market_avg: passport.live_market_avg ?? null,
        live_min_price: passport.live_min_price ?? null,
        live_max_price: passport.live_max_price ?? null,
        live_listings_count: passport.live_listings_count ?? null,
        market_data_source: passport.market_data_source || 'none',
        deal_score: passport.deal_score ?? null,
        deal_label: passport.deal_label || null,
        discount_pct: passport.discount_pct ?? null,
      } : null,
      verification: {
        airworthiness_date_available: !!faa?.air_worth_date,
        damage_history_available: passport?.data_gaps ? !passport.data_gaps.includes('damage_history') : false,
        data_conflict: !!passport?.data_conflict,
        data_conflict_fields: passport?.data_conflict_fields || [],
        source_count: passport?.data_sources_matched ?? null,
        status: passport?.data_confidence || 'unverified',
      },
      // opensky_aircraft_metadata is static identity reference data (make, model,
      // serial, operator). It carries no observation timestamps, so nothing here
      // may be presented as flight activity — its updated_at is the bulk-import
      // time, identical for every row in the table.
      activity: {
        status: 'UNKNOWN',
        evidence_type: 'no_activity_observation_in_this_report',
        note: 'This report contains no flight-activity observation. UNKNOWN activity is not an inactivity or negative finding about the aircraft.',
      },
      opensky_metadata: {
        status: openSky ? 'METADATA_MATCH' : 'UNKNOWN',
        icao24: openSky?.icao24 || null,
        manufacturer: openSky?.manufacturer_name || null,
        model: openSky?.model || null,
        serial_number: openSky?.serial_number || null,
        retrieved_at: openSky?.source_retrieved_at || null,
        source: openSky ? 'opensky_aircraft_metadata' : null,
        note: openSky
          ? 'OpenSky metadata matched this registration. Identity reference only — not proof of activity, ownership, airworthiness, AD/SB compliance, or accident history.'
          : 'No OpenSky metadata found for this registration.',
      },
      market: {
        public_listings: listings.map((item: any) => ({
          id: item.id,
          title: item.title,
          make: item.make,
          model: item.model,
          year: item.year,
          registration: item.registration,
          asking_price: item.asking_price,
          currency: item.currency,
          source_url: item.source_url,
        })),
      },
      provenance: {
        generated_at: new Date().toISOString(),
        sources: [
          faa ? 'FAA Aircraft' : null,
          passport ? 'ABOS ATI Passport' : null,
          openSky ? 'OpenSky metadata' : null,
          listings.length ? 'ABOS Marketplace' : null,
          engine ? `EngineSpec:${engine.source || 'ABOS'}` : null,
        ].filter(Boolean),
      },
    };

    return Response.json({ authorized: true, registration, found: true, source: 'live_entitled_report', report });
  } catch (error) {
    console.error('aircraftIntelligenceReport error:', error?.message || error);
    return Response.json({ error: 'Aircraft intelligence report unavailable' }, { status: 500 });
  }
});