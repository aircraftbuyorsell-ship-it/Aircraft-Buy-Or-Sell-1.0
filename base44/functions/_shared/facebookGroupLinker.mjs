// Pure parsing/scoring logic for the Facebook Group → ABOS auto-link webhook.
// Kept dependency-free (no Deno/base44 SDK imports) so it can run in the
// Base44 function runtime and be unit-tested with `node --test`.

// Mirrors src/lib/regUtils.js — kept in sync manually since this module
// runs outside the Vite/React build (Base44 Deno function + node:test).
const EASA_PREFIXES = new Set([
  "D", "G", "F", "I", "EC", "PH", "OE", "HB", "OK", "OM", "SP", "SE", "LN", "OH", "OY", "OO",
  "LX", "CS", "EI", "SX", "HA", "YR", "LZ", "9A", "UR", "YL", "LY", "ES", "T7", "T9", "Z3",
  "4O", "ER", "EW", "E7", "3A", "5B", "9H", "TF", "2", "M", "VP", "Z",
]);

export function canonicalizeReg(raw) {
  if (!raw) return "";
  const reg = String(raw).toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!reg || reg.startsWith("N")) return reg;
  const p2 = reg.substring(0, 2);
  if (reg.length > 2 && EASA_PREFIXES.has(p2)) return `${p2}-${reg.slice(2)}`;
  const p1 = reg.substring(0, 1);
  if (reg.length > 1 && EASA_PREFIXES.has(p1)) return `${p1}-${reg.slice(1)}`;
  return reg;
}

// FAA: N followed by 1-5 digits, optionally 1-2 trailing letters (no I/O as final letter).
const FAA_TOKEN_RE = /\bN[0-9]{1,5}[A-Z]{0,2}\b/;
// EASA/ICAO style: 1-2 letter prefix, dash, 1-5 alphanumeric (e.g. OK-PES, HB-XYZ, G-ABCD).
const EASA_TOKEN_RE = /\b([A-Z]{1,2})-([A-Z0-9]{1,5})\b/;

/**
 * Scan free text for the single most likely aircraft registration.
 * Returns { registration, type, confidence } or null when nothing plausible is found.
 */
export function extractRegistration(text) {
  const raw = String(text || "").toUpperCase();
  if (!raw) return null;

  const easaMatch = raw.match(EASA_TOKEN_RE);
  if (easaMatch && EASA_PREFIXES.has(easaMatch[1])) {
    const registration = canonicalizeReg(easaMatch[0]);
    // Explicit dash + known EASA prefix is a strong signal.
    return { registration, type: "easa", confidence: 0.95 };
  }

  const faaMatch = raw.match(FAA_TOKEN_RE);
  if (faaMatch) {
    const registration = canonicalizeReg(faaMatch[0]);
    // Bare "N####" is common in casual speech ("row 12N4" false positives are rare
    // but possible), so FAA matches without surrounding word boundaries are scored
    // slightly below an explicit dash-separated EASA match.
    const looksIsolated = new RegExp(`(^|[^A-Z0-9])${faaMatch[0]}([^A-Z0-9]|$)`).test(raw);
    return { registration, type: "faa", confidence: looksIsolated ? 0.92 : 0.7 };
  }

  return null;
}

const SALE_KEYWORDS = /\b(for sale|fs|selling|price|asking|obo|make offer|listed|listing)\b/i;
const AVIATION_KEYWORDS = /\b(aircraft|airplane|plane|cessna|piper|cirrus|beechcraft|beech|mooney|cirrus|diamond|tbm|king ?air|citation|helicopter|hours?|tt|smoh|tach|avionics|annual|hangar)\b/i;
const PRICE_RE = /\$\s?[\d][\d,.]*\s?(k|m)?\b|\b(usd|eur|czk)\s?[\d][\d,.]*\b/i;
const YEAR_RE = /\b(19[5-9]\d|20[0-4]\d)\b/;
const HOURS_RE = /\b(\d{2,5})\s?(tt|hrs?|hours?|smoh)\b/i;

const AIRCRAFT_MAKES = [
  "cessna", "piper", "cirrus", "beechcraft", "beech", "mooney", "diamond", "tbm",
  "king air", "citation", "bonanza", "bombardier", "gulfstream", "robinson", "socata",
  "pilatus", "embraer", "learjet", "vans", "grumman", "maule",
];

/**
 * Look for a complete aircraft-sale advertisement in free text, independent of
 * whether a registration was found. Never invents values — every field is
 * either extracted verbatim or left undefined.
 */
export function detectListingSignals(text) {
  const raw = String(text || "");
  const lower = raw.toLowerCase();

  const make = AIRCRAFT_MAKES.find((candidate) => lower.includes(candidate));
  const priceMatch = raw.match(PRICE_RE);
  const yearMatch = raw.match(YEAR_RE);
  const hoursMatch = raw.match(HOURS_RE);
  const hasSaleKeyword = SALE_KEYWORDS.test(raw);
  const hasAviationContext = AVIATION_KEYWORDS.test(raw) || !!make;

  const fields = {
    make: make || undefined,
    year: yearMatch ? yearMatch[0] : undefined,
    price: priceMatch ? priceMatch[0].trim() : undefined,
    hours: hoursMatch ? hoursMatch[0].trim() : undefined,
  };
  const fieldCount = Object.values(fields).filter(Boolean).length;

  if (!hasAviationContext) return { isListing: false, confidence: 0, fields: {} };

  // Confidence rubric per spec: needs sale intent + aviation context + at least
  // one concrete identifying field to be worth surfacing without a registration.
  let confidence = 0;
  if (hasAviationContext) confidence += 0.3;
  if (hasSaleKeyword) confidence += 0.3;
  confidence += Math.min(fieldCount, 3) * 0.13;

  return {
    isListing: hasSaleKeyword && fieldCount > 0,
    confidence: Math.min(confidence, 0.9),
    fields,
  };
}

export const CONFIDENCE_THRESHOLDS = {
  AUTO_PROCESS: 0.75,
  DEFAULT_AUTO_COMMENT: 0.9,
};

// Public ABOS origin used for links posted into Facebook. Falls back to the
// same production origin the other Base44 functions use, so a missing
// BASE44_APP_URL can never put a relative (unclickable) link in a comment.
export const DEFAULT_LINK_ORIGIN = "https://aircraftbuyorsell.com";

export function resolveLinkOrigin(env = {}) {
  return String(env.BASE44_APP_URL || DEFAULT_LINK_ORIGIN).trim().replace(/\/+$/, "") || DEFAULT_LINK_ORIGIN;
}

export function resolveAutoCommentConfig(env = {}) {
  const parsed = Number(env.FB_AUTO_COMMENT_MIN_CONFIDENCE);
  return {
    enabled: String(env.FB_AUTO_COMMENT_ENABLED || "false").trim().toLowerCase() === "true",
    // An unparseable threshold falls back to the strict default rather than to
    // 0, which would otherwise auto-comment on every match.
    minConfidence: Number.isFinite(parsed) && parsed > 0 && parsed <= 1 ? parsed : CONFIDENCE_THRESHOLDS.DEFAULT_AUTO_COMMENT,
  };
}

/**
 * Report which Facebook/Meta environment variables Base44 actually has set,
 * so an admin can verify configuration from the app. Returns presence booleans
 * and derived settings only — never the configured values themselves.
 */
export function summarizeConfig(env = {}) {
  const isSet = (name) => Boolean(String(env[name] || "").trim());
  const autoComment = resolveAutoCommentConfig(env);
  const secrets = {
    META_VERIFY_TOKEN: isSet("META_VERIFY_TOKEN"),
    META_APP_SECRET: isSet("META_APP_SECRET"),
  };
  const loopProtection = {
    META_PAGE_ID: isSet("META_PAGE_ID"),
    META_APP_SCOPED_ID: isSet("META_APP_SCOPED_ID"),
  };

  return {
    secrets,
    loop_protection: loopProtection,
    link_origin: resolveLinkOrigin(env),
    auto_comment: {
      enabled: autoComment.enabled,
      min_confidence: autoComment.minConfidence,
      // Auto-commenting also needs a verified delivery path; enabling the flag
      // without the signing secret would accept nothing to act on.
      ready: autoComment.enabled && secrets.META_APP_SECRET,
    },
    // Live Meta deliveries cannot be accepted until both are set; everything
    // else (manual assistant, parsing, logging) works without them.
    webhook_ready: secrets.META_VERIFY_TOKEN && secrets.META_APP_SECRET,
    missing_required: Object.entries(secrets).filter(([, set]) => !set).map(([name]) => name),
    missing_recommended: Object.entries(loopProtection).filter(([, set]) => !set).map(([name]) => name),
  };
}

/**
 * Build the ABOS destination URL for a detected registration or listing.
 * Only uses routes that already exist in src/App.jsx — never invents a route.
 */
export function buildAbosDestination({ registration, listing }, { baseUrl = "", utmCampaign = "aircraft_auto_link" } = {}) {
  const utm = `utm_source=facebook&utm_medium=group&utm_campaign=${encodeURIComponent(utmCampaign)}`;
  if (registration) {
    return `${baseUrl}/n-lookup?registration=${encodeURIComponent(registration)}&${utm}`;
  }
  if (listing?.isListing && listing.fields?.make) {
    const query = [listing.fields.make, listing.fields.year].filter(Boolean).join(" ");
    return `${baseUrl}/listings?search=${encodeURIComponent(query)}&${utm}`;
  }
  return null;
}

/**
 * Compose the neutral, non-spammy comment copy. Never claims verification,
 * safety, or "best price" — those require actual ABOS evidence per policy.
 */
export function buildComment({ registration, url }) {
  if (!url) return null;
  if (registration) {
    return `✈️ Want to check this aircraft? ABOS Aircraft Advisor can help you verify the aircraft identity, available data and market information: ${url}`;
  }
  return `✈️ Looking at this aircraft? Check the available aircraft intelligence on ABOS: ${url}`;
}

/**
 * Full classification pipeline for one Facebook post/comment.
 * Never throws on malformed input — always returns a decision object.
 */
export function classifyPost(text, options = {}) {
  const registrationMatch = extractRegistration(text);
  const listingSignals = registrationMatch ? { isListing: false, confidence: 0, fields: {} } : detectListingSignals(text);

  const confidence = registrationMatch ? registrationMatch.confidence : listingSignals.confidence;
  const hasMatch = !!registrationMatch || listingSignals.isListing;

  if (!hasMatch || confidence < CONFIDENCE_THRESHOLDS.AUTO_PROCESS) {
    return {
      status: "SKIPPED",
      registration: registrationMatch?.registration || null,
      listing: listingSignals.isListing ? listingSignals.fields : null,
      confidence,
      destination_url: null,
      comment: null,
      reason: hasMatch ? "confidence below auto-process threshold" : "no aircraft registration or listing detected",
    };
  }

  const destinationUrl = buildAbosDestination(
    { registration: registrationMatch?.registration, listing: listingSignals },
    options,
  );
  if (!destinationUrl) {
    return {
      status: "SKIPPED",
      registration: registrationMatch?.registration || null,
      listing: listingSignals.isListing ? listingSignals.fields : null,
      confidence,
      destination_url: null,
      comment: null,
      reason: "not enough identity information for a confident ABOS destination",
    };
  }

  const comment = buildComment({ registration: registrationMatch?.registration, url: destinationUrl });
  return {
    status: "MATCHED",
    registration: registrationMatch?.registration || null,
    listing: listingSignals.isListing ? listingSignals.fields : null,
    confidence,
    destination_url: destinationUrl,
    comment,
    reason: null,
  };
}

/**
 * Loop protection: an event authored by ABOS's own Page/App must never be
 * reprocessed into another comment.
 */
export function isOwnActivity(event, { pageId, appScopedUserId } = {}) {
  const fromId = event?.from?.id || event?.sender_id || event?.comment?.from?.id;
  if (!fromId) return false;
  return (!!pageId && fromId === pageId) || (!!appScopedUserId && fromId === appScopedUserId);
}

/**
 * Moderation gate: whether a MATCHED classification is allowed to actually
 * post an automatic comment, per the FB_AUTO_COMMENT_ENABLED / _MIN_CONFIDENCE
 * environment configuration. Defaults are safe (disabled).
 */
export function shouldAutoComment(classification, { enabled = false, minConfidence = CONFIDENCE_THRESHOLDS.DEFAULT_AUTO_COMMENT } = {}) {
  if (!enabled) return false;
  if (classification.status !== "MATCHED") return false;
  return classification.confidence >= minConfidence;
}
