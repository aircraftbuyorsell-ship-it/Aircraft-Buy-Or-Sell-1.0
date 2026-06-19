import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const FAA_ZIP_URL = 'https://registry.faa.gov/database/ReleasableAircraft.zip';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { nNumber } = await req.json();

    if (!nNumber || typeof nNumber !== 'string') {
      return Response.json({
        source: 'faa_registry', data: null,
        fetched_at: new Date().toISOString(), status: 'error',
        error: 'nNumber is required'
      }, { status: 400 });
    }

    const cleanN = nNumber.toUpperCase().replace(/[^A-Z0-9]/g, '').trim();
    const withPrefix = cleanN.startsWith('N') ? cleanN : 'N' + cleanN;
    // FAA CSV stores N-numbers without the "N" prefix
    const searchN = withPrefix.startsWith('N') ? withPrefix.slice(1) : withPrefix;
    const data = await lookupNNumberFromCSV(searchN, withPrefix);

    if (!data) {
      return Response.json({
        source: 'faa_registry', data: null,
        fetched_at: new Date().toISOString(), status: 'data_unavailable'
      });
    }

    return Response.json({
      source: 'faa_registry', data,
      fetched_at: new Date().toISOString(), status: 'success'
    });
  } catch (error) {
    return Response.json({
      source: 'faa_registry', data: null,
      fetched_at: new Date().toISOString(), status: 'error',
      error: error.message
    }, { status: 500 });
  }
});

async function lookupNNumberFromCSV(searchN, displayN) {
  const zipRes = await fetch(FAA_ZIP_URL, {
    headers: { 'User-Agent': 'ANYAIR/1.0 (aviation data platform)', 'Accept': '*/*' }
  });
  if (!zipRes.ok) throw new Error(`FAA ZIP download failed: ${zipRes.status}`);

  const zipBuffer = await zipRes.arrayBuffer();
  const bytes = new Uint8Array(zipBuffer);

  const entry = findZipEntry(bytes, 'MASTER.txt');
  if (!entry) throw new Error('MASTER.txt not found in FAA ZIP');

  return await searchCSVForNNumber(bytes, entry, searchN, displayN);
}

function findZipEntry(bytes, targetName) {
  const len = bytes.length;
  for (let offset = 0; offset < len - 30; offset++) {
    if (bytes[offset] === 0x50 && bytes[offset+1] === 0x4b && bytes[offset+2] === 0x03 && bytes[offset+3] === 0x04) {
      const method = bytes[offset+8] | (bytes[offset+9] << 8);
      const compSize = bytes[offset+18] | (bytes[offset+19] << 8) | (bytes[offset+20] << 16) | (bytes[offset+21] << 24);
      const nameLen = bytes[offset+26] | (bytes[offset+27] << 8);
      const extraLen = bytes[offset+28] | (bytes[offset+29] << 8);
      const nameStart = offset + 30;
      const name = new TextDecoder().decode(bytes.slice(nameStart, nameStart + nameLen));

      if (name === targetName || name.endsWith('/' + targetName)) {
        const dataStart = nameStart + nameLen + extraLen;
        return { offset: dataStart, compressedSize: compSize, method };
      }

      const dataStart = nameStart + nameLen + extraLen;
      offset = compSize > 0 ? dataStart + compSize - 1 : dataStart;
    }
  }
  return null;
}

async function searchCSVForNNumber(bytes, entry, searchN, displayN) {
  const compData = bytes.slice(entry.offset, entry.offset + entry.compressedSize);

  if (entry.method !== 8) {
    throw new Error(`Unsupported ZIP compression: ${entry.method}`);
  }

  // Stream decompress and scan line-by-line to avoid memory issues
  const ds = new DecompressionStream('deflate-raw');
  const writer = ds.writable.getWriter();
  const reader = ds.readable.getReader();
  writer.write(compData);
  writer.close();

  const decoder = new TextDecoder();
  let leftover = '';
  let isHeader = true;
  let colMap = null;
  let nCol = -1;

  while (true) {
    const { done, value } = await reader.read();
    
    leftover += value ? decoder.decode(value, { stream: true }) : '';
    
    // If done, flush decoder
    if (done) {
      leftover += decoder.decode();
    }

    const lines = leftover.split(/\r?\n/);
    leftover = lines.pop() || '';
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      if (isHeader) {
        const header = parseCSVLine(line);
        colMap = {};
        header.forEach((col, i) => { colMap[col.trim().toLowerCase()] = i; });
        nCol = colMap['n-number'] ?? colMap['n_number'] ?? colMap['nnumber'];
        if (nCol === undefined) throw new Error('N-Number column not found');
        isHeader = false;
        continue;
      }
      
      if (nCol >= 0) {
        const fields = parseCSVLine(line);
        const rowN = (fields[nCol] || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (rowN === searchN) {
          return mapCSVRowToData(fields, colMap, displayN);
        }
      }
    }

    if (done) break;
  }

  return null;
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