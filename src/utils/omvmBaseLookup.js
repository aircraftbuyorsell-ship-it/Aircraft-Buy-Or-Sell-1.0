/**
 * omvmBaseLookup.js — ABOS OMVM Base Value Lookup Table
 * Fixes BUG-001: replaces hardcoded $200,000 base with per-make/model market medians.
 * Data: Controller.com, Trade-A-Plane, VREF averages 2024-2025.
 */

const CURRENT_YEAR = new Date().getFullYear();

const MAKE_MODEL_BASE = {
  // CESSNA
  "CESSNA|150":          { base: 28000,   floor: 18000,   ceiling: 45000 },
  "CESSNA|152":          { base: 35000,   floor: 22000,   ceiling: 52000 },
  "CESSNA|162":          { base: 90000,   floor: 65000,   ceiling: 120000 },
  "CESSNA|172":          { base: 75000,   floor: 38000,   ceiling: 175000 },
  "CESSNA|172R":         { base: 110000,  floor: 75000,   ceiling: 180000 },
  "CESSNA|172S":         { base: 130000,  floor: 90000,   ceiling: 200000 },
  "CESSNA|177":          { base: 55000,   floor: 35000,   ceiling: 90000 },
  "CESSNA|180":          { base: 95000,   floor: 65000,   ceiling: 145000 },
  "CESSNA|182":          { base: 120000,  floor: 65000,   ceiling: 250000 },
  "CESSNA|182T":         { base: 220000,  floor: 160000,  ceiling: 340000 },
  "CESSNA|185":          { base: 140000,  floor: 90000,   ceiling: 220000 },
  "CESSNA|206":          { base: 200000,  floor: 110000,  ceiling: 380000 },
  "CESSNA|T206":         { base: 230000,  floor: 140000,  ceiling: 400000 },
  "CESSNA|207":          { base: 170000,  floor: 110000,  ceiling: 280000 },
  "CESSNA|210":          { base: 155000,  floor: 90000,   ceiling: 290000 },
  "CESSNA|T210":         { base: 185000,  floor: 110000,  ceiling: 320000 },
  "CESSNA|340":          { base: 320000,  floor: 220000,  ceiling: 520000 },
  "CESSNA|402":          { base: 260000,  floor: 160000,  ceiling: 420000 },
  "CESSNA|404":          { base: 350000,  floor: 220000,  ceiling: 550000 },
  "CESSNA|414":          { base: 360000,  floor: 240000,  ceiling: 580000 },
  "CESSNA|421":          { base: 420000,  floor: 280000,  ceiling: 680000 },
  "CESSNA|425":          { base: 1100000, floor: 700000,  ceiling: 1800000 },
  "CESSNA|441":          { base: 900000,  floor: 600000,  ceiling: 1500000 },
  // PIPER
  "PIPER|CHEROKEE":      { base: 42000,   floor: 24000,   ceiling: 72000 },
  "PIPER|WARRIOR":       { base: 55000,   floor: 35000,   ceiling: 90000 },
  "PIPER|ARCHER":        { base: 75000,   floor: 48000,   ceiling: 130000 },
  "PIPER|ARROW":         { base: 80000,   floor: 50000,   ceiling: 135000 },
  "PIPER|COMANCHE":      { base: 75000,   floor: 48000,   ceiling: 130000 },
  "PIPER|LANCE":         { base: 135000,  floor: 85000,   ceiling: 215000 },
  "PIPER|SARATOGA":      { base: 175000,  floor: 110000,  ceiling: 290000 },
  "PIPER|SENECA":        { base: 210000,  floor: 130000,  ceiling: 370000 },
  "PIPER|SENECA V":      { base: 600000,  floor: 440000,  ceiling: 820000 },
  "PIPER|NAVAJO":        { base: 280000,  floor: 170000,  ceiling: 460000 },
  "PIPER|CHIEFTAIN":     { base: 320000,  floor: 200000,  ceiling: 520000 },
  "PIPER|MALIBU":        { base: 450000,  floor: 300000,  ceiling: 680000 },
  "PIPER|MIRAGE":        { base: 750000,  floor: 550000,  ceiling: 1050000 },
  "PIPER|M350":          { base: 1100000, floor: 850000,  ceiling: 1450000 },
  "PIPER|M500":          { base: 2200000, floor: 1700000, ceiling: 2900000 },
  "PIPER|M600":          { base: 3100000, floor: 2500000, ceiling: 3900000 },
  "PIPER|AZTEC":         { base: 150000,  floor: 90000,   ceiling: 250000 },
  "PIPER|CHEYENNE":      { base: 750000,  floor: 480000,  ceiling: 1300000 },
  "PIPER|TOMAHAWK":      { base: 28000,   floor: 18000,   ceiling: 42000 },
  // BEECHCRAFT
  "BEECHCRAFT|BONANZA":  { base: 230000,  floor: 120000,  ceiling: 500000 },
  "BEECHCRAFT|A36":      { base: 320000,  floor: 200000,  ceiling: 520000 },
  "BEECHCRAFT|G36":      { base: 580000,  floor: 460000,  ceiling: 720000 },
  "BEECHCRAFT|BARON":    { base: 350000,  floor: 210000,  ceiling: 600000 },
  "BEECHCRAFT|58":       { base: 600000,  floor: 420000,  ceiling: 900000 },
  "BEECHCRAFT|KING AIR 90":  { base: 1400000, floor: 800000,  ceiling: 2500000 },
  "BEECHCRAFT|KING AIR 200": { base: 2800000, floor: 1600000, ceiling: 5000000 },
  "BEECHCRAFT|KING AIR 350": { base: 4500000, floor: 2800000, ceiling: 7500000 },
  "BEECHCRAFT|1900":     { base: 1600000, floor: 900000,  ceiling: 2800000 },
  "BEECHCRAFT|DUCHESS":  { base: 95000,   floor: 60000,   ceiling: 155000 },
  // CIRRUS
  "CIRRUS|SR20":         { base: 280000,  floor: 180000,  ceiling: 480000 },
  "CIRRUS|SR22":         { base: 420000,  floor: 260000,  ceiling: 700000 },
  "CIRRUS|SR22T":        { base: 620000,  floor: 420000,  ceiling: 950000 },
  "CIRRUS|SF50":         { base: 2200000, floor: 1700000, ceiling: 2900000 },
  // DIAMOND
  "DIAMOND|DA20":        { base: 90000,   floor: 60000,   ceiling: 140000 },
  "DIAMOND|DA40":        { base: 230000,  floor: 150000,  ceiling: 380000 },
  "DIAMOND|DA42":        { base: 420000,  floor: 300000,  ceiling: 600000 },
  "DIAMOND|DA62":        { base: 1100000, floor: 850000,  ceiling: 1500000 },
  // MOONEY
  "MOONEY|M20":          { base: 95000,   floor: 55000,   ceiling: 170000 },
  "MOONEY|M20J":         { base: 120000,  floor: 75000,   ceiling: 195000 },
  "MOONEY|M20R":         { base: 320000,  floor: 220000,  ceiling: 480000 },
  "MOONEY|ACCLAIM":      { base: 450000,  floor: 340000,  ceiling: 620000 },
  // TBM / DAHER
  "SOCATA|TBM 700":      { base: 1200000, floor: 800000,  ceiling: 1900000 },
  "SOCATA|TBM 850":      { base: 1900000, floor: 1400000, ceiling: 2700000 },
  "DAHER|TBM 900":       { base: 2800000, floor: 2200000, ceiling: 3600000 },
  "DAHER|TBM 910":       { base: 3200000, floor: 2600000, ceiling: 4100000 },
  "DAHER|TBM 930":       { base: 3600000, floor: 2900000, ceiling: 4600000 },
  "DAHER|TBM 940":       { base: 4200000, floor: 3400000, ceiling: 5200000 },
  "DAHER|TBM 960":       { base: 4800000, floor: 4000000, ceiling: 5800000 },
  // PILATUS
  "PILATUS|PC-12":       { base: 2800000, floor: 1800000, ceiling: 5000000 },
  "PILATUS|PC-12 NG":    { base: 3500000, floor: 2700000, ceiling: 5500000 },
  "PILATUS|PC-12 NGX":   { base: 4800000, floor: 4000000, ceiling: 6000000 },
  // SOCATA non-TBM
  "SOCATA|TB 9":         { base: 55000,   floor: 35000,   ceiling: 90000 },
  "SOCATA|TB 10":        { base: 65000,   floor: 42000,   ceiling: 105000 },
  "SOCATA|TB 20":        { base: 140000,  floor: 90000,   ceiling: 220000 },
  "SOCATA|TB 21":        { base: 180000,  floor: 120000,  ceiling: 280000 },
  // ZLIN
  "ZLIN|Z 42":           { base: 45000,   floor: 28000,   ceiling: 75000 },
  "ZLIN|Z 143":          { base: 75000,   floor: 48000,   ceiling: 120000 },
  "ZLIN|Z 242":          { base: 95000,   floor: 62000,   ceiling: 150000 },
  // LET
  "LET|L-200":           { base: 85000,   floor: 50000,   ceiling: 140000 },
  "LET|L-410":           { base: 900000,  floor: 550000,  ceiling: 1600000 },
};

const MAKE_BASE = {
  "CESSNA":     { base: 110000,  category: "ga_single" },
  "PIPER":      { base: 140000,  category: "ga_single" },
  "BEECHCRAFT": { base: 350000,  category: "ga_single" },
  "CIRRUS":     { base: 450000,  category: "ga_single" },
  "DIAMOND":    { base: 280000,  category: "ga_single" },
  "MOONEY":     { base: 200000,  category: "ga_single" },
  "SOCATA":     { base: 200000,  category: "ga_single" },
  "DAHER":      { base: 3500000, category: "turboprop" },
  "PILATUS":    { base: 3000000, category: "turboprop" },
  "TECNAM":     { base: 120000,  category: "ga_single" },
  "EXTRA":      { base: 320000,  category: "aerobatic" },
  "GRUMMAN":    { base: 50000,   category: "ga_single" },
  "MAULE":      { base: 90000,   category: "ga_single" },
  "COLUMBIA":   { base: 260000,  category: "ga_single" },
  "ROBIN":      { base: 80000,   category: "ga_single" },
  "ZLIN":       { base: 80000,   category: "ga_single" },
  "LET":        { base: 200000,  category: "ga_multi" },
};

const CATEGORY_BASE = {
  "ga_single":  90000,
  "ga_multi":   280000,
  "turboprop":  2500000,
  "jet":        5000000,
  "aerobatic":  250000,
  "utility":    400000,
  "helicopter": 500000,
  "lsa":        85000,
  "unknown":    120000,
};

function yearMultiplier(year) {
  if (!year || year < 1940) return 0.45;
  const age = CURRENT_YEAR - parseInt(year);
  if (age <= 0)  return 1.05;
  if (age <= 2)  return 0.92;
  if (age <= 5)  return 0.80;
  if (age <= 8)  return 0.70;
  if (age <= 12) return 0.60;
  if (age <= 18) return 0.52;
  if (age <= 25) return 0.46;
  if (age <= 35) return 0.42;
  if (age <= 50) return 0.44;
  return 0.48;
}

export function getOMVMBase(make, model, year) {
  const m = (make || "").toUpperCase().trim();
  const mod = (model || "").toUpperCase().trim();
  const yr = parseInt(year) || 0;

  // Try exact make|model
  let baseRecord = MAKE_MODEL_BASE[`${m}|${mod}`];

  // Try make + first token of model
  if (!baseRecord && mod) {
    const firstWord = mod.split(/[\s-]/)[0];
    baseRecord = MAKE_MODEL_BASE[`${m}|${firstWord}`];
  }

  // Partial match
  if (!baseRecord && mod) {
    const key = Object.keys(MAKE_MODEL_BASE).find(k => {
      const [km, kmod] = k.split("|");
      return km === m && (kmod.startsWith(mod.split(" ")[0]) || mod.startsWith(kmod));
    });
    if (key) baseRecord = MAKE_MODEL_BASE[key];
  }

  let baseValue;
  if (baseRecord) {
    const mult = yearMultiplier(yr);
    baseValue = baseRecord.base * mult;
    baseValue = Math.max(baseRecord.floor, Math.min(baseRecord.ceiling, baseValue));
  } else {
    const makeMeta = MAKE_BASE[m];
    if (makeMeta) {
      const mult = yearMultiplier(yr);
      const catBase = CATEGORY_BASE[makeMeta.category] || CATEGORY_BASE.unknown;
      baseValue = (makeMeta.base * mult * 0.7) + (catBase * 0.3);
    } else {
      baseValue = CATEGORY_BASE.unknown * yearMultiplier(yr);
    }
  }

  return Math.round(baseValue / 500) * 500;
}

export function getOMVMConfidence(make, model) {
  const m = (make || "").toUpperCase().trim();
  const mod = (model || "").toUpperCase().trim();
  if (MAKE_MODEL_BASE[`${m}|${mod}`]) return "high";
  if (MAKE_BASE[m]) return "medium";
  return "low";
}