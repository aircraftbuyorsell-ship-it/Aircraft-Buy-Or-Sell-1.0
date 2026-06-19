// Triggered by entity automation on TrafficSnapshot create/update
// Checks all active BrokerAlerts against current snapshot and sends email notifications
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function degreesToRad(deg) { return deg * Math.PI / 180; }
function haversineNm(lat1, lon1, lat2, lon2) {
  const R = 3440.065; // Earth radius in NM
  const dLat = degreesToRad(lat2 - lat1);
  const dLon = degreesToRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(degreesToRad(lat1)) * Math.cos(degreesToRad(lat2)) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function aircraftMatchesAlert(ac, alert) {
  if (alert.make_filter) {
    const make = (ac.aircraft_type || ac.registration || "").toLowerCase();
    if (!make.includes(alert.make_filter.toLowerCase())) return false;
  }
  if (alert.model_filter) {
    const model = (ac.aircraft_type || "").toLowerCase();
    if (!model.includes(alert.model_filter.toLowerCase())) return false;
  }
  if (alert.min_ati_score && ac.listing?.ati_score < alert.min_ati_score) return false;
  if (alert.max_price && ac.listing?.asking_price > alert.max_price) return false;
  return true;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Authenticate — this runs via entity automation and must validate the caller
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const snapshotId = body?.event?.entity_id || body?.snapshot_id;

    // Get the snapshot
    let snapshot = null;
    if (snapshotId) {
      const snaps = await base44.asServiceRole.entities.TrafficSnapshot.filter({ id: snapshotId }, '', 1);
      snapshot = snaps[0] || null;
    }
    if (!snapshot) {
      // Fall back to latest snapshot
      const snaps = await base44.asServiceRole.entities.TrafficSnapshot.list('-refreshed_at', 1);
      snapshot = snaps[0] || null;
    }
    if (!snapshot) return Response.json({ skipped: 'no snapshot' });

    const aircraft = JSON.parse(snapshot.aircraft_json || '[]');

    // Get all active broker alerts with a dealer location
    const alerts = await base44.asServiceRole.entities.BrokerAlert.filter({ is_active: true }, '', 100);
    if (!alerts.length) return Response.json({ skipped: 'no active alerts' });

    // Get dealer locations
    const locationIds = [...new Set(alerts.map(a => a.dealer_location).filter(Boolean))];
    const locations = {};
    for (const lid of locationIds) {
      try {
        const locs = await base44.asServiceRole.entities.DealerLocation.filter({ id: lid }, '', 1);
        if (locs[0]) locations[lid] = locs[0];
      } catch (_) {}
    }

    let notifsSent = 0;

    for (const alert of alerts) {
      if (alert.trigger_type !== 'aircraft_nearby') continue;
      const loc = alert.dealer_location ? locations[alert.dealer_location] : null;
      if (!loc?.latitude || !loc?.longitude) continue;

      const radiusNm = alert.radius_nm || 50;

      // Find matching aircraft within radius
      const matches = aircraft.filter(ac => {
        if (!ac.latitude || !ac.longitude) return false;
        if (ac.on_ground) return false;
        const dist = haversineNm(loc.latitude, loc.longitude, ac.latitude, ac.longitude);
        if (dist > radiusNm) return false;
        return aircraftMatchesAlert(ac, alert);
      });

      if (!matches.length) continue;

      // Don't re-notify more than once per hour
      if (alert.last_triggered_at) {
        const ago = Date.now() - new Date(alert.last_triggered_at).getTime();
        if (ago < 60 * 60 * 1000) continue;
      }

      // Send email notification
      const subject = `[ABOS Alert] "${alert.name}" — ${matches.length} aircraft near ${loc.name}`;
      const lines = matches.slice(0, 10).map(ac => {
        const reg = ac.faa?.n_number || ac.registration || ac.icao24;
        const alt = ac.baro_altitude ? `${Math.round(ac.baro_altitude * 3.28084).toLocaleString()} ft` : '—';
        const spd = ac.velocity ? `${Math.round(ac.velocity * 1.94384)} kt` : '—';
        const dist = Math.round(haversineNm(loc.latitude, loc.longitude, ac.latitude, ac.longitude));
        return `• ${reg} (${ac.aircraft_type || '?'}) — ${dist} NM away · Alt: ${alt} · Speed: ${spd}`;
      });

      const body_text = `Your ABOS Broker Alert "${alert.name}" has been triggered.\n\n${matches.length} aircraft detected within ${radiusNm} NM of ${loc.name}:\n\n${lines.join('\n')}\n\nView live traffic: ${Deno.env.get('BASE44_APP_URL') || 'https://app.base44.com'}/traffic\n\n— ABOS Platform`;

      await base44.asServiceRole.integrations.Core.SendEmail({
        to: alert.owner_email,
        subject,
        body: body_text,
        from_name: 'ABOS Broker Alerts',
      });

      // Update alert trigger stats
      await base44.asServiceRole.entities.BrokerAlert.update(alert.id, {
        last_triggered_at: new Date().toISOString(),
        trigger_count: (alert.trigger_count || 0) + 1,
      });

      notifsSent++;
    }

    return Response.json({ ok: true, alerts_checked: alerts.length, notifications_sent: notifsSent });
  } catch (error) {
    console.error('brokerAlertNotify error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});