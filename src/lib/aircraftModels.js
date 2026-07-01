/**
 * General Aviation aircraft models with per-category scaling multipliers.
 * Baseline (1.0) = Cessna 172 Skyhawk.
 * Multipliers reflect relative panel complexity, surface area, and cabin size.
 */
export const GA_AIRCRAFT = [
  // ── Single-Engine Piston ──
  { label: "Cessna 152",            value: "c152",     avionicsMult: 0.85, exteriorMult: 0.80, interiorSeats: 2,  interiorMult: 0.75, category: "SEP" },
  { label: "Cessna 172 Skyhawk",    value: "c172",     avionicsMult: 1.00, exteriorMult: 1.00, interiorSeats: 4,  interiorMult: 1.00, category: "SEP" },
  { label: "Cessna 182 Skylane",    value: "c182",     avionicsMult: 1.10, exteriorMult: 1.10, interiorSeats: 4,  interiorMult: 1.05, category: "SEP" },
  { label: "Cessna 206 Stationair", value: "c206",     avionicsMult: 1.20, exteriorMult: 1.25, interiorSeats: 6,  interiorMult: 1.20, category: "SEP" },
  { label: "Cessna 210 Centurion",  value: "c210",     avionicsMult: 1.15, exteriorMult: 1.15, interiorSeats: 6,  interiorMult: 1.10, category: "SEP" },
  { label: "Piper PA-28 Warrior",   value: "pa28w",    avionicsMult: 1.00, exteriorMult: 1.00, interiorSeats: 4,  interiorMult: 1.00, category: "SEP" },
  { label: "Piper PA-28 Archer",    value: "pa28a",    avionicsMult: 1.00, exteriorMult: 1.05, interiorSeats: 4,  interiorMult: 1.05, category: "SEP" },
  { label: "Piper PA-32 Saratoga",  value: "pa32",     avionicsMult: 1.15, exteriorMult: 1.20, interiorSeats: 6,  interiorMult: 1.15, category: "SEP" },
  { label: "Cirrus SR20",           value: "sr20",     avionicsMult: 1.05, exteriorMult: 1.05, interiorSeats: 4,  interiorMult: 1.10, category: "SEP" },
  { label: "Cirrus SR22",           value: "sr22",     avionicsMult: 1.05, exteriorMult: 1.05, interiorSeats: 4,  interiorMult: 1.10, category: "SEP" },
  { label: "Cirrus SR22T",          value: "sr22t",    avionicsMult: 1.10, exteriorMult: 1.05, interiorSeats: 4,  interiorMult: 1.10, category: "SEP" },
  { label: "Beechcraft Bonanza A36",value: "a36",      avionicsMult: 1.10, exteriorMult: 1.10, interiorSeats: 6,  interiorMult: 1.10, category: "SEP" },
  { label: "Mooney M20",            value: "m20",      avionicsMult: 1.00, exteriorMult: 0.95, interiorSeats: 4,  interiorMult: 0.95, category: "SEP" },
  { label: "Diamond DA40",          value: "da40",     avionicsMult: 1.00, exteriorMult: 1.00, interiorSeats: 4,  interiorMult: 1.00, category: "SEP" },
  { label: "Robin DR400",           value: "dr400",    avionicsMult: 0.90, exteriorMult: 0.90, interiorSeats: 4,  interiorMult: 0.90, category: "SEP" },
  { label: "Tecnam P2010",          value: "p2010",    avionicsMult: 0.95, exteriorMult: 0.95, interiorSeats: 4,  interiorMult: 0.95, category: "SEP" },

  // ── Multi-Engine Piston ──
  { label: "Piper PA-34 Seneca",    value: "pa34",     avionicsMult: 1.25, exteriorMult: 1.35, interiorSeats: 6,  interiorMult: 1.20, category: "MEP" },
  { label: "Piper PA-44 Seminole",  value: "pa44",     avionicsMult: 1.25, exteriorMult: 1.35, interiorSeats: 4,  interiorMult: 1.15, category: "MEP" },
  { label: "Beechcraft Baron 58",   value: "be58",     avionicsMult: 1.30, exteriorMult: 1.40, interiorSeats: 6,  interiorMult: 1.20, category: "MEP" },
  { label: "Diamond DA42 Twin Star",value: "da42",     avionicsMult: 1.25, exteriorMult: 1.20, interiorSeats: 4,  interiorMult: 1.10, category: "MEP" },
  { label: "Diamond DA62",          value: "da62",     avionicsMult: 1.30, exteriorMult: 1.30, interiorSeats: 7,  interiorMult: 1.25, category: "MEP" },

  // ── Turboprop ──
  { label: "Beechcraft King Air C90",   value: "c90",  avionicsMult: 1.60, exteriorMult: 2.20, interiorSeats: 7,  interiorMult: 1.50, category: "Turboprop" },
  { label: "Beechcraft King Air 350",   value: "ka350",avionicsMult: 1.80, exteriorMult: 2.80, interiorSeats: 9,  interiorMult: 1.80, category: "Turboprop" },
  { label: "Pilatus PC-12",             value: "pc12", avionicsMult: 1.60, exteriorMult: 2.00, interiorSeats: 9,  interiorMult: 1.60, category: "Turboprop" },
  { label: "Cessna Caravan 208",        value: "c208", avionicsMult: 1.50, exteriorMult: 2.10, interiorSeats: 9,  interiorMult: 1.50, category: "Turboprop" },
  { label: "TBM 930",                   value: "tbm930",avionicsMult: 1.55, exteriorMult: 1.80, interiorSeats: 6,  interiorMult: 1.40, category: "Turboprop" },

  // ── Light Jet / Entry-Level ──
  { label: "Cirrus Vision Jet SF50",    value: "sf50", avionicsMult: 1.50, exteriorMult: 1.60, interiorSeats: 5,  interiorMult: 1.40, category: "Light Jet" },
  { label: "Cessna Citation M2",        value: "m2",   avionicsMult: 2.00, exteriorMult: 3.00, interiorSeats: 7,  interiorMult: 1.80, category: "Light Jet" },
  { label: "Embraer Phenom 100",        value: "p100", avionicsMult: 2.00, exteriorMult: 3.00, interiorSeats: 6,  interiorMult: 1.80, category: "Light Jet" },

  // ── Helicopter ──
  { label: "Robinson R44",              value: "r44",  avionicsMult: 1.40, exteriorMult: 1.20, interiorSeats: 4,  interiorMult: 1.10, category: "Helicopter" },
  { label: "Robinson R66",              value: "r66",  avionicsMult: 1.50, exteriorMult: 1.30, interiorSeats: 5,  interiorMult: 1.20, category: "Helicopter" },
  { label: "Bell 206 JetRanger",        value: "b206", avionicsMult: 1.60, exteriorMult: 1.50, interiorSeats: 5,  interiorMult: 1.30, category: "Helicopter" },
];