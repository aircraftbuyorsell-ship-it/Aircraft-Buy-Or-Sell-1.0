import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Enriches aircraft from the latest traffic snapshot with ATI proxy scores.
 * Called automatically after cachedTraffic refreshes, or manually by admin.
 * For each aircraft in snapshot without an AircraftListing → creates one + scores it.
 * For existing listings without ATI → scores them.
 */

function computeTrafficATIProxy(ac, faaRecord) {
  let score = 0;

  // 1) Has registration (not just ICAO hex)
  const hasReg = !!(ac.registration || ac.callsign?.match(/^[A-Z]-|^N[0-9]/));
  score += hasReg ? 13 : 4;

  // 2) Is airborne (not stuck on ground)
  score += !ac.on_ground ? 12 : 8;

  // 3) Has altitude data (ADS-B fully functional)
  score += ac.baro_altitude != null ? 13 : 5;

  // 4) ADS-B squawk (normal operations)
  const squawk = ac.squawk;
  score += !squawk ? 8
    : squawk === '7700' ? 0  // emergency
    : squawk === '7600' ? 2  // comm failure
    : squawk === '7500' ? 0  // hijack
    : squawk === '1200' ? 10 // VFR
    : 13; // assigned code = IFR/controlled

  // 5) Speed makes sense (not hovering or supersonic)
  const speedKt = ac.velocity ? ac.velocity * 1.94384 : null;
  score += speedKt == null ? 6
    : speedKt > 50 && speedKt < 500 ? 13
    : speedKt <= 50 ? 8
    : 5;

  // 6) Has FAA record (proper registration)
  score += faaRecord ? 15 : 4;

  // 7) FAA registration status
  if (faaRecord) {
    score += faaRecord.status_code === 'V' ? 14 : 6;
  } else {
    score += 6;
  }

  // 8) Vertical rate sensible
  const vr = ac.vertical_rate;
  score += vr == null ? 7
    : Math.abs(vr) < 30 ? 13  // stable
    : Math.abs(vr) < 100 ? 10
    : 6;

  return Math.min(120, Math.max(0, score));
}

function labelFromTotal(total) {
  if (total >= 108) return "EXCEPTIONAL";
  if (total >= 90) return "STRONG BUY";
  if (total >= 72) return "FAIR";
  if (total >= 54) return "CAUTION";
  if (total >= 36) return "RED FLAGS";
  return "AVOID";
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const limit = Math.min(body.limit || 100, 500);

    // Get latest traffic snapshot
    const snapshots = await base44.asServiceRole.entities.TrafficSnapshot.list('-refreshed_at', 1);
    if (!snapshots.length) {
      return Response.json({ ok: false, message: 'No traffic snapshot found. Refresh Live Traffic first.' });
    }

    const snap = snapshots[0];
    let aircraft = [];
    try { aircraft = JSON.parse(snap.aircraft_json || '[]'); } catch (_) {}

    if (!aircraft.length) {
      return Response.json({ ok: false, message: 'Snapshot is empty' });
    }

    // Only process airborne aircraft with registration
    const candidates = aircraft
      .filter(ac => ac.registration && !ac.on_ground)
      .slice(0, limit);

    let created = 0, updated = 0, skipped = 0;
    const results = [];

    for (const ac of candidates) {
      const reg = (ac.registration || '').toUpperCase().trim();
      if (!reg) { skipped++; continue; }

      // Look up FAA record
      const nNum = reg.replace(/^N/, '');
      const faaRecs = await base44.asServiceRole.entities.FAAAircraft.filter({ n_number: nNum }, '-created_date', 1);
      const faaRecord = faaRecs[0] || null;

      const atiScore = computeTrafficATIProxy(ac, faaRecord);
      const age = faaRecord?.year_mfr ? new Date().getFullYear() - faaRecord.year_mfr : 25;
      const omvmValue = Math.max(8000, Math.round(80000 * Math.exp(-0.03 * age) / 1000) * 1000);

      // Check existing listing
      const existing = await base44.asServiceRole.entities.AircraftListing.filter(
        { registration: reg }, '-created_date', 1
      );

      if (existing.length > 0) {
        const curr = existing[0];
        // Update only if no manual ATI score exists
        if (!curr.ati_score || curr.ati_score === 0) {
          await base44.asServiceRole.entities.AircraftListing.update(curr.id, {
            ati_score: atiScore,
            omvm_value: omvmValue,
          });
          updated++;
          results.push({ reg, action: 'updated', ati: atiScore });
        } else {
          skipped++;
        }
      } else {
        // Create new listing from traffic + FAA data
        await base44.asServiceRole.entities.AircraftListing.create({
          registration: reg,
          make: faaRecord?.name?.split(' ').slice(0, 2).join(' ') || ac.aircraft_type || 'Unknown',
          model: ac.aircraft_type || faaRecord?.mfr_mdl_code || 'Unknown',
          year: faaRecord?.year_mfr || null,
          ati_score: atiScore,
          omvm_value: omvmValue,
          status: 'active',
          visibility: 'public',
          ai_summary: `Live traffic auto-scored. Last seen airborne at ${Math.round((ac.baro_altitude || 0) * 3.28084)} ft, ${Math.round((ac.velocity || 0) * 1.94384)} kt. ICAO: ${ac.icao24}.`,
        });
        created++;
        results.push({ reg, action: 'created', ati: atiScore });
      }
    }

    return Response.json({
      ok: true,
      snapshot_age_min: Math.round((Date.now() - new Date(snap.refreshed_at).getTime()) / 60000),
      total_in_snapshot: aircraft.length,
      candidates_processed: candidates.length,
      created,
      updated,
      skipped,
      sample: results.slice(0, 10),
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});