import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { createClient } from 'npm:@supabase/supabase-js@2';

const FAA_ZIP_URL = 'https://registry.faa.gov/database/ReleasableAircraft.zip';
const SOURCE_FILE = 'MASTER.txt';
const DEFAULT_BATCH_SIZE = 2000;
const DEFAULT_MAX_ROWS = 10000;

const errToStr = (e: unknown) => {
  if (e == null) return 'Unknown error';
  if (typeof e === 'string') return e;
  if (e instanceof Error) return e.message;
  try { return JSON.stringify(e); } catch { return String(e); }
};

const clean = (v: unknown) => String(v ?? '').trim() || null;

const parseIntOrNull = (v: unknown) => {
  const s = clean(v);
  if (!s) return null;
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
};

const parseDate = (v: unknown) => {
  const s = clean(v);
  if (!s) return null;
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[1]}-${m[2]}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return null;
};

// MASTER.txt is comma-delimited. This parser handles quoted commas and escaped quotes.
const parseCsvLine = (line: string): string[] => {
  const out: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (quoted && line[i + 1] === '"') { field += '"'; i++; }
      else quoted = !quoted;
    } else if (c === ',' && !quoted) {
      out.push(field);
      field = '';
    } else {
      field += c;
    }
  }
  out.push(field);
  return out;
};

// Read the ZIP central directory and return the compressed payload for one entry.
// This avoids extracting the complete 400MB+ release package into memory.
const getZipEntry = (zip: Uint8Array, wantedName: string) => {
  const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  const min = Math.max(0, zip.length - 0x10000 - 22);
  let eocd = -1;
  for (let i = zip.length - 22; i >= min; i--) {
    if (view.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('FAA ZIP: end-of-central-directory record not found');

  const cdSize = view.getUint32(eocd + 12, true);
  const cdOffset = view.getUint32(eocd + 16, true);
  const decoder = new TextDecoder();
  let p = cdOffset;
  const end = cdOffset + cdSize;

  while (p < end) {
    if (view.getUint32(p, true) !== 0x02014b50) break;
    const method = view.getUint16(p + 10, true);
    const compressedSize = view.getUint32(p + 20, true);
    const fileNameLength = view.getUint16(p + 28, true);
    const extraLength = view.getUint16(p + 30, true);
    const commentLength = view.getUint16(p + 32, true);
    const localOffset = view.getUint32(p + 42, true);
    const name = decoder.decode(zip.subarray(p + 46, p + 46 + fileNameLength));

    if (name === wantedName) {
      const local = localOffset;
      if (view.getUint32(local, true) !== 0x04034b50) throw new Error('FAA ZIP: invalid local file header');
      const localNameLength = view.getUint16(local + 26, true);
      const localExtraLength = view.getUint16(local + 28, true);
      const dataStart = local + 30 + localNameLength + localExtraLength;
      const compressed = zip.subarray(dataStart, dataStart + compressedSize);
      return { method, compressed };
    }
    p += 46 + fileNameLength + extraLength + commentLength;
  }
  throw new Error(`FAA ZIP: ${wantedName} not found`);
};

const decompressDeflateRaw = async (compressed: Uint8Array) => {
  const ds = new DecompressionStream('deflate-raw');
  const stream = new Blob([compressed]).stream().pipeThrough(ds);
  return stream;
};

const makeRow = (f: string[], importBatch: string) => {
  const n = clean(f[0]);
  if (!n || !/^N[A-Z0-9]+$/.test(n)) return null;

  const otherNames = [24, 25, 26, 27, 28]
    .map(i => clean(f[i]))
    .filter(Boolean);

  return {
    n_number: n,
    serial_number: clean(f[1]),
    mfr_mdl_code: clean(f[2]),
    eng_mfr_mdl: clean(f[3]),
    year_mfr: parseIntOrNull(f[4]),
    type_registrant: clean(f[5]),
    name: clean(f[6]),
    street: [clean(f[7]), clean(f[8])].filter(Boolean).join(' ') || null,
    city: clean(f[9]),
    state: clean(f[10]),
    zip_code: clean(f[11]),
    country: clean(f[14]) || 'US',
    last_action_date: parseDate(f[15]),
    cert_issue_date: parseDate(f[16]),
    certification: clean(f[17]),
    type_aircraft: clean(f[18]),
    type_engine: clean(f[19]),
    status_code: clean(f[20]),
    mode_s_code: clean(f[21]),
    mode_s_code_hex: clean(f[33]),
    air_worth_date: parseDate(f[23]),
    expiration_date: parseDate(f[29]),
    fract_owner: clean(f[22]),
    kit_mfr: clean(f[31]),
    kit_model: clean(f[32]),
    other_names: otherNames,
    // Keep only source fields not represented by first-class columns.
    raw_row: {
      unique_id: clean(f[30]),
      region: clean(f[12]),
      county: clean(f[13]),
      source_file: SOURCE_FILE,
    },
    import_batch: importBatch,
    imported_at: new Date().toISOString(),
  };
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL');
    const publishableKey = Deno.env.get('VITE_SUPABASE_PUBLISHABLE_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !publishableKey) {
      return Response.json({ error: 'Supabase credentials not configured' }, { status: 500 });
    }
    if (!serviceRoleKey) {
      return Response.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is required for FAA ingestion because faa_registry has RLS enabled.' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const payload = await req.json().catch(() => ({}));
    const startRow = Math.max(0, Number(payload.startRow ?? 0));
    const maxRows = Math.min(Math.max(1, Number(payload.maxRows ?? DEFAULT_MAX_ROWS)), 25000);
    const batchSize = Math.min(Math.max(100, Number(payload.batchSize ?? DEFAULT_BATCH_SIZE)), 5000);
    const dryRun = Boolean(payload.dryRun);
    const importBatch = String(payload.importBatch || `faa-${new Date().toISOString().replace(/[-:.TZ]/g, '')}`);

    const startedAt = new Date().toISOString();
    const { data: run, error: runError } = await supabase
      .from('faa_registry_import_runs')
      .insert({
        source_url: FAA_ZIP_URL,
        source_file: SOURCE_FILE,
        status: 'running',
        offset_rows: startRow,
        batch_size: batchSize,
        metadata: { dryRun, requested_max_rows: maxRows, import_batch: importBatch },
      })
      .select('id')
      .single();
    if (runError) throw new Error(`Cannot create import run: ${runError.message}`);

    const response = await fetch(FAA_ZIP_URL, {
      headers: {
        'User-Agent': 'ABOS FAA Registry Importer/1.0',
        'Accept': 'application/zip,application/octet-stream;q=0.9,*/*;q=0.8',
      },
    });
    if (!response.ok) throw new Error(`FAA download failed: HTTP ${response.status}`);
    const zip = new Uint8Array(await response.arrayBuffer());
    const entry = getZipEntry(zip, SOURCE_FILE);
    if (entry.method !== 8 && entry.method !== 0) throw new Error(`Unsupported ZIP compression method ${entry.method}`);

    const stream = entry.method === 8 ? await decompressDeflateRaw(entry.compressed) : new Blob([entry.compressed]).stream();
    const reader = stream.pipeThrough(new TextDecoderStream('windows-1252')).getReader();

    let buffer = '';
    let rowIndex = -1;
    let seen = 0;
    let valid = 0;
    let rejected = 0;
    let upserted = 0;
    let headerSkipped = false;
    let batch: Record<string, unknown>[] = [];
    let exhausted = false;

    const flush = async () => {
      if (!batch.length || dryRun) {
        batch = [];
        return;
      }
      const { error } = await supabase.from('faa_registry').upsert(batch, { onConflict: 'n_number' });
      if (error) throw new Error(`faa_registry upsert failed after row ${rowIndex}: ${error.message}`);
      upserted += batch.length;
      batch = [];
    };

    const processLine = async (line: string) => {
      if (!headerSkipped) {
        headerSkipped = true;
        return;
      }
      rowIndex++;
      if (rowIndex < startRow) return;
      if (seen >= maxRows) { exhausted = true; return; }
      if (!line.trim()) return;
      seen++;
      const fields = parseCsvLine(line);
      const row = makeRow(fields, importBatch);
      if (!row) { rejected++; return; }
      valid++;
      batch.push(row);
      if (batch.length >= batchSize) await flush();
    };

    while (!exhausted) {
      const { value, done } = await reader.read();
      if (done) {
        buffer += '';
        if (buffer) await processLine(buffer.replace(/\r$/, ''));
        exhausted = true;
        break;
      }
      buffer += value;
      let newline = buffer.indexOf('\n');
      while (newline >= 0 && !exhausted) {
        const line = buffer.slice(0, newline).replace(/\r$/, '');
        buffer = buffer.slice(newline + 1);
        await processLine(line);
        newline = buffer.indexOf('\n');
      }
    }
    await flush();
    reader.releaseLock();

    const nextOffset = startRow + seen;
    const completed = exhausted && seen < maxRows;
    const status = completed ? 'succeeded' : 'partial';
    const finishedAt = new Date().toISOString();

    await supabase.from('faa_registry_import_runs').update({
      status,
      rows_seen: seen,
      rows_upserted: upserted,
      rows_rejected: rejected,
      offset_rows: nextOffset,
      completed_at: completed ? finishedAt : null,
      metadata: {
        dryRun,
        requested_max_rows: maxRows,
        import_batch: importBatch,
        valid_rows: valid,
        zip_bytes: zip.byteLength,
        source_file: SOURCE_FILE,
        started_at: startedAt,
      },
    }).eq('id', run.id);

    return Response.json({
      ok: true,
      source: 'FAA ReleasableAircraft.zip / MASTER.txt',
      dryRun,
      importBatch,
      startRow,
      nextOffset,
      rowsSeen: seen,
      rowsValid: valid,
      rowsRejected: rejected,
      rowsUpserted: upserted,
      completed,
      status,
      runId: run.id,
      timestamp: finishedAt,
      message: completed
        ? 'FAA MASTER import reached end of source file.'
        : `Chunk imported. Continue from row ${nextOffset}.`,
    });
  } catch (error) {
    return Response.json({ error: errToStr(error) }, { status: 500 });
  }
});
