// PlaneFox marketplace listing → ABOS ATI Passport ingestion.
//
// PlaneFox is an external customer/data provider: its listings are ingested
// and normalized, never treated as an ATI/OMVM computation source and never
// allowed to overwrite higher-priority verified ABOS identity data.
//
// Pure decision logic only (no Deno/Base44/Supabase imports) so it can be
// unit-tested directly with Node's test runner. base44/functions/ingestPlaneFoxListing
// imports this module and performs the actual I/O (Supabase REST + Base44 entities).

export const PROVIDER = 'planefox';
export const SOURCE_TYPE = 'external_marketplace';

export const IDENTITY_STATUS = Object.freeze({
  VERIFIED: 'VERIFIED',
  PARTIALLY_VERIFIED: 'PARTIALLY_VERIFIED',
  UNVERIFIED: 'UNVERIFIED',
  IDENTITY_CONFLICT: 'IDENTITY_CONFLICT',
});

export function normalizeTailnumber(value) {
  return String(value ?? '').trim().toUpperCase().replace(/\s+/g, '');
}

// Only accepts a well-formed 6-hex-digit ICAO 24-bit address. Anything else
// (missing, truncated, non-hex) returns null — callers must never invent a
// value to fill the gap.
export function normalizeIcaoHex(value) {
  const s = String(value ?? '').trim().toUpperCase();
  return /^[0-9A-F]{6}$/.test(s) ? s : null;
}

export function buildPassportId(icaoHex, tailnumber) {
  if (!normalizeIcaoHex(icaoHex) || !tailnumber) {
    throw new Error('buildPassportId requires a validated icao_hex and a tailnumber');
  }
  return `ID_ABOS_PLANEFOX_${icaoHex}_${tailnumber}`;
}

function normalizeEvidenceItem(item, type) {
  const raw = (item && typeof item === 'object') ? item : { url: item };
  return {
    type,
    url: raw.url || raw.href || null,
    caption: raw.caption || raw.title || null,
    // Explicitly source evidence, never a verified fact — rule #9.
    status: 'source_evidence',
    verified: false,
    source: PROVIDER,
    raw,
  };
}

// Normalizes a raw PlaneFox listing payload (whatever shape the marketplace
// API/webhook hands us) into the canonical shape used by planIngest. PlaneFox
// data is ingested and normalized only — field values are copied verbatim
// (after trimming/casing), never inferred or fabricated.
export function mapPlaneFoxListing(raw = {}) {
  const sourceRecordId = String(raw.listing_id ?? raw.id ?? raw.source_record_id ?? '').trim();
  const sourceUrl = raw.listing_url ?? raw.url ?? raw.source_url ?? null;
  const tailnumber = normalizeTailnumber(
    raw.tailnumber ?? raw.registration ?? raw.tail_number ?? raw.n_number ?? ''
  ) || null;
  const icaoHexRaw = raw.icao_hex ?? raw.icao24 ?? raw.mode_s_hex ?? raw.hex_code ?? null;
  const specificIcaoHex = normalizeIcaoHex(icaoHexRaw);
  const photos = Array.isArray(raw.photos) ? raw.photos : [];
  const documents = Array.isArray(raw.documents) ? raw.documents : [];
  const evidence = [
    ...photos.map((p) => normalizeEvidenceItem(p, 'photo')),
    ...documents.map((d) => normalizeEvidenceItem(d, 'document')),
  ];

  return {
    source_record_id: sourceRecordId,
    source_url: sourceUrl,
    tailnumber,
    specific_icao_hex: specificIcaoHex,
    icao_hex_raw: icaoHexRaw != null ? String(icaoHexRaw) : null,
    manufacturer: raw.manufacturer ?? raw.make ?? null,
    model: raw.model ?? null,
    serial_number: raw.serial_number ?? raw.serial ?? null,
    year: Number.isFinite(Number(raw.year)) ? Number(raw.year) : null,
    evidence,
    raw,
  };
}

export function buildProvenance(normalizedListing, now) {
  return {
    source: PROVIDER,
    source_type: SOURCE_TYPE,
    source_record_id: normalizedListing.source_record_id,
    source_url: normalizedListing.source_url || null,
    retrieved_at: now,
  };
}

function resolveIdentityStatus({ icaoHex, tailnumber, conflict, preExistingTwin }) {
  if (conflict) return IDENTITY_STATUS.IDENTITY_CONFLICT;
  if (!icaoHex || !tailnumber) return IDENTITY_STATUS.UNVERIFIED;
  // Corroborated by an aircraft identity ABOS already had on file (Supabase
  // aircraft_passports Digital Twin) before this ingestion touched it.
  return preExistingTwin ? IDENTITY_STATUS.VERIFIED : IDENTITY_STATUS.PARTIALLY_VERIFIED;
}

/**
 * Pure decision function for one PlaneFox listing ingestion call.
 *
 * @param {object} params
 * @param {object} params.normalizedListing - output of mapPlaneFoxListing()
 * @param {object|null} params.preExistingTwin - aircraft_passports row that existed
 *   BEFORE this call touched it (null if this is the first time ABOS has seen the
 *   tailnumber). Used only to read icao24 for conflict detection — never mutated here.
 * @param {object|null} params.existingPassport - ATIPassport record already keyed by
 *   the deterministic passport_id, if one exists (idempotency).
 * @param {string} params.now - ISO timestamp for this ingestion run.
 */
export function planIngest({ normalizedListing, preExistingTwin = null, existingPassport = null, now }) {
  const icaoHex = normalizedListing.specific_icao_hex;
  const tailnumber = normalizedListing.tailnumber;

  const conflict = Boolean(
    preExistingTwin?.icao24 && icaoHex && String(preExistingTwin.icao24).toUpperCase() !== icaoHex
  );

  const identity_status = resolveIdentityStatus({ icaoHex, tailnumber, conflict, preExistingTwin });

  // The ID itself only depends on having a well-formed hex + tailnumber — it
  // is never fabricated, but it IS deterministic even in the IDENTITY_CONFLICT
  // case, so a conflicted record can still be located/flagged for review.
  const passportId = (icaoHex && tailnumber) ? buildPassportId(icaoHex, tailnumber) : null;

  const provenance = buildProvenance(normalizedListing, now);

  const listing_patch = {
    provider: PROVIDER,
    source_type: SOURCE_TYPE,
    source_record_id: normalizedListing.source_record_id,
    source_url: normalizedListing.source_url,
    tailnumber,
    specific_icao_hex: icaoHex,
    manufacturer: normalizedListing.manufacturer,
    model: normalizedListing.model,
    serial_number: normalizedListing.serial_number,
    year: normalizedListing.year,
    identity_status,
    passport_id: passportId,
    raw_payload: normalizedListing.raw,
    evidence: normalizedListing.evidence,
    retrieved_at: now,
    source_last_seen_at: now,
  };

  let passport_action = 'skip';
  let passport_patch = null;

  if (passportId) {
    if (!existingPassport) {
      // Never create a new passport straight into a conflicted state.
      passport_action = identity_status === IDENTITY_STATUS.IDENTITY_CONFLICT ? 'skip' : 'create';
      if (passport_action === 'create') {
        passport_patch = {
          registration: tailnumber,
          tailnumber,
          specific_icao_hex: icaoHex,
          provider: PROVIDER,
          provider_listing_id: normalizedListing.source_record_id,
          provider_listing_url: normalizedListing.source_url || null,
          identity_status,
          passport_id: passportId,
          source_last_seen_at: now,
          provenance,
          ...(normalizedListing.serial_number ? { serial_number: normalizedListing.serial_number } : {}),
        };
      }
    } else {
      // Idempotent refresh of an existing passport: only fill fields that are
      // currently empty, always refresh status/provenance/timestamps, never
      // overwrite a value ABOS already has on file (rule #11).
      passport_action = 'update';
      passport_patch = {
        identity_status,
        source_last_seen_at: now,
        provenance,
      };
      if (!existingPassport.registration && tailnumber) passport_patch.registration = tailnumber;
      if (!existingPassport.tailnumber && tailnumber) passport_patch.tailnumber = tailnumber;
      if (!existingPassport.specific_icao_hex && icaoHex) passport_patch.specific_icao_hex = icaoHex;
      if (!existingPassport.serial_number && normalizedListing.serial_number) {
        passport_patch.serial_number = normalizedListing.serial_number;
      }
      if (!existingPassport.provider) passport_patch.provider = PROVIDER;
      if (!existingPassport.provider_listing_id) {
        passport_patch.provider_listing_id = normalizedListing.source_record_id;
      }
      if (!existingPassport.provider_listing_url && normalizedListing.source_url) {
        passport_patch.provider_listing_url = normalizedListing.source_url;
      }
    }
  }

  const created = passport_action === 'create';
  const updated = passport_action === 'update';

  return {
    identity_status,
    conflict,
    passport_id: passportId,
    listing_patch,
    passport_action,
    passport_patch,
    response: {
      ok: true,
      passport_id: passportId,
      provider: PROVIDER,
      listing_id: normalizedListing.source_record_id,
      tailnumber: tailnumber || null,
      icao_hex: icaoHex,
      identity_status,
      created,
      updated,
    },
  };
}
