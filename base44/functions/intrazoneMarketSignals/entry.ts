import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const PROJECT_NAME = 'IntraZone';
const AIRPORT = /^[A-Z0-9]{3,4}$/;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'overview';
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

    if (action === 'overview') {
      const data = await query(`
        select json_build_object(
          'market_pulse', coalesce((select json_agg(x) from (select aircraft_category,period_start,period_end,avg_ati_score,median_price,price_trend_pct,listing_count,sold_count,avg_days_to_close,demand_signal,computed_at from market_pulse order by period_end desc limit 12) x),'[]'::json),
          'jet_fuel', coalesce((select json_agg(x) from (select period,value_usd_per_gallon,units,area_code,source_description from eia_jet_fuel_spot_prices order by period desc limit 12) x),'[]'::json),
          'international_traffic', coalesce((select json_agg(x) from (select year,month,metric_type,sum(total) as total from dot_international_air_traffic group by year,month,metric_type order by year desc,month desc limit 18) x),'[]'::json),
          'network', json_build_object('active_dealers',(select count(*) from faa_dealers where is_active=true),'certificated_operators',(select count(*) from faa_certificated_operators),'tracked_operator_aircraft',(select count(*) from faa_operator_aircraft),'air_facilities',(select count(*) from bts_air_facilities),'active_eu_mro',(select count(*) from eu_mro_organisations where status='active'),'verified_eu_mro_states',(select count(*) from easa_member_state_ingestion where mro_status='approved'))
        ) as result
      `);
      return Response.json({ source: 'IntraZone', generated_at: new Date().toISOString(), ...(data[0]?.result || {}) });
    }

    if (action === 'airport_traffic') {
      const airport = String(body.airport || '').trim().toUpperCase();
      if (!AIRPORT.test(airport)) return Response.json({ error: 'Valid 3-4 character airport code required' }, { status: 400 });
      const year = Math.min(Math.max(Number(body.year) || new Date().getUTCFullYear(), 2000), 2100);
      const limit = Math.min(Math.max(Number(body.limit) || 50, 1), 100);
      const data = await query(`select year,month,usg_apt,fg_apt,carrier,metric_type,scheduled,charter,total from dot_international_air_traffic where year=${year} and (usg_apt='${airport}' or fg_apt='${airport}') order by month desc,total desc limit ${limit}`);
      return Response.json({ source: 'IntraZone', airport, year, count: data.length, records: data });
    }

    return Response.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message || String(error) }, { status: 500 });
  }
});