import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Auto-scores aircraft from FAAAircraft database.
 * Creates AircraftListing records + computes deterministic ATI proxy score
 * from FAA metadata (no LLM needed — fast, cheap, scalable).
 *
 * Body: { batch_size?: number (default 50), offset?: number }
 */

// ATI proxy scoring from FAA metadata only (deterministic, no LLM)
function computeFAAATIProxy(faa) {
  let score = 0;

  // 1) Registration status (0-15): valid/active certificate
  const statusActive = faa.status_code === 'V'; // Valid
  score += statusActive ? 14 : faa.status_code === 'N' ? 8 : 3;

  // 2) Certificate age / freshness (0-15): recent cert_issue_date
  if (faa.cert_issue_date) {
    const issueYear = parseInt(String(faa.cert_issue_date).slice(0, 4));
    const age = new Date().getFullYear() - issueYear;
    score += age <= 3 ? 14 : age <= 7 ? 11 : age <= 15 ? 8 : 5;
  } else {
    score += 3;
  }

  // 3) Aircraft age / manufacture year (0-15)
  if (faa.year_mfr) {
    const acAge = new Date().getFullYear() - faa.year_mfr;
    score += acAge <= 5 ? 15 : acAge <= 15 ? 12 : acAge <= 25 ? 9 : acAge <= 40 ? 6 : 4;
  } else {
    score += 4;
  }

  // 4) Mode-S hex (ADS-B equipped) (0-15)
  score += faa.mode_s_hex ? 13 : 5;

  // 5) Owner type clarity (0-15): individual vs corporation vs LLC
  const regType = faa.type_registrant;
  score += regType === '1' ? 13  // individual
    : regType === '2' ? 12         // partnership
    : regType === '3' ? 11         // corporation
    : regType === '4' ? 14         // co-owned
    : regType === '8' ? 10         // LLC
    : 6;

  // 6) Expiration date (0-15): not expired
  if (faa.expiration_date) {
    const expYear = parseInt(String(faa.expiration_date).slice(0, 4));
    const expMonth = parseInt(String(faa.expiration_date).slice(4, 6)) - 1;
    const expDate = new Date(expYear, expMonth, 1);
    const monthsLeft = (expDate - new Date()) / (1000 * 60 * 60 * 24 * 30);
    score += monthsLeft > 18 ? 14 : monthsLeft > 6 ? 11 : monthsLeft > 0 ? 7 : 2;
  } else {
    score += 5;
  }

  // 7) Fractional ownership flag (0-15)
  score += faa.fract_owner === 'Y' ? 8 : 13;

  // 8) Airworthiness certificate age (0-15)
  if (faa.air_worth_date) {
    const awYear = parseInt(String(faa.air_worth_date).slice(0, 4));
    const awAge = new Date().getFullYear() - awYear;
    score += awAge <= 5 ? 14 : awAge <= 15 ? 11 : awAge <= 30 ? 8 : 5;
  } else {
    score += 4;
  }

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

function dealLabelFromScore(score) {
  if (score == null) return null;
  if (score >= 8.5) return "hot deal";
  if (score >= 6.5) return "good deal";
  if (score >= 5.0) return "fair";
  return "overpriced";
}

// Map FAA type_aircraft code to category
function faaTypeToCategory(code) {
  const map = { '1': 'Glider', '2': 'Balloon', '3': 'Blimp', '4': 'Fixed Wing Single', '5': 'Fixed Wing Multi', '6': 'Rotorcraft', '7': 'Weight-Shift', '8': 'Powered Parachute', '9': 'Gyroplane' };
  return map[String(code)] || 'Unknown';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const batchSize = Math.min(body.batch_size || 50, 200);
    const offset = body.offset || 0;

    // Fetch FAA aircraft batch
    const faaRecords = await base44.asServiceRole.entities.FAAAircraft.list('-created_date', batchSize + offset);
    const batch = faaRecords.slice(offset, offset + batchSize);

    if (batch.length === 0) {
      return Response.json({ ok: true, processed: 0, created: 0, updated: 0, message: 'No FAA records found' });
    }

    let created = 0, updated = 0, errors = 0;
    const results = [];

    for (const faa of batch) {
      const nNumber = `N${faa.n_number}`.toUpperCase().replace(/\s/g, '');

      // Check if listing already exists
      const existing = await base44.asServiceRole.entities.AircraftListing.filter(
        { registration: nNumber }, '-created_date', 1
      );

      const atiScore = computeFAAATIProxy(faa);
      const scoreLabel = labelFromTotal(atiScore);

      // Simple OMVM proxy based on age + type
      const age = faa.year_mfr ? new Date().getFullYear() - faa.year_mfr : 30;
      const baseValue = 80000 * Math.exp(-0.03 * age); // ~$80k base, 3% annual depreciation
      const omvmValue = Math.max(8000, Math.round(baseValue / 1000) * 1000);

      const listingData = {
        registration: nNumber,
        make: faa.name ? faa.name.split(' ').slice(0, 2).join(' ') : 'Unknown',
        model: faa.mfr_mdl_code || 'Unknown',
        year: faa.year_mfr || null,
        ati_score: atiScore,
        omvm_value: omvmValue,
        status: 'active',
        visibility: 'public',
        ai_summary: `FAA auto-scored. Registration: ${nNumber}. Status: ${faa.status_code}. ${faaTypeToCategory(faa.type_aircraft)} aircraft manufactured ${faa.year_mfr || 'unknown year'}.`,
      };

      if (existing.length > 0) {
        // Only update ATI if not already manually scored
        const curr = existing[0];
        if (!curr.ati_score || curr.ati_score === 0) {
          await base44.asServiceRole.entities.AircraftListing.update(curr.id, {
            ati_score: atiScore,
            omvm_value: omvmValue,
          });
          updated++;
        } else {
          updated++; // already has manual ATI, skip
        }
        results.push({ n_number: nNumber, action: 'updated', ati: atiScore, id: curr.id });
      } else {
        const newListing = await base44.asServiceRole.entities.AircraftListing.create(listingData);
        created++;
        results.push({ n_number: nNumber, action: 'created', ati: atiScore, id: newListing.id });
      }
    }

    return Response.json({
      ok: true,
      processed: batch.length,
      created,
      updated,
      errors,
      total_faa_records: faaRecords.length,
      next_offset: offset + batchSize,
      has_more: (offset + batchSize) < faaRecords.length,
      sample: results.slice(0, 5),
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});