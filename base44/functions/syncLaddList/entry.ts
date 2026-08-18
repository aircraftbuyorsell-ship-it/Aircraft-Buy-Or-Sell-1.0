import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * syncLaddList — imports the FAA Limiting Aircraft Data Displayed (LADD)
 * "IndustryLADD" list into the LaddBlockList entity.
 *
 * IMPORTANT — why this is a manual-upload endpoint, not a live FAA fetch:
 * The authoritative IndustryLADD list is distributed only via the FAA's NAS
 * Aeronautical Data Exchange (ADX) portal (https://adx.faa.gov), which
 * requires a signed FAA Data Access User Agreement tied to an individual/org
 * FAA account. ABOS does not currently hold that agreement, so this function
 * cannot fetch the list itself. Once ABOS has ADX credentials, this function
 * can be extended to fetch directly (see the 'adx_import' source value,
 * reserved for that path) — until then, an admin downloads the monthly
 * "IndustryLADD" file from ADX and pastes/uploads it here.
 *
 * The FAA publishes a new IndustryLADD edition on the first Thursday of each
 * month. Re-run this sync each month against the fresh file.
 *
 * Body: { list_month: "2026-08", entries: "N12345\nN6789A\n..." }
 *   entries — newline/comma-separated N-numbers (with or without the "N"
 *   prefix; normalized on write), OR call signs prefixed "CS:" (e.g. "CS:N1XYZ").
 *
 * Retention rule (per FAA requirement — historical data must stay protected
 * even after an aircraft leaves the list): existing entries not present in
 * the new upload are marked active:false rather than deleted, and enforcement
 * checks should treat "ever seen in a LADD list" as a signal worth keeping
 * visible to admins, even though only active:true entries are enforced going
 * forward. Nothing is ever hard-deleted by this function.
 *
 * Admin-only. Dry-run by default — pass { confirm: true } to write.
 */

function normalizeNNumber(raw) {
  return String(raw || '')
    .trim()
    .toUpperCase()
    .replace(/^N/, '')
    .replace(/[^A-Z0-9]/g, '');
}

function parseEntries(raw) {
  const nNumbers = new Set();
  const callSigns = new Set();
  const tokens = String(raw || '')
    .split(/[\n,;\r\t]+/)
    .map((t) => t.trim())
    .filter(Boolean);
  for (const tok of tokens) {
    if (/^CS:/i.test(tok)) {
      const cs = tok.replace(/^CS:/i, '').trim().toUpperCase();
      if (cs) callSigns.add(cs);
    } else {
      const n = normalizeNNumber(tok);
      if (n) nNumbers.add(n);
    }
  }
  return { nNumbers: [...nNumbers], callSigns: [...callSigns] };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { list_month, entries, confirm } = await req.json().catch(() => ({}));

    if (!list_month || !/^\d{4}-\d{2}$/.test(list_month)) {
      return Response.json({ error: "list_month is required, format 'YYYY-MM' (e.g. '2026-08')." }, { status: 400 });
    }
    if (!entries || !String(entries).trim()) {
      return Response.json({ error: 'entries is required — paste the IndustryLADD list contents (N-numbers, one per line or comma-separated).' }, { status: 400 });
    }

    const { nNumbers, callSigns } = parseEntries(entries);
    if (nNumbers.length === 0 && callSigns.length === 0) {
      return Response.json({ error: 'No valid N-numbers or call signs found in entries.' }, { status: 400 });
    }

    // Existing active entries, to compute additions/removals for the report.
    const existing = await base44.asServiceRole.entities.LaddBlockList.filter({ active: true }, '-created_date', 5000);
    const existingSet = new Set(existing.map((e) => e.n_number));
    const newSet = new Set(nNumbers);

    const toAdd = nNumbers.filter((n) => !existingSet.has(n));
    const toKeep = nNumbers.filter((n) => existingSet.has(n));
    const toDeactivate = existing.filter((e) => !newSet.has(e.n_number));

    if (!confirm) {
      return Response.json({
        dryRun: true,
        list_month,
        parsed: { n_numbers: nNumbers.length, call_signs: callSigns.length },
        wouldAdd: toAdd.length,
        wouldKeep: toKeep.length,
        wouldDeactivate: toDeactivate.length,
        message: `Parsed ${nNumbers.length} N-number(s). Would add ${toAdd.length} new, keep ${toKeep.length} existing, deactivate ${toDeactivate.length} no longer listed. Re-run with { "confirm": true } to write.`,
      });
    }

    let created = 0;
    if (toAdd.length > 0) {
      await base44.asServiceRole.entities.LaddBlockList.bulkCreate(
        toAdd.map((n) => ({ n_number: n, list_month, source: 'manual_upload', active: true }))
      );
      created = toAdd.length;
    }

    let refreshed = 0;
    if (toKeep.length > 0) {
      const keepIds = existing.filter((e) => newSet.has(e.n_number)).map((e) => ({ id: e.id, list_month, active: true }));
      if (keepIds.length > 0) {
        await base44.asServiceRole.entities.LaddBlockList.bulkUpdate(keepIds);
        refreshed = keepIds.length;
      }
    }

    let deactivated = 0;
    if (toDeactivate.length > 0) {
      await base44.asServiceRole.entities.LaddBlockList.bulkUpdate(
        toDeactivate.map((e) => ({ id: e.id, active: false }))
      );
      deactivated = toDeactivate.length;
    }

    return Response.json({
      dryRun: false,
      list_month,
      created,
      refreshed,
      deactivated,
      totalActive: created + refreshed,
    });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
});
