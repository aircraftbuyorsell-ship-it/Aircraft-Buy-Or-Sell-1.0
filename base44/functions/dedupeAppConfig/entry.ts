import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * dedupeAppConfig — one-off / re-runnable cleanup for the AppConfig entity.
 *
 * A prior Save-mutation race condition on the Admin Settings page allowed
 * concurrent tabs/requests to each read an empty `configs` array and then
 * `create()` a fresh key:"global" row, producing multiple rows with the
 * same key. The write-path bug is fixed (AdminSettings.jsx now refuses to
 * write if the row wasn't loaded), but the duplicate rows already created
 * remain in the data and need a one-time cleanup. Safe to re-run — it is a
 * no-op once at most one row per key remains.
 *
 * For each duplicate key, keeps the single most-recently-updated row (the
 * one every engine and the admin panel actually reads via
 * `-created_date, 1` — ties broken by `updated_date` so the row with the
 * latest admin edit wins) and deletes the rest.
 *
 * Admin-only. Dry-run by default — pass { confirm: true } to actually delete.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { confirm } = await req.json().catch(() => ({}));

    const all = await base44.asServiceRole.entities.AppConfig.list('-created_date', 1000);

    const byKey = new Map();
    for (const row of all) {
      const key = row.key || '(no key)';
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key).push(row);
    }

    const report = [];
    const toDelete = [];

    for (const [key, rows] of byKey.entries()) {
      if (rows.length <= 1) continue;
      // Sort by updated_date desc (fallback created_date) — keep the newest edit.
      const sorted = [...rows].sort((a, b) => {
        const ta = new Date(a.updated_date || a.created_date).getTime();
        const tb = new Date(b.updated_date || b.created_date).getTime();
        return tb - ta;
      });
      const keep = sorted[0];
      const dupes = sorted.slice(1);
      report.push({
        key,
        totalRows: rows.length,
        keeping: { id: keep.id, updated_date: keep.updated_date, created_date: keep.created_date },
        deleting: dupes.map(d => ({ id: d.id, updated_date: d.updated_date, created_date: d.created_date })),
      });
      toDelete.push(...dupes.map(d => d.id));
    }

    if (!confirm) {
      return Response.json({
        dryRun: true,
        message: toDelete.length > 0
          ? `Found ${toDelete.length} duplicate row(s) across ${report.length} key(s). Re-run with { "confirm": true } to delete them.`
          : 'No duplicates found. Nothing to do.',
        report,
      });
    }

    let deleted = 0;
    const errors = [];
    for (const id of toDelete) {
      try {
        await base44.asServiceRole.entities.AppConfig.delete(id);
        deleted++;
      } catch (e) {
        errors.push({ id, error: e?.message || String(e) });
      }
    }

    return Response.json({
      dryRun: false,
      deleted,
      errors,
      report,
    });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
});
