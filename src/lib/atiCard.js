import { base44 } from "@/api/base44Client";

/**
 * ATI Card Registry — MVP utilities.
 * Implements identity layer (codes, IDs), status transitions, and creation
 * logic. Attribution default: "first_verified_source" per the MVP spec.
 */

// ─── Region / class / model tokenization ───────────────────────────────────
const REGION_MAP = {
  "N": "US", "OK": "CZ", "D-": "DE", "G-": "UK", "F-": "FR",
  "HB": "CH", "OE": "AT", "SP": "PL", "EC": "ES", "I-": "IT",
  "OO": "BE", "PH": "NL", "SE": "SE", "LN": "NO", "OH": "FI",
};
export function deriveRegion(registration = "") {
  const r = (registration || "").toUpperCase().trim();
  if (!r) return "XX";
  if (r.startsWith("N") && /^N\d/.test(r)) return "US";
  for (const [prefix, code] of Object.entries(REGION_MAP)) {
    if (r.startsWith(prefix)) return code;
  }
  return r.slice(0, 2).replace(/-/g, "") || "XX";
}

// Rough aircraft class token — single-engine piston, multi-engine, turboprop, jet, heli
export function deriveClass(listing = {}) {
  const make = (listing.make || "").toLowerCase();
  const model = (listing.model || "").toLowerCase();
  if (/(heli|robinson|bell|airbus h|bo105|ec-?\d)/.test(make + model)) return "HEL";
  if (/(citation|lear|gulfstream|phenom|embraer|hawker|global|challenger|king air|pilatus.*pc-?24|embraer)/.test(make + model)) return "JET";
  if (/(king air|pc-?12|tbm|caravan|meridian|piaggio|mu-?2)/.test(make + model)) return "TP";
  if ((listing.engine_count || 1) >= 2) return "MEP";
  return "SEP";
}

export function deriveModelToken(listing = {}) {
  const model = (listing.model || "").toUpperCase().replace(/\s+/g, "").replace(/[^A-Z0-9]/g, "");
  return model.slice(0, 5) || "GEN";
}

// Pad a sequence to a 6-digit block
const pad6 = (n) => String(n || 0).padStart(6, "0");

/**
 * Build a public card code: ATI-<REGION>-<CLASS>-<MODEL>-<######>-V<version>
 * Example: ATI-CZ-SEP-M20C-000184-V2
 */
export function buildPublicCardCode({ region, klass, modelToken, sequence, version = 1 }) {
  return `ATI-${region}-${klass}-${modelToken}-${pad6(sequence)}-V${version}`;
}

// ─── Next sequence number (MVP: count existing cards; admin-only in RLS later) ─
async function getNextSequence() {
  const recent = await base44.entities.ATICard.list("-sequence_number", 1);
  const last = recent[0]?.sequence_number || 0;
  return last + 1;
}

/**
 * Idempotent: returns an existing active card for a listing OR creates a
 * new `issued` card. Called after an ATI passport is generated.
 */
export async function ensureCardForListing(listing, { issuerEmail } = {}) {
  if (!listing?.id) return null;
  // Check for existing card — one active card per listing in MVP
  const existing = await base44.entities.ATICard.filter({ listing: listing.id }, "-created_date", 1);
  if (existing[0]) {
    // Bump version if this is a regeneration
    const current = existing[0];
    const nextVersion = (current.card_version || 1) + 1;
    const region = current.aircraft_region || deriveRegion(listing.registration);
    const klass = current.aircraft_class || deriveClass(listing);
    const modelToken = current.aircraft_model_token || deriveModelToken(listing);
    const sequence = current.sequence_number;
    const newCode = buildPublicCardCode({ region, klass, modelToken, sequence, version: nextVersion });
    await base44.entities.ATICard.update(current.id, {
      public_card_code: newCode,
      card_version: nextVersion,
      aircraft_registration: listing.registration || current.aircraft_registration,
      aircraft_label: `${listing.year || ""} ${listing.make || ""} ${listing.model || ""}`.trim() || current.aircraft_label,
      status: current.status === "draft" ? "issued" : current.status,
    });
    return { ...current, public_card_code: newCode, card_version: nextVersion };
  }

  // New card
  const sequence = await getNextSequence();
  const region = deriveRegion(listing.registration);
  const klass = deriveClass(listing);
  const modelToken = deriveModelToken(listing);
  const code = buildPublicCardCode({ region, klass, modelToken, sequence, version: 1 });

  const card = await base44.entities.ATICard.create({
    public_card_code: code,
    sequence_number: sequence,
    listing: listing.id,
    aircraft_registration: listing.registration || "",
    aircraft_label: `${listing.year || ""} ${listing.make || ""} ${listing.model || ""}`.trim(),
    aircraft_region: region,
    aircraft_class: klass,
    aircraft_model_token: modelToken,
    card_version: 1,
    card_type: "basic",
    status: "issued",
    issuer_entity: "ABOS",
    issuer_email: issuerEmail || "",
    attribution_model: "first_verified_source",
    origin_source: "direct",
    distribution_chain_depth: 0,
    payout_status: "none",
    view_count: 0,
    share_count: 0,
    issued_at: new Date().toISOString(),
  });
  return card;
}

// ─── Lifecycle helpers ────────────────────────────────────────────────────
export const STATUS_META = {
  draft:       { color: "#AAA49C", bg: "rgba(170,164,156,0.12)", label: "Draft" },
  issued:      { color: "#185FA5", bg: "rgba(24,95,165,0.10)",  label: "Issued" },
  active:      { color: "#0F7A56", bg: "rgba(15,122,86,0.10)",  label: "Active" },
  shared:      { color: "#0B2D5B", bg: "rgba(11,45,91,0.10)",   label: "Shared" },
  engaged:     { color: "#E8A83A", bg: "rgba(232,168,58,0.14)", label: "Engaged" },
  converted:   { color: "#0F7A56", bg: "rgba(15,122,86,0.14)",  label: "Converted" },
  expired:     { color: "#AAA49C", bg: "rgba(170,164,156,0.14)",label: "Expired" },
  archived:    { color: "#AAA49C", bg: "rgba(170,164,156,0.12)",label: "Archived" },
  transferred: { color: "#A67C00", bg: "rgba(166,124,0,0.10)",  label: "Transferred" },
  disputed:    { color: "#C0392B", bg: "rgba(192,57,43,0.10)",  label: "Disputed" },
  suspended:   { color: "#C0392B", bg: "rgba(192,57,43,0.10)",  label: "Suspended" },
};

export const CARD_TYPE_META = {
  basic:              { label: "Basic",              color: "#AAA49C" },
  pro:                { label: "Pro",                color: "#0B2D5B" },
  verified:           { label: "Verified",           color: "#0F7A56" },
  marketplace_pack:   { label: "Marketplace Pack",   color: "#E8A83A" },
  broker_pack:        { label: "Broker Pack",        color: "#A67C00" },
};