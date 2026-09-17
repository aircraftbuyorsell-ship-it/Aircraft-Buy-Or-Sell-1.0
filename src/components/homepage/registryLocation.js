const STATES = [
  ['AL','Alabama',32.8,-86.8],['AK','Alaska',64,-153],['AZ','Arizona',34.3,-111.7],['AR','Arkansas',34.9,-92.4],['CA','California',37.2,-119.7],
  ['CO','Colorado',39,-105.5],['CT','Connecticut',41.6,-72.7],['DE','Delaware',39,-75.5],['FL','Florida',28,-82],['GA','Georgia',32.6,-83.4],
  ['HI','Hawaii',20.8,-156.3],['ID','Idaho',44.2,-114.5],['IL','Illinois',40,-89.2],['IN','Indiana',40,-86.1],['IA','Iowa',42.1,-93.5],
  ['KS','Kansas',38.5,-98],['KY','Kentucky',37.5,-85.3],['LA','Louisiana',31,-92],['ME','Maine',45.3,-69],['MD','Maryland',39,-76.7],
  ['MA','Massachusetts',42.3,-71.8],['MI','Michigan',44.3,-85.6],['MN','Minnesota',46,-94.6],['MS','Mississippi',32.7,-89.7],['MO','Missouri',38.5,-92.5],
  ['MT','Montana',47,-110],['NE','Nebraska',41.5,-99.8],['NV','Nevada',39,-117],['NH','New Hampshire',43.8,-71.6],['NJ','New Jersey',40.1,-74.5],
  ['NM','New Mexico',34.4,-106.1],['NY','New York',43,-75.5],['NC','North Carolina',35.6,-79.8],['ND','North Dakota',47.5,-100.5],['OH','Ohio',40.4,-82.8],
  ['OK','Oklahoma',35.6,-97.5],['OR','Oregon',44,-120.5],['PA','Pennsylvania',41,-77.7],['RI','Rhode Island',41.7,-71.5],['SC','South Carolina',33.8,-80.9],
  ['SD','South Dakota',44.5,-100],['TN','Tennessee',35.8,-86.4],['TX','Texas',31,-99],['UT','Utah',39.3,-111.7],['VT','Vermont',44,-72.7],
  ['VA','Virginia',37.5,-79],['WA','Washington',47.4,-120.7],['WV','West Virginia',38.6,-80.6],['WI','Wisconsin',44.6,-89.6],['WY','Wyoming',43,-107.5],['DC','District of Columbia',38.9,-77],['PR','Puerto Rico',18.2,-66.5]
];
const COUNTRIES = [
  ['US|USA|United States|United States of America',39,-98],['CZ|CZE|Czechia|Czech Republic',49.8,15.5],['SK|SVK|Slovakia',48.7,19.7],
  ['GB|GBR|UK|United Kingdom',54,-2],['DE|DEU|Germany',51,10],['FR|FRA|France',46.6,2.2],['IT|ITA|Italy',42.8,12.8],['ES|ESP|Spain',40.4,-3.7],
  ['AT|AUT|Austria',47.6,14.1],['CH|CHE|Switzerland',46.8,8.2],['PL|POL|Poland',52,19],['NL|NLD|Netherlands',52.2,5.3],['BE|BEL|Belgium',50.8,4.5],
  ['SE|SWE|Sweden',62,15],['NO|NOR|Norway',62,10],['DK|DNK|Denmark',56,10],['FI|FIN|Finland',64,26],['IE|IRL|Ireland',53.4,-8],
  ['PT|PRT|Portugal',39.5,-8],['HU|HUN|Hungary',47.2,19.5],['RO|ROU|Romania',46,25],['GR|GRC|Greece',39,22],['HR|HRV|Croatia',45.1,15.2],
  ['CA|CAN|Canada',56,-106],['MX|MEX|Mexico',23.6,-102.5],['BR|BRA|Brazil',-14.2,-51.9],['AR|ARG|Argentina',-38.4,-63.6],['CL|CHL|Chile',-35.7,-71.5],
  ['AU|AUS|Australia',-25,134],['NZ|NZL|New Zealand',-41,174],['ZA|ZAF|South Africa',-30.6,22.9],['AE|ARE|UAE|United Arab Emirates',24,54],
  ['SA|SAU|Saudi Arabia',24,45],['TR|TUR|Turkey|Türkiye',39,35],['IN|IND|India',22,79],['CN|CHN|China',35,104],['JP|JPN|Japan',36,138],
  ['SG|SGP|Singapore',1.35,103.8],['MY|MYS|Malaysia',4,102],['TH|THA|Thailand',15,101],['ID|IDN|Indonesia',-2,118],['PH|PHL|Philippines',13,122],
  ['MT|MLT|Malta',35.9,14.4],['IM|IMN|Isle of Man',54.2,-4.5],['SM|SMR|San Marino',43.9,12.5],['RU|RUS|Russia',61,100]
];
export default function registryLocation(data, registration) {
  const ac = data?.found ? data.aircraft || {} : {};
  const country = String(ac.country || ac.origin_country || data?.origin_country || '').trim().toUpperCase();
  const isUS = /^N\d/.test(registration) || /^(US|USA|UNITED STATES|UNITED STATES OF AMERICA)$/.test(country);
  const state = String(ac.state || '').trim().toUpperCase();
  const match = isUS && STATES.find(([code, name]) => code === state || name.toUpperCase() === state);
  if (match) return { lat: match[2], lon: match[3], locationLabel: `${match[1]} · approximate registry region` };
  const nation = COUNTRIES.find(([names]) => names.toUpperCase().split('|').includes(country));
  if (nation) return { lat: nation[1], lon: nation[2], locationLabel: `${nation[0].split('|').at(-1)} · approximate registry region` };
  return { lat: 39, lon: -98, locationLabel: 'Location unavailable · default US view' };
}