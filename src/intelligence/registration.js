/**
 * Registration normalisation — self-contained on purpose.
 *
 * The intelligence layer must not depend on any particular version of the
 * app's page-level helpers, so it carries its own normaliser. A registration
 * arrives in every shape a human types it (n7692j, N-7692J, OK ABC) and has to
 * come out canonical before it is used as an identity key or a cache key.
 */

const DASH_PREFIXES = [
  "OK", "OM", "EC", "EA", "SE", "OO", "PH", "HB", "OE", "LN", "OY", "ZK", "VH",
  "CS", "SP", "HA", "LV", "LY", "ES", "UR", "9A", "LZ", "T7", "T9", "9H", "5B",
  "4O", "ER", "EW", "E7", "9M", "9V", "A7", "RP", "RA", "D", "G", "F", "I", "B",
];

/** Canonical display form, e.g. "N7692J" or "OK-ABC". */
export function normalizeReg(value) {
  const compact = String(value ?? "").trim().toUpperCase().replace(/\s+/g, "");
  if (!compact) return "";
  if (/^N-?\d/.test(compact)) return compact.replace(/-/g, "");
  if (/^\d{1,5}[A-Z]{0,2}$/.test(compact)) return `N${compact}`;
  if (compact.includes("-")) return compact;
  const prefix = DASH_PREFIXES.find((item) => compact.startsWith(item) && compact.length > item.length);
  return prefix ? `${prefix}-${compact.slice(prefix.length)}` : compact;
}

/** Punctuation-free form, for matching across sources that disagree on dashes. */
export function compactReg(value) {
  return String(value ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** True for a US N-number. Decides whether FAA and NTSB are worth asking. */
export function isUSRegistration(value) {
  return /^N\d/.test(compactReg(value));
}

/** Best guess at the country of registry, used to route registry providers. */
export function registryCountry(value) {
  const compact = compactReg(value);
  if (!compact) return null;
  if (isUSRegistration(compact)) return "US";
  const normalized = normalizeReg(value);
  const prefix = normalized.includes("-") ? normalized.split("-")[0] : null;
  const map = {
    OK: "CZ", OM: "SK", SP: "PL", D: "DE", G: "GB", F: "FR", I: "IT",
    HB: "CH", OE: "AT", PH: "NL", EC: "ES", SE: "SE", OY: "DK", LN: "NO",
    HA: "HU", YR: "RO", LZ: "BG", "9A": "HR", S5: "SI", ES: "EE", LY: "LT",
  };
  return prefix ? (map[prefix] || null) : null;
}
