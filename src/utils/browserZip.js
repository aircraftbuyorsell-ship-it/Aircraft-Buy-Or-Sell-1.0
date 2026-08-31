/**
 * Minimal ZIP writer for the browser.
 *
 * The packager's zip.mjs cannot run here — it depends on node:zlib and
 * node:crypto. This module writes the same container format but stores entries
 * uncompressed (method 0). The install wizard emits three small text files, so
 * compression would buy nothing and a STORE-only writer needs no deflate at all.
 *
 * Entries are sorted by path and rejected on duplicates, matching zip.mjs, so
 * the same input always produces byte-identical output.
 */

const LOCAL_SIG = 0x04034b50;
const CENTRAL_SIG = 0x02014b50;
const EOCD_SIG = 0x06054b50;
const UTF8_FLAG = 0x0800; // filenames are UTF-8, not CP437
const VERSION_NEEDED = 20;

function crc32Table() {
  const table = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c;
  }
  return table;
}
const CRC_TABLE = crc32Table();

export function crc32(bytes) {
  let crc = -1;
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ bytes[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

/** Strips drive letters, leading slashes and any `..` segment. */
export function normalizeEntryPath(inputPath) {
  const raw = String(inputPath || '').replace(/\\/g, '/').replace(/^\.\//, '');
  const segments = raw.split('/').filter((s) => s && s !== '.' && s !== '..');
  const normalized = segments.join('/');
  if (!normalized) throw new Error(`Invalid zip entry path: ${inputPath}`);
  return normalized;
}

/**
 * @param {Array<{path: string, contents: string|Uint8Array}>} entries
 * @returns {Blob} a ZIP archive ready for download
 */
export function createZipBlob(entries) {
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error('createZipBlob requires at least one entry');
  }

  const encoder = new TextEncoder();
  const sorted = entries
    .map((entry) => ({
      path: normalizeEntryPath(entry.path),
      data: entry.contents instanceof Uint8Array
        ? entry.contents
        : encoder.encode(String(entry.contents)),
    }))
    .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));

  const seen = new Set();
  for (const entry of sorted) {
    if (seen.has(entry.path)) throw new Error(`Duplicate entry in archive: ${entry.path}`);
    seen.add(entry.path);
  }

  const parts = [];
  const central = [];
  let offset = 0;

  for (const entry of sorted) {
    const nameBytes = encoder.encode(entry.path);
    const sum = crc32(entry.data);
    const size = entry.data.length;

    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, LOCAL_SIG, true);
    local.setUint16(4, VERSION_NEEDED, true);
    local.setUint16(6, UTF8_FLAG, true);
    local.setUint16(8, 0, true); // store
    local.setUint16(10, 0, true); // dos time — fixed, keeps output deterministic
    local.setUint16(12, 0x0021, true); // dos date — 1980-01-01
    local.setUint32(14, sum, true);
    local.setUint32(18, size, true);
    local.setUint32(22, size, true);
    local.setUint16(26, nameBytes.length, true);
    local.setUint16(28, 0, true);

    parts.push(new Uint8Array(local.buffer), nameBytes, entry.data);

    const dir = new DataView(new ArrayBuffer(46));
    dir.setUint32(0, CENTRAL_SIG, true);
    dir.setUint16(4, VERSION_NEEDED, true);
    dir.setUint16(6, VERSION_NEEDED, true);
    dir.setUint16(8, UTF8_FLAG, true);
    dir.setUint16(10, 0, true);
    dir.setUint16(12, 0, true);
    dir.setUint16(14, 0x0021, true);
    dir.setUint32(16, sum, true);
    dir.setUint32(20, size, true);
    dir.setUint32(24, size, true);
    dir.setUint16(28, nameBytes.length, true);
    dir.setUint16(30, 0, true);
    dir.setUint16(32, 0, true);
    dir.setUint16(34, 0, true);
    dir.setUint16(36, 0, true);
    dir.setUint32(38, 0, true);
    dir.setUint32(42, offset, true);

    central.push(new Uint8Array(dir.buffer), nameBytes);
    offset += 30 + nameBytes.length + size;
  }

  const centralSize = central.reduce((total, chunk) => total + chunk.length, 0);

  const eocd = new DataView(new ArrayBuffer(22));
  eocd.setUint32(0, EOCD_SIG, true);
  eocd.setUint16(4, 0, true);
  eocd.setUint16(6, 0, true);
  eocd.setUint16(8, sorted.length, true);
  eocd.setUint16(10, sorted.length, true);
  eocd.setUint32(12, centralSize, true);
  eocd.setUint32(16, offset, true);
  eocd.setUint16(20, 0, true);

  return new Blob([...parts, ...central, new Uint8Array(eocd.buffer)], {
    type: 'application/zip',
  });
}
