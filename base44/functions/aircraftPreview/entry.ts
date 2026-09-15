import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getSupabaseConfig } from '../_shared/aircraftTwin.ts';

const PROJECT_REF = 'bsvrcnyslqrotpllwfzm';
const normalizeRegistration = (value: unknown) => String(value || '').trim().toUpperCase().replace(/\s+/g, '');

async function supabaseRows(base44: any, table: string, query: string) {
  try {
    const config = getSupabaseConfig();
    let baseUrl = config.url;
    let key = config.key;
    if (!baseUrl || !key) {
      const { accessToken } = await base44.asServiceRole.connectors.getConnection('supabase');
      const keysResponse = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/api-keys`, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (!keysResponse.ok) return [];
      const keys = await keysResponse.json();
      key = keys.find((item: any) => item.name === 'service_role')?.api_key;
      baseUrl = `https://${PROJECT_REF}.supabase.co`;
    }
    if (!baseUrl || !key) return [];
    const response = await fetch(`${baseUrl}/rest/v1/${table}?${query}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
    return response.ok ? await response.json() : [];
  } catch (_) { return []; }
}

async function fetchAdsbdb(registration: string) {
  try {
    const response = await fetch(`https://api.adsbdb.com/v0/callsign/${encodeURIComponent(registration)}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(7000),
    });
    if (!response.ok) return null;
    return (await response.json())?.response?.aircraft || null;
  } catch (_) {
    return null;
  }
}

function mapAdsbdb(ac: any, registration: string) {
  if (!ac) return null;
  return {
    registration,
    make: ac.manufacturername || ac.manufacturer || null,
    model: ac.type || ac.model || null,
    year: null,
    serial_number: ac.serialnumber || ac.serial_number || null,
    status: 'UNKNOWN',
    mode_s_hex: ac.mode_s || ac.icao24 || null,
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const registration = normalizeRegistration(body.registration || body.query);
    if (!registration) return Response.json({ error: 'registration required' }, { status: 400 });

    const nNumber = registration.replace(/^N/, '');
    const [faaRows, passportRows, listingRows, openSkyRows, adsbdbAircraft] = await Promise.all([
      registration.startsWith('N') ? base44.asServiceRole.entities.FAAAircraft.filter({ n_number: nNumber }, '-created_date', 1) : [],
      base44.asServiceRole.entities.ATIPassport.filter({ registration }, '-created_date', 1),
      base44.asServiceRole.entities.AircraftListing.filter({ registration, status: 'active', visibility: 'public' }, '-created_date', 1),
      supabaseRows(base44, 'opensky_aircraft_metadata', `select=*&registration=eq.${encodeURIComponent(registration)}&limit=1`),
      fetchAdsbdb(registration),
    ]);
    const faa = faaRows[0] || null;
    const passport = passportRows[0] || null;
    const listing = listingRows[0] || null;
    const openSky = openSkyRows[0] || null;
    const adsbdb = mapAdsbdb(adsbdbAircraft, registration);

    if (!faa && !passport && !listing && !openSky && !adsbdb) {
      // No evidence is a valid state, not an HTTP error. The UI must be able to
      // distinguish UNKNOWN from a broken endpoint without treating 404 as data.
      return Response.json({ found: false, registration, evidence: { registry: false, digital_twin: false, marketplace: false, activity_metadata: false, adsbdb: false } });
    }

    return Response.json({
      found: true,
      registration,
      aircraft: {
        registration,
        make: passport?.make || listing?.make || openSky?.manufacturer_name || adsbdb?.make || faa?.make || null,
        model: passport?.model || listing?.model || openSky?.model || adsbdb?.model || faa?.model || null,
        year: faa?.year_mfr || passport?.year_manufactured || listing?.year || null,
        serial_number: faa?.serial_number || passport?.serial_number || openSky?.serial_number || adsbdb?.serial_number || null,
        status: faa?.status_code || passport?.verification_status || listing?.status || adsbdb?.status || 'UNKNOWN',
        mode_s_hex: faa?.mode_s_hex || passport?.icao_hex || openSky?.icao24 || adsbdb?.mode_s_hex || null,
      },
      evidence: {
        registry: !!faa,
        digital_twin: !!passport,
        marketplace: !!listing,
        activity_metadata: !!openSky,
        adsbdb: !!adsbdb,
      },
      searchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('aircraftPreview error:', error?.message || error);
    return Response.json({ error: 'Aircraft preview unavailable' }, { status: 500 });
  }
});