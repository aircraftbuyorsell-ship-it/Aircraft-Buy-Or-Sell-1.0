export const PALETTE = {
  void: "#0a0602",
  deep: "#140b04",
  surface: "#1c1008",
  panel: "#241508",
  cream: "#f5e8ce",
  pearl: "#ede0c4",
  cognac: "#c8862e",
  amber: "#d4a030",
  gold: "#e8c060",
  muted: "#7a6248",
  rust: "#c84828",
  sage: "#7a9a70",
};

export const REGIONS = [
  { label: "Europe", center: [50, 14], zoom: 5, bbox: { lamin: 35, lomin: -10, lamax: 60, lomax: 35 } },
  { label: "North America", center: [40, -95], zoom: 4, bbox: { lamin: 25, lomin: -130, lamax: 55, lomax: -60 } },
  { label: "UK & Ireland", center: [53, -2], zoom: 6, bbox: { lamin: 49, lomin: -11, lamax: 61, lomax: 3 } },
  { label: "Central Europe", center: [50, 16], zoom: 7, bbox: { lamin: 46, lomin: 10, lamax: 55, lomax: 24 } },
  { label: "Middle East", center: [25, 45], zoom: 5, bbox: { lamin: 12, lomin: 30, lamax: 40, lomax: 65 } },
  { label: "Asia Pacific", center: [25, 115], zoom: 4, bbox: { lamin: -10, lomin: 90, lamax: 45, lomax: 145 } },
];

export const toRegionKey = (label) => label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const m2ft = (m) => (m != null ? Math.round(m * 3.28084) : null);
export const mps2kts = (v) => (v != null ? Math.round(v * 1.94384) : null);