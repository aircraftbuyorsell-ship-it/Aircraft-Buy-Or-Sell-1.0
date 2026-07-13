import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const SOURCE_URL = 'https://www.faa.gov/licenses_certificates/airmen_certification/releasable_airmen_download';
const PROJECT_NAME = 'IntraZone';

function toIsoDate(value) {
  const date = new Date(`${value} 00:00:00 UTC`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['admin', 'super_admin'].includes(user.role)) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const pageResponse = await fetch(SOURCE_URL, {
      headers: { 'User-Agent': 'ABOS-IntraZone/1.0 (FAA data release monitor)', Accept: 'text/html,application/xhtml+xml' },
      signal: AbortSignal.timeout(20000),
    });
    if (!pageResponse.ok) return Response.json({ error: 'FAA release page unavailable' }, { status: 502 });
    const html = await pageResponse.text();
    const text = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/\s+/g, ' ');
    const dates = text.match(/Airman Downloadable Database Dates\s+Upload Date\s+([A-Za-z]+ \d{1,2}, \d{4})\s+Next Upload Date\s+([A-Za-z]+ \d{1,2}, \d{4})/i);
    const download = html.match(/https:\/\/registry\.faa\.gov\/database\/CS\d{6}\.zip/i);
    if (!dates) return Response.json({ error: 'FAA release dates could not be parsed' }, { status: 502 });

    const uploadDate = toIsoDate(dates[1]);
    const nextUploadDate = toIsoDate(dates[2]);
    const downloadUrl = download?.[0] || null;

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('supabase');
    const projectsResponse = await fetch('https://api.supabase.com/v1/projects', { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!projectsResponse.ok) return Response.json({ error: 'IntraZone audit unavailable' }, { status: 502 });
    const projects = await projectsResponse.json();
    const project = projects.find((item) => String(item.name || '').toLowerCase() === PROJECT_NAME.toLowerCase());
    if (!project) return Response.json({ error: 'IntraZone project not found' }, { status: 502 });

    const auditResponse = await fetch(`https://api.supabase.com/v1/projects/${project.id}/database/query/read-only`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: "select id,upload_date,status,certificate_count,completed_at from faa_airman.import_runs where status='succeeded' order by upload_date desc limit 1" }),
    });
    if (!auditResponse.ok) return Response.json({ error: 'Airman import audit unavailable' }, { status: 502 });
    const auditRows = await auditResponse.json();
    const latestAudit = auditRows[0] || null;
    const imported = Boolean(latestAudit && latestAudit.upload_date >= uploadDate);

    const monitors = await base44.asServiceRole.entities.AirmanReleaseMonitor.list('-updated_date', 1);
    const monitor = monitors[0] || null;
    const shouldNotify = !imported && monitor?.last_notified_upload_date !== uploadDate;
    const checkedAt = new Date().toISOString();
    const monitorData = {
      source_url: SOURCE_URL,
      latest_upload_date: uploadDate,
      next_upload_date: nextUploadDate,
      download_url: downloadUrl,
      import_status: imported ? 'imported' : 'pending',
      last_import_run_id: latestAudit?.id || null,
      last_notified_upload_date: shouldNotify ? uploadDate : monitor?.last_notified_upload_date || null,
      checked_at: checkedAt,
    };

    if (monitor) await base44.asServiceRole.entities.AirmanReleaseMonitor.update(monitor.id, monitorData);
    else await base44.asServiceRole.entities.AirmanReleaseMonitor.create(monitorData);

    if (shouldNotify) {
      const users = await base44.asServiceRole.entities.User.list();
      const admins = users.filter((item) => ['admin', 'super_admin'].includes(item.role) && item.email);
      await Promise.all(admins.map((admin) => base44.asServiceRole.integrations.Core.SendEmail({
        to: admin.email,
        from_name: 'ABOS IntraZone',
        subject: `Nový FAA Airman snapshot: ${uploadDate}`,
        body: `FAA zveřejnila nový Airman snapshot (${uploadDate}). Soukromý IntraZone registr zatím obsahuje snapshot ${latestAudit?.upload_date || 'bez dokončeného importu'}. Zdroj: ${SOURCE_URL}${downloadUrl ? `\nCSV balíček: ${downloadUrl}` : ''}`,
      })));
    }

    return Response.json({ upload_date: uploadDate, next_upload_date: nextUploadDate, import_status: imported ? 'imported' : 'pending', latest_import: latestAudit, notified: shouldNotify, checked_at: checkedAt });
  } catch (error) {
    return Response.json({ error: error.message || String(error) }, { status: 500 });
  }
});