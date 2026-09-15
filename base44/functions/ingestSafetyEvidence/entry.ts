import { createClientFromRequest } from 'npm:@base44/sdk@0.8.48';
import { normalizeRegistration, supabaseRest } from '../_shared/aircraftTwin.ts';

const FAA_SDR_BASE = 'https://external.apic4e.faa.gov/sdrs/retrieve/SDR-';

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') { cell += '"'; i++; }
      else quoted = !quoted;
    } else if (c === ',' && !quoted) {
      row.push(cell); cell = '';
    } else if ((c === '\n' || c === '\r') && !quoted) {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some((v) => v.trim() !== '')) rows.push(row);
      row = [];
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); if (row.some((v) => v.trim() !== '')) rows.push(row); }
  return rows;
}

function keyOf(value: unknown) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
}

function findColumn(headers: string[], names: string[]) {
  const normalized = headers.map(keyOf);
  for (const name of names) {
    const i = normalized.indexOf(keyOf(name));
    if (i >= 0) return i;
  }
  return -1;
}

function parseDate(value: unknown) {
  const s = String(value || '').trim();
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const source = String(body.source || '').toLowerCase();

    if (source === 'faa_sdr') {
      const year = Number(body.year || new Date().getUTCFullYear());
      if (!Number.isInteger(year) || year < 1995 || year > new Date().getUTCFullYear()) {
        return Response.json({ error: 'year must be between 1995 and current year' }, { status: 400 });
      }
      const sourceUrl = `${FAA_SDR_BASE}${year}.csv`;
      const response = await fetch(sourceUrl);
      if (!response.ok) throw new Error(`FAA SDR download failed (${response.status})`);
      const text = await response.text();
      const rows = parseCsv(text);
      if (rows.length < 2) return Response.json({ ok: true, source, year, imported: 0, source_url: sourceUrl });

      const headers = rows[0];
      const regIndex = findColumn(headers, ['Registration', 'Registration #', 'Registration Number', 'Aircraft Registration']);
      if (regIndex < 0) throw new Error('FAA SDR CSV registration column not found');
      const controlIndex = findColumn(headers, ['Unique Control #', 'Unique Control Number', 'Control Number']);
      const dateIndex = findColumn(headers, ['Difficulty Date', 'Date of Difficulty', 'DifficultyDate']);
      const submitterIndex = findColumn(headers, ['Submitter Type']);
      const makeIndex = findColumn(headers, ['Make']);
      const modelIndex = findColumn(headers, ['Model']);
      const componentIndex = findColumn(headers, ['Component', 'Specific Part or Structure Causing Difficulty']);
      const descriptionIndex = findColumn(headers, ['Description', 'Description of Difficulty']);

      const records = [];
      for (const values of rows.slice(1)) {
        const raw = Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']));
        const regRaw = String(values[regIndex] || '').trim().toUpperCase();
        if (!regRaw) continue;
        const registration = regRaw.startsWith('N') ? regRaw : `N${regRaw}`;
        records.push({
          control_number: controlIndex >= 0 ? String(values[controlIndex] || '').trim() : null,
          registration: normalizeRegistration(registration),
          difficulty_date: dateIndex >= 0 ? parseDate(values[dateIndex]) : null,
          submitter_type: submitterIndex >= 0 ? String(values[submitterIndex] || '').trim() : null,
          make: makeIndex >= 0 ? String(values[makeIndex] || '').trim() : null,
          model: modelIndex >= 0 ? String(values[modelIndex] || '').trim() : null,
          component: componentIndex >= 0 ? String(values[componentIndex] || '').trim() : null,
          description: descriptionIndex >= 0 ? String(values[descriptionIndex] || '').trim() : null,
          source_year: year,
          source_url: sourceUrl,
          raw,
        });
      }

      let imported = 0;
      for (let i = 0; i < records.length; i += 250) {
        const batch = records.slice(i, i + 250);
        await supabaseRest('abos_faa_sdr?on_conflict=control_number,registration', {
          method: 'POST',
          headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
          body: JSON.stringify(batch),
        });
        imported += batch.length;
      }
      return Response.json({ ok: true, source, year, imported, source_url: sourceUrl });
    }

    if (source === 'ntsb') {
      // NTSB's current Enterprise API requires portal access. This ingestion endpoint
      // accepts normalized records from the official API or official CAROL export.
      const input = Array.isArray(body.records) ? body.records : [];
      if (!input.length) return Response.json({ error: 'records[] required for NTSB ingestion' }, { status: 400 });
      const records = input.map((item) => {
        const registration = normalizeRegistration(item.registration || item.Registration);
        return {
          case_number: String(item.case_number || item.NTSBNumber || item.NTSB_Number || '').trim() || null,
          registration,
          event_date: parseDate(item.event_date || item.EventDate),
          event_type: item.event_type || item.EventType || null,
          damage: item.damage || item.Damage || null,
          make: item.make || item.Make || null,
          model: item.model || item.Model || null,
          city: item.city || item.City || null,
          state: item.state || item.State || null,
          country: item.country || item.Country || null,
          synopsis: item.synopsis || item.Synopsis || null,
          source_url: item.source_url || NTSB_SOURCE,
          source_updated_at: new Date().toISOString(),
          raw: item,
        };
      }).filter((r) => r.registration);

      for (let i = 0; i < records.length; i += 250) {
        await supabaseRest('abos_ntsb_aviation_cases?on_conflict=case_number,registration', {
          method: 'POST',
          headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
          body: JSON.stringify(records.slice(i, i + 250)),
        });
      }
      return Response.json({ ok: true, source, imported: records.length, source: 'NTSB official API/CAROL export' });
    }

    return Response.json({ error: 'source must be faa_sdr or ntsb' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 500 });
  }
});

const NTSB_SOURCE = 'https://www.ntsb.gov/Pages/AviationQueryV2.aspx';
