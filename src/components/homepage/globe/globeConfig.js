// Per-mode configuration for the HeroGlobe.
// radius is fixed at 1 (the shader scales unit-sphere directions by uRadius);
// cameraDist / dotScale / count tune visual density and framing per context.
export const MODE_CONFIG = {
  hero:       { radius: 1, count: 10000, dotScale: 1.0,  cameraDist: 2.6, autoRotate: true,  rotateSpeed: 1.0, zoom: false, container: "h-full w-full" },
  dashboard:  { radius: 1, count: 6000,  dotScale: 0.85, cameraDist: 2.4, autoRotate: true,  rotateSpeed: 0.8, zoom: true,  container: "h-full w-full" },
  sidebar:    { radius: 1, count: 3000,  dotScale: 0.7,  cameraDist: 2.2, autoRotate: true,  rotateSpeed: 0.7, zoom: false, container: "h-full w-full" },
  background: { radius: 1, count: 5000,  dotScale: 0.8,  cameraDist: 2.8, autoRotate: true,  rotateSpeed: 0.4, zoom: false, container: "absolute inset-0" },
};

// Default aviation-hub routes shown on the hero when no `routes` prop is passed.
// Preserves the arcs the previous globe rendered.
export const DEFAULT_ROUTES = [
  { startLat: 40.7128, startLng: -74.006,  endLat: 51.5074, endLng: -0.1278,  altitude: 0.18 },
  { startLat: 51.5074, startLng: -0.1278,  endLat: 25.2048, endLng: 55.2708,  altitude: 0.28 },
  { startLat: 25.2048, startLng: 55.2708,  endLat: 1.3521,  endLng: 103.8198, altitude: 0.42 },
  { startLat: 34.0522, startLng: -118.2437,endLat: 50.1109, endLng: 8.6821,   altitude: 0.32 },
  { startLat: 50.0755, startLng: 14.4378,  endLat: 40.7128, endLng: -74.006,   altitude: 0.24 },
  { startLat: 48.8566, startLng: 2.3522,   endLat: -23.5505,endLng: -46.6333,  altitude: 0.40 },
];