/**
 * Cleans FAA owner names that leak into the aircraft make field.
 * FAA relay format sometimes stores "LASTNAME FIRSTNAME CESSNA" — this extracts the brand.
 */
const KNOWN_MAKES = [
  "Cessna","Piper","Beechcraft","Beech","Mooney","Cirrus","Diamond",
  "Grumman","Socata","Tecnam","Robin","Extra","Kitfox","Maule","Bellanca",
  "Commander","Rockwell","Lake","Christen","Enstrom","Robinson","Bell",
  "Sikorsky","Airbus","Boeing","Embraer","Bombardier","Dassault","Gulfstream",
  "Learjet","Hawker","Pilatus","Daher","Lancair","Columbia","Glasair",
  "Velocity","Zenith","Jabiru","Pipistrel","MD","McDonnell","Douglas",
  "Mitsubishi","Van's","Vans","RV-","Aerostar","Aztec","Navajo","Seneca",
  "Cherokee","Archer","Arrow","Comanche","Saratoga","Meridian","Matrix",
  "Malibu","Lance","Turbo","Bonanza","Baron","King","Premier","Staggerwing",
  "Travel","Sundowner","Skipper","Musketeer","Sierra","Sport","Duchess",
  "Twin","Islander","Trislander","Turbine","Swift","Luscombe","Aeronca",
  "Taylorcraft","Stinson","Globe","Temco","Funk","Ercoupe","Forney","Alon",
  "Mooney","Siai","Marchetti","Partenavia","Valentin","Scheibe","Grob",
  "Rolladen","Schneider","Schempp","Hirth","Glasflügel","Glaser","DG",
  "Stemme","Lange","Antares","SZD","PZL","Let","Zlin","Zlín",
];

export function cleanAircraftMake(raw) {
  if (!raw) return "";
  const str = raw.trim();
  // If it's already a short word / known brand, return as-is
  if (str.split(/\s+/).length === 1) return str;
  // Search for a known make token (case-insensitive)
  for (const brand of KNOWN_MAKES) {
    const re = new RegExp(`\\b${brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (re.test(str)) {
      const match = str.match(re);
      return match ? match[0] : str;
    }
  }
  // Fallback: if >2 words and none match a brand, take the last word only
  // (FAA format: LAST FIRST BRAND → last word is usually brand)
  const words = str.split(/\s+/);
  return words.length > 2 ? words[words.length - 1] : str;
}