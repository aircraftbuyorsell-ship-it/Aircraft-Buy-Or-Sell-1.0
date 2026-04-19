// FAA Aircraft Registration Master File — code lookups
// Source: FAA AR Data webfiles reference (5/8/2025)
// Use these maps to translate raw FAA numeric/letter codes into human-readable labels.

export const TYPE_AIRCRAFT = {
  "1": "Glider",
  "2": "Balloon",
  "3": "Blimp / Dirigible",
  "4": "Fixed wing single engine",
  "5": "Fixed wing multi engine",
  "6": "Rotorcraft",
  "7": "Weight-shift-control",
  "8": "Powered Parachute",
  "9": "Gyroplane",
  "H": "Hybrid Lift",
  "O": "Other",
};

export const TYPE_ENGINE = {
  "0": "None",
  "1": "Reciprocating",
  "2": "Turbo-prop",
  "3": "Turbo-shaft",
  "4": "Turbo-jet",
  "5": "Turbo-fan",
  "6": "Ramjet",
  "7": "2 Cycle",
  "8": "4 Cycle",
  "9": "Unknown",
  "10": "Electric",
  "11": "Rotary",
};

export const TYPE_REGISTRANT = {
  "1": "Individual",
  "2": "Partnership",
  "3": "Corporation",
  "4": "Co-Owned",
  "5": "Government",
  "7": "LLC",
  "8": "Non Citizen Corporation",
  "9": "Non Citizen Co-Owned",
};

// Used in FAA Dealer Applicant file
export const DEALER_OWNERSHIP = {
  "1": "Individual",
  "2": "Partnership",
  "3": "Corporation",
  "4": "Co-Ownership",
  "7": "LLC",
  "8": "Non Citizen Corporation",
};

export const AIRWORTHINESS_CLASS = {
  "1": "Standard",
  "2": "Limited",
  "3": "Restricted",
  "4": "Experimental",
  "5": "Provisional",
  "6": "Multiple",
  "7": "Primary",
  "8": "Special Flight Permit",
  "9": "Light Sport",
};

export const AIRCRAFT_CATEGORY = {
  "1": "Land",
  "2": "Sea",
  "3": "Amphibian",
};

export const BUILDER_CERT = {
  "0": "Type Certificated",
  "1": "Not Type Certificated",
  "2": "Light Sport",
};

export const AIRCRAFT_WEIGHT = {
  "1": "Up to 12,499 lbs",
  "2": "12,500 – 19,999 lbs",
  "3": "20,000+ lbs",
  "4": "UAV up to 55 lbs",
};

export const REGION = {
  "1": "Eastern",
  "2": "Southwestern",
  "3": "Central",
  "4": "Western-Pacific",
  "5": "Alaskan",
  "7": "Southern",
  "8": "European",
  "C": "Great Lakes",
  "E": "New England",
  "S": "Northwest Mountain",
};

// Doc Index (BOS / S/A / REL / REP / CSC / DIS / CRT)
export const DOC_TYPE = {
  "BOS": "Bill of Sale (Evidence of Ownership)",
  "S/A": "Security Conveyance / Lien",
  "SA":  "Security Conveyance / Lien",
  "REL": "Lien Release",
  "REP": "Repossession",
  "CSC": "Evidence of Ownership w/ Lien",
  "DIS": "Disclaimer",
  "CRT": "Court Documents",
};

// Registration status — short human labels. Numeric statuses indicate lifecycle stage.
export const STATUS_CODE = {
  "A":  "Triennial mailed — no response",
  "D":  "Expired Dealer",
  "E":  "Revoked (enforcement)",
  "M":  "Valid — Mfr Dealer Cert",
  "N":  "Non-citizen — flight hrs missing",
  "R":  "Registration Pending",
  "S":  "Second Triennial — no response",
  "T":  "Valid — Trainee",
  "V":  "Valid Registration",
  "W":  "Certificate Invalid",
  "X":  "Enforcement Letter",
  "Z":  "Permanent Reserved",
  "1":  "Triennial returned undeliverable",
  "2":  "N-Number assigned — not registered",
  "3":  "N-Number (Amateur) — not registered",
  "4":  "N-Number (import) — not registered",
  "5":  "Reserved N-Number",
  "6":  "Administratively canceled",
  "7":  "Sale reported",
  "8":  "2nd triennial — no response",
  "9":  "Certificate revoked",
  "10": "Assigned — pending cancellation",
  "11": "Amateur — pending cancellation",
  "12": "Import — pending cancellation",
  "13": "Registration Expired",
  "14": "1st notice — Re-Registration",
  "15": "2nd notice — Re-Registration",
  "16": "Expired — pending cancellation",
  "17": "Sale Reported — pending cancellation",
  "18": "Sale Reported — canceled",
  "19": "Pending — pending cancellation",
  "20": "Pending — canceled",
  "21": "Revoked — pending cancellation",
  "22": "Revoked — canceled",
  "23": "Expired Dealer — pending cancellation",
  "24": "3rd notice — Re-Registration",
  "25": "1st notice — Renewal",
  "26": "2nd notice — Renewal",
  "27": "Registration Expired",
  "28": "3rd notice — Renewal",
  "29": "Expired — pending cancellation",
};

// Format YYYYMMDD dates from FAA files (e.g. "20260313") → "2026-03-13"
export function formatFAADate(s) {
  if (!s || typeof s !== "string") return null;
  const t = s.trim();
  if (t.length !== 8 || !/^\d{8}$/.test(t)) return t;
  return `${t.slice(0, 4)}-${t.slice(4, 6)}-${t.slice(6, 8)}`;
}

// Helper — safe lookup with fallback to raw code
export function lookup(map, code) {
  if (code == null) return "—";
  const key = String(code).trim();
  return map[key] || key || "—";
}