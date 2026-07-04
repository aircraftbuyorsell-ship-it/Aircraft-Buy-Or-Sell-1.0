// DATA INTEGRITY SHIELD
// Triggered by entity automation on ATIPassport create/update.
// Cross-checks aircraft identity across 3 sources: FAA cache, adsbdb, ADS-B TrafficAppearance.
// Sets data_conflict + data_confidence on the passport; alerts admins on new conflicts.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const INTEGRITY_FIELDS = ['data_conflict', 'data_confidence', 'data_conflict_fields', 'data_sources_matched', 'integrity_checked_at'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const passportId = body?.event?.entity_id || body?.passport_id;
    if (!passportId) return Response.json({ error: 'passport_id required' }, { status: 400 });

    // Loop guard: skip updates that only touched integrity fields (our own write-back)
    const changed = body?.changed_fields;
    if (Array.isArray(changed) && changed.length > 0 && changed.every((f) => INTEGRITY_FIELDS.includes(f))) {
      return Response.json({ skipped: 'integrity-only update' });
    }

    const passports = await base44.asServiceRole.entities.ATIPassport.filter({ id: passportId }, '', 1);
    const passport = passports[0];
    if (!passport) return Response.json({ skipped: 'passport not found' });

    const reg = (passport.registration || '').toUpperCase().trim();
    if (!reg) return Response.json({ skipped: 'no registration' });

    const norm = (h) => {
      const v = (h || '').toString().trim().toLowerCase();
      return v.length >= 6 ? v : null;
    };

    const sources = {};

    // Source 1: FAA registry cache
    const nNumber = reg.startsWith('N') ? reg.slice(1) : reg;
    const faaRecs = await base44.asServiceRole.entities.FAAAircraft.filter({ n_number: nNumber }, '', 1);
    const faa = faaRecs[0] || null;
    if (faa) sources.faa_registry = { hex: norm(faa.mode_s_hex) };

    // Source 2: adsbdb (external, fast timeout)
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 5000);
      const res = await fetch(`https://api.adsbdb.com/v0/aircraft/${reg}`, { signal: ctrl.signal });
      clearTimeout(t);
      if (res.ok) {
        const j = await res.json();
        const ac = j?.response?.aircraft;
        if (ac) sources.adsbdb = { hex: norm(ac.mode_s) };
      }
    } catch (_) { /* source unavailable — skip-if-missing */ }

    // Source 3: OpenSky ADS-B traffic appearances
    const traffic = await base44.asServiceRole.entities.TrafficAppearance.filter({ registration: reg }, '-captured_at', 1);
    if (traffic[0]) sources.adsb_traffic = { hex: norm(traffic[0].icao24) };

    // ── Compare identity fields across sources ──
    const conflictFields = [];
    const passportHex = norm(passport.icao_hex);
    const sourceHexes = Object.values(sources).map((s) => s.hex).filter(Boolean);
    const allHexes = [passportHex, ...sourceHexes].filter(Boolean);
    if (new Set(allHexes).size > 1) conflictFields.push('icao_hex');

    if (faa && passport.serial_number && faa.serial_number) {
      const a = passport.serial_number.toString().trim().toUpperCase();
      const b = faa.serial_number.toString().trim().toUpperCase();
      if (a !== b) conflictFields.push('serial_number');
    }
    if (faa && faa.status_code && faa.status_code !== 'V') conflictFields.push('registration_status');

    // ── Confidence: number of independent sources agreeing ──
    const hexDisagreement = new Set(sourceHexes).size > 1;
    let matched;
    if (sourceHexes.length > 0) {
      const counts = {};
      for (const h of sourceHexes) counts[h] = (counts[h] || 0) + 1;
      matched = Math.max(...Object.values(counts));
    } else {
      matched = Math.min(Object.keys(sources).length, 1);
    }
    const dataConflict = conflictFields.length >= 2;
    const confidence = hexDisagreement || dataConflict || matched <= 1
      ? 'unverified'
      : matched >= 3 ? 'verified' : 'caution';

    // ── Write back only if something changed (prevents automation loops) ──
    const unchanged =
      passport.data_conflict === dataConflict &&
      passport.data_confidence === confidence &&
      passport.data_sources_matched === matched &&
      JSON.stringify(passport.data_conflict_fields || []) === JSON.stringify(conflictFields);

    if (!unchanged) {
      await base44.asServiceRole.entities.ATIPassport.update(passport.id, {
        data_conflict: dataConflict,
        data_confidence: confidence,
        data_conflict_fields: conflictFields,
        data_sources_matched: matched,
        integrity_checked_at: new Date().toISOString(),
      });
    }

    // ── Admin alert on newly detected conflict ──
    if (dataConflict && !passport.data_conflict) {
      const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' }, '', 5);
      for (const admin of admins) {
        if (!admin.email) continue;
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: admin.email,
          subject: `[ABOS Data Integrity] Conflict detected — ${reg}`,
          body: `The Data Integrity Shield detected conflicting data for aircraft ${reg}.\n\nConflicting fields: ${conflictFields.join(', ')}\nData confidence: ${confidence.toUpperCase()}\nSources checked: ${Object.keys(sources).join(', ') || 'none'}\n\nThe passport has been flagged "Unverified Data — Expert Review Recommended".\nReview it at /twin/${reg}\n\n— ABOS Data Integrity Shield`,
          from_name: 'ABOS Data Integrity Shield',
        });
      }
    }

    return Response.json({
      ok: true,
      registration: reg,
      data_confidence: confidence,
      data_conflict: dataConflict,
      conflict_fields: conflictFields,
      sources_checked: Object.keys(sources),
      sources_matched: matched,
      updated: !unchanged,
    });
  } catch (error) {
    console.error('dataIntegrityShield error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});