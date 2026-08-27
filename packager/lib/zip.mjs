// Minimal, DETERMINISTIC zip writer.
//
// Written by hand rather than pulling in a dependency because determinism is a
// product requirement here, not a nicety: the brief calls for package
// generation to be "deterministic and auditable". Off-the-shelf zip libraries
// stamp the current time into every entry, so the same inputs produce a
// different archive (and a different hash) on every run — which makes a
// published checksum meaningless as a tamper check.
//
// Determinism comes from:
//   - a fixed DOS timestamp on every entry (never Date.now())
//   - entries emitted in sorted path order
//   - no extra fields, no zip64, no data descriptors
//   - fixed deflate settings
//
// Given identical inputs, the bytes out are identical, so sha256(zip) is a
// stable package identity.

import { deflateRawSync } from 'node:zlib';
import { createHash } from 'node:crypto';

// 1980-01-01 00:00:00 — the earliest representable DOS timestamp, and the
// conventional choice for reproducible builds.
const DOS_TIME = 0;
const DOS_DATE = 0x0021;

const SIG_LOCAL = 0x04034b50;
const SIG_CENTRAL = 0x02014b50;
const SIG_EOCD = 0x06054b50;

const METHOD_DEFLATE = 8;
const METHOD_STORE = 0;
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

export function crc32(buffer) {
  let crc = -1;
  for (let i = 0; i < buffer.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buffer[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

/**
 * Builds a zip archive.
 *
 * @param {Array<{path: string, contents: string|Buffer}>} entries
 * @returns {Buffer}
 */
export function createZip(entries) {
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error('createZip requires at least one entry');
  }

  // Sorted for determinism, and to reject duplicates deterministically too.
  const sorted = [...entries]
    .map((entry) => ({
      path: normalizeEntryPath(entry.path),
      data: Buffer.isBuffer(entry.contents) ? entry.contents : Buffer.from(String(entry.contents), 'utf8'),
    }))
    .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));

  const seen = new Set();
  for (const entry of sorted) {
    if (seen.has(entry.path)) throw new Error(`Duplicate entry in package: ${entry.path}`);
    seen.add(entry.path);
  }

  const localChunks = [];
  const centralChunks = [];
  let offset = 0;

  for (const entry of sorted) {
    const nameBuf = Buffer.from(entry.path, 'utf8');
    const crc = crc32(entry.data);

    // Deflate, but fall back to stored if compression doesn't help — this is
    // deterministic either way since the decision depends only on sizes.
    const deflated = deflateRawSync(entry.data, { level: 9 });
    const useDeflate = deflated.length < entry.data.length;
    const payload = useDeflate ? deflated : entry.data;
    const method = useDeflate ? METHOD_DEFLATE : METHOD_STORE;

    const local = Buffer.alloc(30);
    local.writeUInt32LE(SIG_LOCAL, 0);
    local.writeUInt16LE(VERSION_NEEDED, 4);
    local.writeUInt16LE(0, 6); // flags — no data descriptor, no encryption
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(DOS_TIME, 10);
    local.writeUInt16LE(DOS_DATE, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(payload.length, 18);
    local.writeUInt32LE(entry.data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28); // no extra field
    localChunks.push(local, nameBuf, payload);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(SIG_CENTRAL, 0);
    central.writeUInt16LE(VERSION_NEEDED, 4); // version made by
    central.writeUInt16LE(VERSION_NEEDED, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(method, 10);
    central.writeUInt16LE(DOS_TIME, 12);
    central.writeUInt16LE(DOS_DATE, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(payload.length, 20);
    central.writeUInt32LE(entry.data.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt16LE(0, 30); // extra
    central.writeUInt16LE(0, 32); // comment
    central.writeUInt16LE(0, 34); // disk number
    central.writeUInt16LE(0, 36); // internal attrs
    // External attrs: regular file, mode 0644 in the high 16 bits. The >>> 0
    // matters — JS bitwise ops are 32-bit *signed*, so 0o100644 << 16 alone
    // overflows to a negative number and writeUInt32LE rejects it.
    central.writeUInt32LE((0o100644 << 16) >>> 0, 38);
    central.writeUInt32LE(offset, 42);
    centralChunks.push(central, nameBuf);

    offset += local.length + nameBuf.length + payload.length;
  }

  const centralBuf = Buffer.concat(centralChunks);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(SIG_EOCD, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(sorted.length, 8);
  eocd.writeUInt16LE(sorted.length, 10);
  eocd.writeUInt32LE(centralBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20); // no archive comment

  return Buffer.concat([...localChunks, centralBuf, eocd]);
}

/**
 * Normalizes and validates an entry path. Rejects absolute paths and traversal
 * segments so a malicious or buggy manifest can't produce a "zip slip" archive
 * that writes outside the extraction directory on the customer's machine.
 */
export function normalizeEntryPath(inputPath) {
  const raw = String(inputPath || '').replace(/\\/g, '/').replace(/^\.\//, '');
  if (!raw) throw new Error('Package entry has an empty path');
  if (raw.startsWith('/')) throw new Error(`Package entry path must be relative: ${inputPath}`);
  if (/^[a-zA-Z]:/.test(raw)) throw new Error(`Package entry path must not be absolute: ${inputPath}`);
  const segments = raw.split('/');
  if (segments.includes('..')) throw new Error(`Package entry path must not traverse upwards: ${inputPath}`);
  if (segments.some((s) => s === '')) throw new Error(`Package entry path has an empty segment: ${inputPath}`);
  return raw;
}

export function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}
