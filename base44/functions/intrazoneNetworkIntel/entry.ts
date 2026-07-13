import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const PROJECT_NAME = 'IntraZone';
const STATE = /^[A-Z]{2}$/;
const DESIGNATOR = /^[A-Z0-9]{2,6}$/;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('supabase');
    const projects = await fetch('https://api.supabase.com/v1/projects', {
      headers: { Authorization: `Bearer ${accessToken}` },
    }).then((response) => response.json());
    const project = projects.find((item) => String(item.name || '').toLowerCase() === PROJECT_NAME.toLowerCase());
    if (!project) return Response.json({ error: 'IntraZone project not found' }, { status: 502 });

    const query = async (sql) => {
      const response = await fetch(`https://api.supabase.com/v1/projects/${project.id}/database/query/read-only`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: sql }),
      });
      if (!response.ok) throw new Error('IntraZone query failed');
      return await response.json();
    };

    if (body.action === 'dealer_network') {
      const state = String(body.state || '').trim().toUpperCase();
      if (!STATE.test(state)) return Response.json({ error: 'Valid US state code required' }, { status: 400 });
      const records = await query(`select cert_num,name,city,state,ownership_type,cert_date,expiration_date from faa_dealers where is_active=true and state='${state}' order by city,name limit 200`);
      return Response.json({ source: 'FAA Dealer Registry via IntraZone', state, count: records.length, records });
    }

    if (body.action === 'operator_fleet') {
      const designator = String(body.designator || '').trim().toUpperCase();
      if (!DESIGNATOR.test(designator)) return Response.json({ error: 'Valid operator designator required' }, { status: 400 });
      const records = await query(`select o.name,o.cfr,o.chdo,o.designator,a.n_number,a.aircraft_mms,a.serial_number,a.source_updated_at from faa_certificated_operators o join faa_operator_aircraft a on a.operator_id=o.id where o.designator='${designator}' order by a.n_number limit 500`);
      return Response.json({ source: 'FAA Certificated Operators via IntraZone', designator, count: records.length, records });
    }

    if (body.action === 'nearby_facilities') {
      const lat = Number(body.latitude);
      const lon = Number(body.longitude);
      const radius = Math.min(Math.max(Number(body.radius_miles) || 100, 10), 500);
      if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lon) || lon < -180 || lon > 180) {
        return Response.json({ error: 'Valid latitude and longitude required' }, { status: 400 });
      }
      const records = await query(`select source_id,facility_key,city,state,latitude,longitude,year,fst,rural_service,round((3959*acos(least(1,cos(radians(${lat}))*cos(radians(latitude))*cos(radians(longitude)-radians(${lon}))+sin(radians(${lat}))*sin(radians(latitude)))))::numeric,1) as distance_miles from bts_air_facilities where latitude is not null and longitude is not null and (3959*acos(least(1,cos(radians(${lat}))*cos(radians(latitude))*cos(radians(longitude)-radians(${lon}))+sin(radians(${lat}))*sin(radians(latitude))))) <= ${radius} order by distance_miles limit 100`);
      return Response.json({ source: 'BTS Air Facilities via IntraZone', center: { latitude: lat, longitude: lon }, radius_miles: radius, count: records.length, records });
    }

    return Response.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message || String(error) }, { status: 500 });
  }
});