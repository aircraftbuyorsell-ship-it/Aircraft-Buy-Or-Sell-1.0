// Shared maths for the dot-globe: coordinate conversion, Fibonacci sphere
// distribution, and a small value-noise / fbm used to mask continents.

// Lat/lng → 3D position on a sphere of the given radius.
export function latLngToVec3(lat, lng, radius = 1) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return [
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  ];
}

// Unit-sphere direction → {lat, lng} in degrees.
export function vec3ToLatLng(x, y, z) {
  const lat = Math.asin(Math.max(-1, Math.min(1, y))) * (180 / Math.PI);
  const lng = Math.atan2(z, x) * (180 / Math.PI);
  return { lat, lng };
}

// N evenly-spaced points on a unit sphere via the golden-angle spiral.
export function fibonacciSphere(count) {
  const pts = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  const denom = count > 1 ? count - 1 : 1;
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / denom) * 2; // 1 → -1
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * i;
    pts.push([Math.cos(theta) * r, y, Math.sin(theta) * r]);
  }
  return pts;
}

// Deterministic hash → [0,1).
function hash(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

// Smooth value noise with bilinear interpolation.
function valueNoise(x, y) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

// Fractal Brownian motion — layered noise producing organic continent shapes.
export function fbm(x, y, octaves = 4) {
  let val = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    val += amp * valueNoise(x * freq, y * freq);
    freq *= 2;
    amp *= 0.5;
  }
  return val;
}