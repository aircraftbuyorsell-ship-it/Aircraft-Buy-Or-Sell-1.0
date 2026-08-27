// Aircraft registration utility functions

// EASA member states + associated European prefixes (2-char first, then 1-char)
const EASA_PREFIXES = new Set([
  "D",    // Germany
  "G",    // United Kingdom
  "F",    // France
  "I",    // Italy
  "EC",   // Spain
  "PH",   // Netherlands
  "OE",   // Austria
  "HB",   // Switzerland
  "OK",   // Czech Republic
  "OM",   // Slovakia
  "SP",   // Poland
  "SE",   // Sweden
  "LN",   // Norway
  "OH",   // Finland
  "OY",   // Denmark
  "OO",   // Belgium
  "LX",   // Luxembourg
  "CS",   // Portugal
  "EI",   // Ireland
  "SX",   // Greece
  "HA",   // Hungary
  "YR",   // Romania
  "LZ",   // Bulgaria
  "9A",   // Croatia
  "UR",   // Ukraine
  "YL",   // Latvia
  "LY",   // Lithuania
  "ES",   // Estonia
  "T7",   // San Marino
  "T9",   // Bosnia
  "Z3",   // North Macedonia
  "4O",   // Montenegro
  "ER",   // Moldova
  "EW",   // Belarus
  "E7",   // Bosnia (alt)
  "3A",   // Monaco
  "5B",   // Cyprus
  "9H",   // Malta
  "TF",   // Iceland
  "2",    // Guernsey (2-XXXX)
  "M",    // Isle of Man (M-XXXX)
  "VP",   // British overseas territories (some)
  "Z",    // Channel Islands variant
]);

const FAA_PREFIXES = new Set(["N"]);

/**
 * Canonicalize a registration to one consistent form:
 * uppercase, no spaces; international regs get a single dash after the prefix.
 * "ok lad" / "OK-LAD" / "OKLAD" → "OK-LAD"; "n4757x" → "N4757X"
 */
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

/**
 * Detect registration type from a registration string.
 * Returns "faa" | "easa" | "other" | null
 */
export function detectRegType(registration) {
  if (!registration) return null;
  const reg = registration.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (!reg) return null;

  // Try 2-char prefix first
  const prefix2 = reg.substring(0, 2);
  if (EASA_PREFIXES.has(prefix2)) return "easa";
  if (FAA_PREFIXES.has(prefix2)) return "faa";

  // Then 1-char
  const prefix1 = reg.substring(0, 1);
  if (EASA_PREFIXES.has(prefix1)) return "easa";
  if (FAA_PREFIXES.has(prefix1)) return "faa";

  // Heuristic: EASA format is usually XX-### or XX-XXX (dash separated)
  if (/^[A-Z]{1,2}-/.test(reg)) return "easa";

  // Heuristic: Latin/Cyrillic-looking prefixes (not N)
  if (/^[A-Z]/.test(reg) && !reg.startsWith("N")) return "easa";

  return "other";
}

/**
 * Get a human-readable label for the registration type.
 */
export function getRegTypeLabel(type) {
  switch (type) {
    case "faa": return "FAA (N-Reg)";
    case "easa": return "EASA (EU)";
    case "other": return "Other";
    default: return "Unknown";
  }
}

/**
 * Get the region flag/color for a registration type.
 */
export function getRegTypeColor(type, isDark = true) {
  switch (type) {
    case "faa": return isDark ? "#00f5ff" : "#2563eb";
    case "easa": return "#D4A017";
    default: return isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)";
  }
}