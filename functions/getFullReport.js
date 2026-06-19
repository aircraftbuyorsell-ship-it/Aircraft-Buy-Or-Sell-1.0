import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { nNumber, apiKey } = await req.json();
    
    if (!nNumber || typeof nNumber !== 'string') {
      return Response.json({ error: 'nNumber is required' }, { status: 400 });
    }
    if (!apiKey || typeof apiKey !== 'string') {
      return Response.json({ error: 'apiKey is required' }, { status: 400 });
    }

    const cleanN = nNumber.toUpperCase().replace(/[^A-Z0-9]/g, '').trim();

    // 1. Validate API key against Partner entity
    const partners = await base44.asServiceRole.entities.Partner.filter({ api_key: apiKey, status: 'active' });
    
    if (!partners || partners.length === 0) {
      await base44.asServiceRole.entities.APIUsageLog.create({
        partner_id: 'unknown',
        n_number: cleanN,
        endpoint: 'getFullReport',
        status: 'invalid_key',
        timestamp: new Date().toISOString()
      });
      return Response.json({ error: 'Invalid API key' }, { status: 401 });
    }

    const partner = partners[0];
    const partnerId = partner.id;

    // 2. Check rate limiting
    const dailyLimit = partner.daily_limit || 100;
    const callsToday = partner.calls_today || 0;

    if (callsToday >= dailyLimit) {
      await base44.asServiceRole.entities.APIUsageLog.create({
        partner_id: partnerId,
        n_number: cleanN,
        endpoint: 'getFullReport',
        status: 'rate_limited',
        timestamp: new Date().toISOString()
      });
      return Response.json({
        error: 'Daily rate limit exceeded',
        limit: dailyLimit,
        calls_today: callsToday,
        plan: partner.plan
      }, { status: 429 });
    }

    // 3. Increment calls_today
    await base44.asServiceRole.entities.Partner.update(partnerId, {
      calls_today: callsToday + 1
    });

    // 4. Fetch all data sources in parallel
    const results = await Promise.allSettled([
      fetchFAARegistration(cleanN),
      fetchNTSBAccidents(cleanN),
      fetchAirworthinessCertificate(cleanN),
      fetchAirworthinessDirectives(cleanN),
      fetchServiceDifficultyReports(cleanN),
      fetchSTCs(cleanN),
      fetchServiceBulletins(cleanN),
      fetchEngineDatabase(cleanN),
    ]);

    const sourceNames = [
      'getFAARegistration', 'getNTSBAccidents', 'getAirworthinessCertificate',
      'getAirworthinessDirectives', 'getServiceDifficultyReports', 'getSTCs',
      'getServiceBulletins', 'getEngineDatabase'
    ];

    // 5. Merge results into unified report
    const report = {
      n_number: cleanN,
      generated_at: new Date().toISOString(),
      partner: {
        id: partnerId,
        name: partner.name,
        plan: partner.plan
      },
      sections: {}
    };

    sourceNames.forEach((source, index) => {
      const result = results[index];
      if (result.status === 'fulfilled') {
        report.sections[source] = result.value;
      } else {
        report.sections[source] = {
          source,
          data: null,
          fetched_at: new Date().toISOString(),
          status: 'error',
          error: result.reason?.message || 'Unknown error'
        };
      }
    });

    // 6. Log the successful request
    await base44.asServiceRole.entities.APIUsageLog.create({
      partner_id: partnerId,
      n_number: cleanN,
      endpoint: 'getFullReport',
      status: 'success',
      timestamp: new Date().toISOString()
    });

    // 7. Return the full report
    return Response.json(report);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// ── FAA CSV lookup (shared ZIP download + parse) ──

const FAA_ZIP_URL = 'https://registry.faa.gov/database/ReleasableAircraft.zip';

let _csvCache = null;

async function getMasterCSV() {
  if (_csvCache) return _csvCache;

  const zipRes = await fetch(FAA_ZIP_URL, {
    headers: { 'User-Agent': 'ANYAIR/1.0 (aviation data platform)', 'Accept': '*/*' }
  });
  if (!zipRes.ok) throw new Error(`FAA ZIP download failed: ${zipRes.status}`);

  const zipBuffer = await zipRes.arrayBuffer();
  const bytes = new Uint8Array(zipBuffer);

  const entry = findZipEntry(bytes, 'MASTER.txt');
  if (!entry) throw new Error('MASTER.txt not found in FAA ZIP');

  const csvText = await decompressZipEntry(bytes, entry);
  _csvCache = csvText;
  return csvText;
}

function findZipEntry(bytes, targetName) {
  let offset = 0;
  const len = bytes.length;

  while (offset < len - 30) {
    if (bytes[offset] === 0x50 && bytes[offset+1] === 0x4b && bytes[offset+2] === 0x03 && bytes[offset+3] === 0x04) {
      const method = bytes[offset+8] | (bytes[offset+9] << 8);
      const compSize = bytes[offset+18] | (bytes[offset+19] << 8) | (bytes[offset+20] << 16) | (bytes[offset+21] << 24);
      const uncompSize = bytes[offset+22] | (bytes[offset+23] << 8) | (bytes[offset+24] << 16) | (bytes[offset+25] << 24);
      const nameLen = bytes[offset+26] | (bytes[offset+27] << 8);
      const extraLen = bytes[offset+28] | (bytes[offset+29] << 8);

      const nameStart = offset + 30;
      const name = new TextDecoder().decode(bytes.slice(nameStart, nameStart + nameLen));

      if (name === targetName || name.endsWith('/' + targetName)) {
        const dataStart = nameStart + nameLen + extraLen;
        const actualCompSize = compSize > 0 ? compSize : scanToNextPK(bytes, dataStart) - dataStart;
        return { offset: dataStart, compressedSize: actualCompSize, method, uncompressedSize: uncompSize };
      }

      const dataStart = nameStart + nameLen + extraLen;
      offset = compSize > 0 ? dataStart + compSize : scanToNextPK(bytes, dataStart);
    } else {
      offset++;
    }
  }
  return null;
}

function scanToNextPK(bytes, start) {
  for (let i = start; i < bytes.length - 4; i++) {
    if (bytes[i] === 0x50 && bytes[i+1] === 0x4b) return i;
  }
  return bytes.length;
}

async function decompressZipEntry(bytes, entry) {
  const data = bytes.slice(entry.offset, entry.offset + entry.compressedSize);
  if (entry.method === 0) return new TextDecoder().decode(data);
  if (entry.method === 8) {
    const ds = new DecompressionStream('deflate-raw');
    const writer = ds.writable.getWriter();
    const reader = ds.readable.getReader();
    writer.write(data);
    writer.close();
    const chunks = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    const totalLen = chunks.reduce((s, c) => s + c.length, 0);
    const result = new Uint8Array(totalLen);
    let pos = 0;
    for (const chunk of chunks) { result.set(chunk, pos); pos += chunk.length; }
    return new TextDecoder().decode(result);
  }
  throw new Error(`Unsupported ZIP compression method: ${entry.method}`);
}

async function fetchFAARegistration(nNumber) {
  const csvText = await getMasterCSV();
  const lines = csvText.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) throw new Error('Empty FAA CSV');

  const header = parseCSVLine(lines[0]);
  const colIndex = {};
  header.forEach((col, i) => { colIndex[col.trim().toLowerCase()] = i; });

  const nNumberCol = colIndex['n-number'] ?? colIndex['n_number'] ?? colIndex['nnumber'];
  if (nNumberCol === undefined) throw new Error('N-Number column not found in FAA CSV');

  // FAA CSV stores N-numbers without the "N" prefix
  const searchN = nNumber.startsWith('N') ? nNumber.slice(1) : nNumber;

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    const rowN = (fields[nNumberCol] || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (rowN === searchN) {
      return {
        source: 'faa_registry',
        data: mapCSVRowToData(fields, colIndex, nNumber.startsWith('N') ? nNumber : 'N' + nNumber),
        fetched_at: new Date().toISOString(),
        status: 'success'
      };
    }
  }
  return { source: 'faa_registry', data: null, fetched_at: new Date().toISOString(), status: 'data_unavailable' };
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i+1] === '"') { current += '"'; i++; }
        else { inQuotes = false; }
      } else { current += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { result.push(current.trim()); current = ''; }
      else { current += ch; }
    }
  }
  result.push(current.trim());
  return result;
}

function mapCSVRowToData(fields, colIndex, nNumber) {
  const get = (names) => {
    for (const n of names) {
      const idx = colIndex[n];
      if (idx !== undefined && fields[idx] && fields[idx].trim()) return fields[idx].trim();
    }
    return null;
  };
  return {
    n_number: nNumber,
    manufacturer: get(['mfr mdl code', 'manufacturer']),
    model: get(['mfr mdl code', 'model']),
    serial_number: get(['serial number', 'serial_no']),
    year: get(['year mfr', 'year_mfr', 'year']),
    engine_type: get(['eng mfr mdl', 'type engine', 'engine_type', 'type_engine']),
    aircraft_type: get(['type aircraft', 'aircraft_type', 'type_aircraft']),
    owner_name: get(['name', 'owner_name']),
    owner_city: get(['city', 'owner_city']),
    owner_state: get(['state', 'owner_state']),
    status: get(['status code', 'status', 'status_code']),
    airworthiness_date: get(['air worth date', 'airworthiness_date', 'air_worth_date']),
    last_action_date: get(['last act date', 'last_action_date', 'last_act_date']),
    certificate_issue_date: get(['cert issue date', 'certificate_issue_date', 'cert_issue_date']),
    expiration_date: get(['expiration date', 'expiration_date'])
  };
}

async function fetchNTSBAccidents(nNumber) {
  try {
    const url = `https://www.ntsb.gov/_layouts/ntsb.aviation/Results.aspx?query=nNumber:${encodeURIComponent(nNumber)}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'NAircraft/1.0', 'Accept': 'text/html' } });
    const html = await res.text();
    const accidents = parseNTSB(html, nNumber);
    return { source: 'ntsb_accidents', data: { n_number: nNumber, total_records: accidents.length, accidents }, fetched_at: new Date().toISOString(), status: 'success' };
  } catch (e) {
    return { source: 'ntsb_accidents', data: { n_number: nNumber, total_records: 0, accidents: [] }, fetched_at: new Date().toISOString(), status: 'data_unavailable' };
  }
}

async function fetchAirworthinessCertificate(nNumber) {
  const url = `https://registry.faa.gov/AircraftInquiry/Search/NNumberResult?nNumberTxt=${nNumber}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'NAircraft/1.0', 'Accept': 'text/html' } });
  if (!res.ok) throw new Error(`FAA returned ${res.status}`);
  const html = await res.text();
  return {
    source: 'faa_certificate',
    data: {
      n_number: nNumber,
      airworthiness_classification: extractFAA(html, 'Classification'),
      category: extractFAA(html, 'Category'),
      airworthiness_date: extractFAA(html, 'Airworthiness Date'),
      certificate_issue_date: extractFAA(html, 'Certificate Issue Date'),
      expiration_date: extractFAA(html, 'Expiration Date'),
      type_certificate: extractFAA(html, 'Type Certificate'),
      approved_operations: extractFAA(html, 'Approved Operations'),
      status: extractFAA(html, 'Status'),
      mode_s_code: extractFAA(html, 'Mode S Code')
    },
    fetched_at: new Date().toISOString(),
    status: 'success'
  };
}

async function fetchAirworthinessDirectives(nNumber) {
  let make = null, model = null;
  try {
    const reg = await fetchFAARegistration(nNumber);
    make = reg.data.manufacturer;
    model = reg.data.model;
  } catch (_) {}
  
  const ads = [];
  if (make && model) {
    try {
      const url = `https://drs.faa.gov/browse/search?q=${encodeURIComponent(make + ' ' + model)}&documentType=AD`;
      const res = await fetch(url, { headers: { 'User-Agent': 'NAircraft/1.0', 'Accept': 'application/json' } });
      if (res.ok) {
        const json = await res.json();
        if (json.results) {
          for (const r of json.results.slice(0, 20)) {
            ads.push({ ad_number: r.adNumber || r.id || null, title: r.title || null, effective_date: r.effectiveDate || null, description: r.description || r.summary || null, status: r.status || 'Active' });
          }
        }
      }
    } catch (_) {}
  }
  return { source: 'faa_ad', data: { n_number: nNumber, make, model, total_applicable: ads.length, directives: ads }, fetched_at: new Date().toISOString(), status: ads.length > 0 ? 'success' : 'data_unavailable' };
}

async function fetchServiceDifficultyReports(nNumber) {
  let make = null, model = null;
  try { const reg = await fetchFAARegistration(nNumber); make = reg.data.manufacturer; model = reg.data.model; } catch (_) {}
  const reports = [];
  if (make) {
    try {
      const res = await fetch(`https://sdrs.faa.gov/Home/Search?manufacturer=${encodeURIComponent(make)}&model=${encodeURIComponent(model || '')}`, { headers: { 'User-Agent': 'NAircraft/1.0', 'Accept': 'text/html' } });
      if (res.ok) {
        const html = await res.text();
        const rowPat = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
        const rows = html.match(rowPat) || [];
        for (const row of rows.slice(0, 30)) {
          const cellPat = /<td[^>]*>([\s\S]*?)<\/td>/gi;
          const cells = (row.match(cellPat) || []).map(c => c.replace(/<[^>]+>/g, '').trim());
          if (cells.length >= 3) reports.push({ report_number: cells[0] || null, date: cells[1] || null, description: cells[2] || null });
        }
      }
    } catch (_) {}
  }
  return { source: 'faa_sdr', data: { n_number: nNumber, make, model, total_reports: reports.length, reports }, fetched_at: new Date().toISOString(), status: reports.length > 0 ? 'success' : 'data_unavailable' };
}

async function fetchSTCs(nNumber) {
  let make = null, model = null;
  try { const reg = await fetchFAARegistration(nNumber); make = reg.data.manufacturer; model = reg.data.model; } catch (_) {}
  const stcs = [];
  if (make && model) {
    try {
      const res = await fetch(`https://drs.faa.gov/browse/search?q=${encodeURIComponent(make + ' ' + model)}&documentType=STC`, { headers: { 'User-Agent': 'NAircraft/1.0', 'Accept': 'application/json' } });
      if (res.ok) {
        const json = await res.json();
        if (json.results) for (const r of json.results.slice(0, 15)) stcs.push({ stc_number: r.stcNumber || r.id || null, title: r.title || null, holder: r.holder || null, issue_date: r.issueDate || null });
      }
    } catch (_) {}
  }
  return { source: 'faa_stc', data: { n_number: nNumber, make, model, total_stcs: stcs.length, stcs }, fetched_at: new Date().toISOString(), status: stcs.length > 0 ? 'success' : 'data_unavailable' };
}

async function fetchServiceBulletins(nNumber) {
  let make = null, model = null;
  try { const reg = await fetchFAARegistration(nNumber); make = reg.data.manufacturer; model = reg.data.model; } catch (_) {}
  return { source: 'service_bulletins', data: { n_number: nNumber, make, model, total_bulletins: 0, bulletins: [] }, fetched_at: new Date().toISOString(), status: 'data_unavailable', note: 'Supabase integration pending' };
}

async function fetchEngineDatabase(nNumber) {
  let make = null, model = null, engineType = null;
  try { const reg = await fetchFAARegistration(nNumber); make = reg.data.manufacturer; model = reg.data.model; engineType = reg.data.engine_type; } catch (_) {}
  return { source: 'engine_database', data: { n_number: nNumber, make, model, engine_type: engineType, total_references: 0, references: [] }, fetched_at: new Date().toISOString(), status: 'data_unavailable', note: 'Supabase integration pending' };
}

// ── HTML Parsing Helpers ──

function extractFAA(html, label) {
  const patterns = [
    new RegExp(label + '[^<]*<\\/td>\\s*<td[^>]*>([^<]+)<', 'i'),
    new RegExp(label + '[^<]*<\\/th>\\s*<td[^>]*>([^<]+)<', 'i'),
    new RegExp('>' + label + '[^>]*>[\\s\\n]*<[^>]*>([^<]+)<', 'i'),
    new RegExp(label + '[^>]*>[\\s\\S]{0,200}?<td[^>]*>\\s*([^<\\n]+)', 'i'),
    new RegExp(label + '[^>]*>[\\s\\S]{0,200}?<span[^>]*>\\s*([^<\\n]+)', 'i'),
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m && m[1] && m[1].trim() && m[1].trim() !== '&nbsp;') return m[1].trim();
  }
  const idx = html.toLowerCase().indexOf(label.toLowerCase());
  if (idx !== -1) {
    const snippet = html.substring(idx, idx + 500);
    const vm = snippet.match(/>([^<]{1,100})</);
    if (vm) { const v = vm[1].trim(); if (v && !v.toLowerCase().includes(label.toLowerCase())) return v; }
  }
  return null;
}

function parseNTSB(html, nNumber) {
  const accidents = [];
  const rowPat = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const rows = html.match(rowPat) || [];
  for (const row of rows) {
    const cellPat = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    const cells = (row.match(cellPat) || []).map(c => c.replace(/<[^>]+>/g, '').trim());
    if (cells.length >= 5 && cells.some(c => c.toUpperCase().includes(nNumber))) {
      accidents.push({ event_id: cells[0] || null, event_date: cells[1] || null, location: cells[2] || null, make_model: cells[3] || null, injury_severity: cells[4] || null, event_type: cells[5] || 'Accident', n_number: nNumber });
    }
  }
  return accidents;
}