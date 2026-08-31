const KNOWN_MAKES = [
  "Cessna","Piper","Beechcraft","Beech","Mooney","Cirrus","Diamond",
  "Grumman","Socata","Tecnam","Robin","Extra","Kitfox","Maule","Bellanca",
  "Commander","Rockwell","Lake","Christen","Enstrom","Robinson","Bell",
  "Sikorsky","Airbus","Boeing","Embraer","Bombardier","Dassault","Gulfstream",
  "Learjet","Hawker","Pilatus","Daher","Lancair","Columbia","Glasair",
  "Velocity","Zenith","Jabiru","Pipistrel","MD","McDonnell","Douglas",
  "Mitsubishi","Van's","Vans","Aerostar","Aztec","Navajo","Seneca",
  "Cherokee","Archer","Arrow","Comanche","Saratoga","Meridian","Matrix",
  "Malibu","Lance","Turbo","Bonanza","Baron","King","Premier","Staggerwing",
  "Travel","Sundowner","Skipper","Musketeer","Sierra","Sport","Duchess",
  "Twin","Islander","Trislander","Turbine","Swift","Luscombe","Aeronca",
  "Taylorcraft","Stinson","Globe","Temco","Ercoupe","Forney","Alon",
  "Siai","Marchetti","Partenavia","Valentin","Scheibe","Grob","Stemme",
  "Lange","Antares","SZD","PZL","Let","Zlin",
];

export function cleanAircraftMake(raw) {
  if (!raw) return "";
  const str = raw.trim();
  if (str.split(/\s+/).length === 1) return str;
  for (const brand of KNOWN_MAKES) {
    const re = new RegExp(`\\b${brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (re.test(str)) {
      const match = str.match(re);
      return match ? match[0] : str;
    }
  }
  const words = str.split(/\s+/);
  return words.length > 2 ? words[words.length - 1] : str;
}