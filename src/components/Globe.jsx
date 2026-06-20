import { useState, useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { base44 } from "@/api/base44Client";
import { useTheme } from "@/lib/useTheme";
import {
  Sparkles, CheckCircle2, AlertCircle, X, ExternalLink,
} from "lucide-react";
import GlobeClock from "@/components/dashboard/GlobeClock";
import { DEFAULT_FILTER } from "@/components/dashboard/GlobeLayerFilter";

const EARTH_BLUE = "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg";
const EARTH_NIGHT = "https://unpkg.com/three-globe/example/img/earth-night.jpg";

const REG_PREFIX_MAP = {
  "N": [38, -97], "C": [56, -96], "CF": [56, -96], "CG": [56, -96],
  "G": [54, -2], "D": [51, 10], "F": [46, 2], "I": [42, 12],
  "EC": [40, -4], "PH": [52, 5], "OE": [47, 14], "SP": [52, 20],
  "OK": [50, 15], "OM": [49, 20], "HA": [47, 19], "YR": [46, 25],
  "LZ": [43, 25], "9A": [45, 16], "SX": [39, 22], "SE": [60, 18],
  "LN": [60, 8], "OH": [61, 26], "OY": [56, 10], "OO": [51, 4],
  "LX": [50, 6], "CS": [39, -8], "EI": [53, -8], "UR": [49, 31],
  "RA": [60, 100], "VH": [-25, 133], "ZK": [-41, 174], "JA": [36, 138],
  "B": [35, 105], "VT": [20, 78], "HL": [36, 128], "9V": [1, 104],
  "HS": [15, 101], "PK": [-6, 107], "9M": [4, 102], "RP": [13, 122],
  "XA": [23, -102], "XB": [23, -102], "XC": [23, -102],
  "PP": [-15, -50], "PT": [-15, -50], "PR": [-15, -50],
  "LV": [-34, -64], "LQ": [-34, -64], "CC": [-33, -71],
  "HK": [4, -72], "OB": [-10, -76], "ZS": [-29, 25],
  "ZT": [-29, 25], "ZU": [-29, 25], "A6": [24, 54],
  "SU": [27, 30], "5N": [9, 8], "5Y": [-1, 37],
  "4X": [31, 35], "HZ": [24, 45], "TC": [39, 35],
  "VN": [14, 108], "HB": [47, 8]
};

const US_STATE_CENTROIDS = {
  AL: [32.7, -86.7], AK: [61.4, -150.0], AZ: [34.3, -111.7], AR: [34.8, -92.4],
  CA: [36.4, -119.7], CO: [39.0, -105.5], CT: [41.6, -72.8], DE: [39.1, -75.5],
  FL: [28.5, -81.5], GA: [32.7, -83.4], HI: [21.1, -157.5], ID: [44.3, -114.7],
  IL: [40.0, -89.5], IN: [39.9, -86.3], IA: [42.0, -93.5], KS: [38.5, -97.5],
  KY: [37.5, -85.3], LA: [31.0, -92.0], ME: [45.2, -69.2], MD: [39.0, -76.8],
  MA: [42.3, -71.8], MI: [43.4, -84.6], MN: [46.0, -94.5], MS: [32.6, -89.9],
  MO: [38.3, -92.4], MT: [47.0, -109.6], NE: [41.5, -99.7], NV: [39.0, -116.5],
  NH: [43.7, -71.6], NJ: [40.2, -74.5], NM: [34.5, -106.0], NY: [43.0, -75.5],
  NC: [35.5, -79.5], ND: [47.5, -100.5], OH: [40.3, -82.8], OK: [35.5, -97.5],
  OR: [43.9, -120.5], PA: [40.9, -77.8], RI: [41.6, -71.5], SC: [33.9, -80.9],
  SD: [44.5, -100.5], TN: [35.8, -86.5], TX: [31.5, -99.5], UT: [39.5, -112.0],
  VT: [44.0, -72.6], VA: [37.5, -79.0], WA: [47.5, -120.5], WV: [38.8, -80.5],
  WI: [44.5, -89.5], WY: [42.8, -107.5], DC: [38.9, -77.0],
};

const COMMERCIAL_AIRLINER_TYPES = new Set([
  "B731","B732","B733","B734","B735","B736","B737","B738","B739",
  "B73H","B73G","B73W","B74D","B741","B742","B743","B744","B748",
  "B752","B753","B762","B763","B764","B772","B773","B77L","B77W",
  "B788","B789","B78X",
  "A318","A319","A320","A321","A32N","A32Q",
  "A332","A333","A338","A339","A342","A343","A345","A346",
  "A359","A35K","A388",
  "E170","E175","E190","E195","E290","E295",
  "CRJ1","CRJ2","CRJ7","CRJ9","CRJX",
  "DH8A","DH8B","DH8C","DH8D","AT43","AT44","AT45","AT46","AT72","AT73","AT75","AT76",
  "MD11","MD80","MD81","MD82","MD83","MD87","MD88","MD90",
  "DC10","DC85","DC86","DC87","DC93","DC94","DC95",
  "F100","F70","RJ85","RJ1H","BA46"
]);

const FALLBACK_REGIONS = [
  [38, -97], [51, 10], [46, 2], [42, 12], [54, -2], [60, 18], [40, -4],
  [-34, -64], [-25, 133], [35, 105], [20, 78], [-15, -50], [4, -72], [31, 35],
  [24, 54], [-29, 25], [39, 35], [14, 108], [47, 8], [52, 20], [36, 128],
  [1, 104], [-41, 174], [60, 100], [-33, -71], [-10, -76]
];

function listingToLatLon(listing, index) {
  if (listing.registration) {
    const reg = listing.registration.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    for (const len of [2, 1]) {
      const prefix = reg.substring(0, len);
      if (REG_PREFIX_MAP[prefix]) {
        const [lat, lon] = REG_PREFIX_MAP[prefix];
        return { lat: lat + Math.sin(index * 4.7) * 2.5, lon: lon + Math.cos(index * 3.9) * 3.5 };
      }
    }
  }
  const [flat, flon] = FALLBACK_REGIONS[index % FALLBACK_REGIONS.length];
  return { lat: flat + Math.sin(index * 3.1) * 3, lon: flon + Math.cos(index * 5.7) * 4 };
}

function atiColor(score) {
  if (!score) return [0.4, 0.4, 0.5];
  if (score >= 90) return [0.0, 0.96, 1.0];
  if (score >= 72) return [0.48, 0.0, 1.0];
  if (score >= 54) return [0.83, 0.63, 0.09];
  return [1.0, 0.3, 0.43];
}

function latLonToVec3(lat, lon, r) {
  const phi = (90 - lat) * Math.PI / 180;
  const theta = (lon + 180) * Math.PI / 180;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
}

function dotTexture() {
  const cv = document.createElement("canvas");
  cv.width = cv.height = 48;
  const x = cv.getContext("2d");
  const g = x.createRadialGradient(24, 24, 0, 24, 24, 24);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,0.9)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g;
  x.beginPath();
  x.arc(24, 24, 24, 0, 7);
  x.fill();
  const tex = new THREE.CanvasTexture(cv);
  tex.flipY = false;
  return tex;
}

function liveTrafficTexture() {
  const cv = document.createElement("canvas");
  cv.width = cv.height = 96;
  const ctx = cv.getContext("2d");
  const glow = ctx.createRadialGradient(48, 48, 4, 48, 48, 42);
  glow.addColorStop(0, "rgba(34, 197, 94, 0.95)");
  glow.addColorStop(0.25, "rgba(34, 197, 94, 0.55)");
  glow.addColorStop(0.55, "rgba(22, 163, 74, 0.18)");
  glow.addColorStop(1, "rgba(22, 163, 74, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();ctx.arc(48, 48, 42, 0, Math.PI * 2);ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(45, 10, 6, 66);
  ctx.beginPath();ctx.moveTo(48, 26);ctx.lineTo(18, 44);ctx.lineTo(20, 48);ctx.lineTo(48, 32);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(48, 26);ctx.lineTo(78, 44);ctx.lineTo(76, 48);ctx.lineTo(48, 32);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(48, 56);ctx.lineTo(26, 68);ctx.lineTo(28, 72);ctx.lineTo(48, 62);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(48, 56);ctx.lineTo(70, 68);ctx.lineTo(68, 72);ctx.lineTo(48, 62);ctx.closePath();ctx.fill();
  ctx.strokeStyle = "rgba(34, 197, 94, 0.8)";ctx.lineWidth = 1;
  ctx.beginPath();ctx.moveTo(48, 10);ctx.lineTo(48, 76);ctx.moveTo(18, 44);ctx.lineTo(48, 28);ctx.lineTo(78, 44);ctx.moveTo(26, 68);ctx.lineTo(48, 58);ctx.lineTo(70, 68);ctx.stroke();
  const tex = new THREE.CanvasTexture(cv);
  tex.flipY = false;
  return tex;
}

function aircraftSilhouetteTexture() {
  const cv = document.createElement("canvas");
  cv.width = cv.height = 96;
  const ctx = cv.getContext("2d");
  const glow = ctx.createRadialGradient(48, 48, 4, 48, 48, 42);
  glow.addColorStop(0, "rgba(0, 220, 255, 0.95)");
  glow.addColorStop(0.25, "rgba(0, 180, 255, 0.55)");
  glow.addColorStop(0.55, "rgba(0, 100, 255, 0.18)");
  glow.addColorStop(1, "rgba(0, 40, 200, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();ctx.arc(48, 48, 42, 0, Math.PI * 2);ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(45, 10, 6, 66);
  ctx.beginPath();ctx.moveTo(48, 26);ctx.lineTo(18, 44);ctx.lineTo(20, 48);ctx.lineTo(48, 32);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(48, 26);ctx.lineTo(78, 44);ctx.lineTo(76, 48);ctx.lineTo(48, 32);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(48, 56);ctx.lineTo(26, 68);ctx.lineTo(28, 72);ctx.lineTo(48, 62);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(48, 56);ctx.lineTo(70, 68);ctx.lineTo(68, 72);ctx.lineTo(48, 62);ctx.closePath();ctx.fill();
  ctx.strokeStyle = "rgba(0, 220, 255, 0.8)";ctx.lineWidth = 1;
  ctx.beginPath();ctx.moveTo(48, 10);ctx.lineTo(48, 76);ctx.moveTo(18, 44);ctx.lineTo(48, 28);ctx.lineTo(78, 44);ctx.moveTo(26, 68);ctx.lineTo(48, 58);ctx.lineTo(70, 68);ctx.stroke();
  const tex = new THREE.CanvasTexture(cv);
  tex.flipY = false;
  return tex;
}

function faaClusterTexture() {
  const cv = document.createElement("canvas");
  cv.width = cv.height = 64;
  const x = cv.getContext("2d");
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(245,200,66,1)");
  g.addColorStop(0.2, "rgba(212,160,23,0.95)");
  g.addColorStop(0.5, "rgba(212,160,23,0.4)");
  g.addColorStop(1, "rgba(212,160,23,0)");
  x.fillStyle = g;
  x.beginPath();
  x.arc(32, 32, 32, 0, 7);
  x.fill();
  const tex = new THREE.CanvasTexture(cv);
  tex.flipY = false;
  return tex;
}

const CATEGORY_TEST = {
  all: () => true,
  ga: (a) => a.category >= 1 && a.category <= 3,
  turboprop: (a) => a.category === 4,
  jet: (a) => a.category === 5 || a.category === 6,
  heli: (a) => a.category === 8 || a.category === 9,
  other: (a) => a.category === 0 || a.category >= 10,
};

const ATI_RANGE_TEST = {
  all: () => true,
  exceptional: (l) => (l.ati_score || 0) >= 90,
  strong: (l) => { const s = l.ati_score || 0; return s >= 72 && s <= 89; },
  fair: (l) => { const s = l.ati_score || 0; return s >= 54 && s <= 71; },
  caution: (l) => { const s = l.ati_score || 0; return s > 0 && s < 54; },
  unscored: (l) => !l.ati_score || l.ati_score === 0,
};

export default function Globe({
  listings = [],
  filter = DEFAULT_FILTER,
  focusLocation,
  onSelectListing,
}) {
  const isDark = useTheme();
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const globeRef = useRef(null);
  const acPointsRef = useRef(null);
  const acGeoRef = useRef(null);
  const lPointsRef = useRef(null);
  const lGeoRef = useRef(null);
  const livePointsRef = useRef(null);
  const liveGeoRef = useRef(null);
  const faaGeoRef = useRef(null);
  const faaPointsRef = useRef(null);
  const metaRef = useRef([]);
  const lMetaRef = useRef([]);
  const liveMetaRef = useRef([]);
  const faaMetaRef = useRef([]);
  const rotRef = useRef({ y: -Math.PI / 2, x: 0 });
  const dragRef = useRef({ active: false, px: 0, py: 0 });
  const sunRef = useRef(null);
  const nightFillRef = useRef(null);
  const downRef = useRef(null);
  const rafRef = useRef(null);
  const timerRef = useRef(null);
  const loadingRef = useRef(false);
  const listingsRef = useRef(listings);
  const filterRef = useRef(filter);
  const adsbCache = useRef([]);
  const liveCache = useRef([]);
  const autoRotateRef = useRef(true);

  useEffect(() => {listingsRef.current = listings;}, [listings]);
  useEffect(() => {filterRef.current = filter;}, [filter]);

  useEffect(() => {
    if (adsbCache.current.length > 0) renderToGlobe(adsbCache.current);
    if (liveCache.current.length > 0) renderLiveToGlobe(liveCache.current);
  }, [filter]);

  const focusTargetRef = useRef(null);
  const focusAnimRef = useRef(null);
  useEffect(() => {
    if (!focusLocation?.lat || !focusLocation?.lon) {
      focusTargetRef.current = null;
      return;
    }
    const targetY = -(focusLocation.lon * Math.PI / 180) - Math.PI / 2;
    const targetX = focusLocation.lat * Math.PI / 180 * 0.6;
    focusTargetRef.current = { y: targetY, x: Math.max(-1.3, Math.min(1.3, targetX)) };
    autoRotateRef.current = false;

    if (focusAnimRef.current) cancelAnimationFrame(focusAnimRef.current);
    const animate = () => {
      const target = focusTargetRef.current;
      if (!target) return;
      const dy = target.y - rotRef.current.y;
      const dx = target.x - rotRef.current.x;
      if (Math.abs(dy) < 0.001 && Math.abs(dx) < 0.001) {
        rotRef.current.y = target.y;
        rotRef.current.x = target.x;
        setTimeout(() => { autoRotateRef.current = true; }, 3000);
        return;
      }
      rotRef.current.y += dy * 0.08;
      rotRef.current.x += dx * 0.08;
      focusAnimRef.current = requestAnimationFrame(animate);
    };
    animate();
    return () => { if (focusAnimRef.current) cancelAnimationFrame(focusAnimRef.current); };
  }, [focusLocation]);

  const [trafficCount, setTrafficCount] = useState(0);
  const [trafficStatus, setTrafficStatus] = useState("idle");
  const [liveCount, setLiveCount] = useState(0);
  const [faaCount, setFaaCount] = useState(0);
  const [faaStateCount, setFaaStateCount] = useState(0);
  const [detail, setDetail] = useState(null);
  const [scoringMap, setScoringMap] = useState({});

  const firstTrafficLoadRef = useRef(true);
  const fetchTraffic = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setTrafficStatus("loading");
    try {
      const res = await base44.functions.invoke("cachedTraffic", {
        region_key: "world",
        region_label: "Global",
        // Only bypass the server cache on the very first load; subsequent
        // polls reuse the cache to avoid hammering OpenSky / hitting rate limits.
        force_refresh: firstTrafficLoadRef.current,
        limit: 1000,
        allow_heavy: true
      });
      firstTrafficLoadRef.current = false;
      const ac = res.data?.aircraft || [];
      adsbCache.current = ac;
      renderToGlobe(ac);
      setTrafficStatus("live");
    } catch (e) {
      setTrafficStatus("error");
    } finally {
      loadingRef.current = false;
    }
  }, []);

  const fetchLive = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("fetchLiveTraffic", { limit: 2000 });
      const ac = res.data?.aircraft || [];
      liveCache.current = ac;
      renderLiveToGlobe(ac);
    } catch (_) {}
  }, []);

  const renderLiveToGlobe = useCallback((aircraft) => {
    const liveGeo = liveGeoRef.current;
    if (!liveGeo) return;
    const f = filterRef.current?.liveDb;
    if (f && !f.enabled) {
      liveGeo.setAttribute("position", new THREE.Float32BufferAttribute([], 3));
      liveGeo.setAttribute("color", new THREE.Float32BufferAttribute([], 3));
      liveGeo.attributes.position.needsUpdate = true;
      liveGeo.attributes.color.needsUpdate = true;
      liveMetaRef.current = [];
      setLiveCount(0);
      return;
    }
    const pos = [], meta = [];
    for (const ac of aircraft) {
      if (ac.latitude == null || ac.longitude == null) continue;
      if (ac.aircraft_type && COMMERCIAL_AIRLINER_TYPES.has(ac.aircraft_type.toUpperCase())) continue;
      const v = latLonToVec3(ac.latitude, ac.longitude, 1.014 + Math.min(ac.altitude_ft || 0, 45000) / 6371000 * 22);
      pos.push(v.x, v.y, v.z);
      meta.push(ac);
    }
    liveGeo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    liveGeo.setAttribute("color", new THREE.Float32BufferAttribute(
      Array.from({length: meta.length * 3}, (_, i) => i % 3 === 1 ? 0.77 : i % 3 === 0 ? 0.13 : 0.22), 3));
    liveGeo.attributes.position.needsUpdate = true;
    liveGeo.attributes.color.needsUpdate = true;
    liveMetaRef.current = meta;
    setLiveCount(meta.length);
  }, []);

  const renderToGlobe = useCallback((aircraft) => {
    const acGeo = acGeoRef.current;
    if (!acGeo) return;
    const f = filterRef.current?.adsb;
    if (f && !f.enabled) {
      acGeo.setAttribute("position", new THREE.Float32BufferAttribute([], 3));
      acGeo.attributes.position.needsUpdate = true;
      metaRef.current = [];
      setTrafficCount(0);
      return;
    }
    const catTest = CATEGORY_TEST[f?.category] || CATEGORY_TEST.all;
    const pos = [], meta = [];
    for (const ac of aircraft) {
      if (ac.latitude == null || ac.longitude == null) continue;
      if (ac.aircraft_type && COMMERCIAL_AIRLINER_TYPES.has(ac.aircraft_type.toUpperCase())) continue;
      if (!catTest(ac)) continue;
      const altM = ac.baro_altitude || 0;
      const v = latLonToVec3(ac.latitude, ac.longitude, 1.012 + Math.min(altM, 14000) / 6371000 * 22);
      pos.push(v.x, v.y, v.z);
      meta.push(ac);
    }
    acGeo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    acGeo.attributes.position.needsUpdate = true;
    metaRef.current = meta;
    setTrafficCount(meta.length);
  }, []);

  const renderListings = useCallback((listingsData) => {
    const lGeo = lGeoRef.current;
    if (!lGeo) return;
    const f = filterRef.current?.listings;
    if (f && !f.enabled) {
      const empty = new THREE.Float32BufferAttribute([], 3);
      lGeo.setAttribute("position", empty);
      lGeo.setAttribute("color", empty);
      lGeo.attributes.position.needsUpdate = true;
      lGeo.attributes.color.needsUpdate = true;
      lMetaRef.current = [];
      return;
    }
    const atiTest = ATI_RANGE_TEST[f?.atiRange] || ATI_RANGE_TEST.all;
    const statusFilter = f?.status || "all";
    const pos = [], col = [], meta = [];
    listingsData.forEach((l, i) => {
      if (!atiTest(l)) return;
      if (statusFilter !== "all" && l.status !== statusFilter) return;
      const coords = listingToLatLon(l, i);
      if (!coords) return;
      const v = latLonToVec3(coords.lat, coords.lon, 1.016);
      pos.push(v.x, v.y, v.z);
      const c = atiColor(l.ati_score);
      col.push(c[0], c[1], c[2]);
      meta.push(l);
    });
    lGeo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    lGeo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    lGeo.attributes.position.needsUpdate = true;
    lGeo.attributes.color.needsUpdate = true;
    lMetaRef.current = meta;
  }, []);

  const renderFaaToGlobe = useCallback((faaAircraft, listingsForAti) => {
    const faaGeo = faaGeoRef.current;
    if (!faaGeo) return;
    const f = filterRef.current?.faaRegistry;
    if (!f || !f.enabled) {
      faaGeo.setAttribute("position", new THREE.Float32BufferAttribute([], 3));
      faaGeo.attributes.position.needsUpdate = true;
      faaMetaRef.current = [];
      setFaaCount(0);
      setFaaStateCount(0);
      return;
    }
    const stateMap = {};
    for (const ac of faaAircraft) {
      const st = (ac.state || "").trim().toUpperCase() || "UNKNOWN";
      if (!stateMap[st]) stateMap[st] = { count: 0, aircraft: [], typeCounts: {} };
      stateMap[st].count++;
      stateMap[st].aircraft.push(ac);
      const t = ac.type_aircraft || "UNK";
      stateMap[st].typeCounts[t] = (stateMap[st].typeCounts[t] || 0) + 1;
    }
    const listingByReg = {};
    for (const l of (listingsForAti || [])) {
      if (l.registration) {
        const nNum = l.registration.replace(/^N/i, "").trim().toUpperCase();
        if (nNum) listingByReg[nNum] = l;
      }
    }
    const states = Object.keys(stateMap);
    const pos = [], meta = [];
    for (const st of states) {
      const [lat, lon] = US_STATE_CENTROIDS[st] || [38, -97];
      const v = latLonToVec3(lat, lon, 1.018);
      pos.push(v.x, v.y, v.z);
      const sd = stateMap[st];
      const topTypes = Object.entries(sd.typeCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
      const sampleNums = sd.aircraft.slice(0, 5).map(a => a.n_number);
      let atiSum = 0, atiMatch = 0;
      for (const ac of sd.aircraft) {
        const l = listingByReg[ac.n_number?.trim().toUpperCase()];
        if (l?.ati_score) { atiSum += l.ati_score; atiMatch++; }
      }
      meta.push({
        state: st, count: sd.count,
        topTypes: topTypes.map(([k, v]) => `${k} (${v})`),
        sampleNums,
        atiEstimate: atiMatch > 0 ? Math.round(atiSum / atiMatch) : null,
      });
    }
    faaGeo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    faaGeo.attributes.position.needsUpdate = true;
    faaMetaRef.current = meta;
    setFaaCount(faaAircraft.length);
    setFaaStateCount(states.length);
  }, []);

  useEffect(() => {
    renderListings(listings);
  }, [listings, filter, renderListings]);

  const [faaAircraft, setFaaAircraft] = useState([]);
  useEffect(() => {
    const f = filter?.faaRegistry;
    if (!f || !f.enabled) {
      setFaaAircraft([]);
      return;
    }
    if (faaAircraft.length > 0) return;
    base44.entities.FAAAircraft.list("-created_date", 5000).then((data) => {
      setFaaAircraft(data || []);
    }).catch(() => {});
  }, [filter?.faaRegistry?.enabled]);

  useEffect(() => {
    if (faaAircraft.length > 0) {
      renderFaaToGlobe(faaAircraft, listings);
    }
  }, [faaAircraft, filter, renderFaaToGlobe, listings]);

  const handleScoreAircraft = useCallback(async (ac) => {
    const reg = ac.registration || "";
    const nNumber = reg.replace(/^N/i, "").trim();
    if (!nNumber) return;
    setScoringMap((prev) => ({ ...prev, [ac.icao24]: "loading" }));
    try {
      const res = await base44.functions.invoke("syncFaaToAtiCard", { n_number: nNumber });
      if (res.data?.listingId) {
        setScoringMap((prev) => ({
          ...prev,
          [ac.icao24]: {
            status: "success",
            listingId: res.data.listingId,
            atiScore: res.data.atiScore,
            cardCode: res.data.cardCode
          }
        }));
      } else {
        setScoringMap((prev) => ({ ...prev, [ac.icao24]: { status: "error", message: res.data?.error || "No data found" } }));
      }
    } catch (e) {
      setScoringMap((prev) => ({ ...prev, [ac.icao24]: { status: "error", message: e?.response?.data?.error || e.message || "Scoring failed" } }));
    }
  }, []);

  const pick = useCallback((e) => {
    const cv = canvasRef.current;
    if (!cv) return;
    const r = cv.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      (e.clientX - r.left) / r.width * 2 - 1,
      -((e.clientY - r.top) / r.height) * 2 + 1
    );
    const ray = new THREE.Raycaster();
    ray.params.Points.threshold = 0.025;

    if (lPointsRef.current && lPointsRef.current.geometry.attributes.position) {
      ray.setFromCamera(mouse, cameraRef.current);
      const lHits = ray.intersectObject(lPointsRef.current);
      if (lHits.length > 0) {
        const listing = lMetaRef.current[lHits[0].index];
        if (onSelectListing) onSelectListing(listing);
        else setDetail({ type: "listing", data: listing });
        return;
      }
    }

    if (acPointsRef.current && acPointsRef.current.geometry.attributes.position) {
      ray.setFromCamera(mouse, cameraRef.current);
      const hits = ray.intersectObject(acPointsRef.current);
      if (hits.length > 0) {
        setDetail({ type: "traffic", data: metaRef.current[hits[0].index] });
        return;
      }
    }

    if (livePointsRef.current && livePointsRef.current.geometry.attributes.position) {
      ray.setFromCamera(mouse, cameraRef.current);
      const liveHits = ray.intersectObject(livePointsRef.current);
      if (liveHits.length > 0) {
        setDetail({ type: "livetraffic", data: liveMetaRef.current[liveHits[0].index] });
        return;
      }
    }

    if (faaPointsRef.current && faaPointsRef.current.geometry.attributes.position) {
      ray.setFromCamera(mouse, cameraRef.current);
      const faaHits = ray.intersectObject(faaPointsRef.current);
      if (faaHits.length > 0) {
        setDetail({ type: "faaregistry", data: faaMetaRef.current[faaHits[0].index] });
        return;
      }
    }

    setDetail(null);
  }, [onSelectListing]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const W = container.clientWidth;
    const H = container.clientHeight;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H, false);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 100);
    camera.position.set(0, 0, 3.3);
    cameraRef.current = camera;

    const globe = new THREE.Group();
    globeRef.current = globe;
    scene.add(globe);

    const coreMat = new THREE.MeshPhongMaterial({
      color: isDark ? 0x16213f : 0xc8dcee,
      emissive: isDark ? 0x020510 : 0x101828,
      shininess: isDark ? 6 : 18,
      specular: isDark ? 0x102844 : 0x88aacc
    });
    const core = new THREE.Mesh(new THREE.SphereGeometry(1, 72, 72), coreMat);
    globe.add(core);
    new THREE.TextureLoader().load(EARTH_BLUE, (t) => {
      coreMat.map = t;
      coreMat.color.set(isDark ? 0x8899bb : 0xe8f0ff);
      coreMat.needsUpdate = true;
    });

    const nightLightsMat = new THREE.MeshBasicMaterial({
      map: null,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: isDark ? 0.9 : 0.75,
      depthWrite: false
    });
    const nightLights = new THREE.Mesh(new THREE.SphereGeometry(1.006, 72, 72), nightLightsMat);
    globe.add(nightLights);
    new THREE.TextureLoader().load(EARTH_NIGHT, (t) => {
      nightLightsMat.map = t;
      nightLightsMat.needsUpdate = true;
    });

    const ambient = new THREE.AmbientLight(isDark ? 0x1a2a44 : 0x334466, isDark ? 0.22 : 0.28);
    scene.add(ambient);
    const sunLight = new THREE.DirectionalLight(isDark ? 0xfff1d6 : 0xfff8e8, isDark ? 2.0 : 1.8);
    sunLight.position.set(3, 1.5, 2.5);
    sunRef.current = sunLight;
    scene.add(sunLight);
    const nightFill = new THREE.DirectionalLight(isDark ? 0x1a3366 : 0x334488, isDark ? 0.08 : 0.06);
    nightFill.position.set(-3, -0.5, -2.5);
    nightFillRef.current = nightFill;
    scene.add(nightFill);

    const sg = new THREE.BufferGeometry();
    const sp = [];
    for (let i = 0; i < 800; i++) {
      const v = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5)
        .normalize().multiplyScalar(22 + Math.random() * 22);
      sp.push(v.x, v.y, v.z);
    }
    sg.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3));
    scene.add(new THREE.Points(sg, new THREE.PointsMaterial({
      color: isDark ? 0x8fa8cc : 0xaabbcc, size: 0.07, transparent: true, opacity: isDark ? 0.7 : 0.3
    })));

    const acGeo = new THREE.BufferGeometry();
    acGeoRef.current = acGeo;
    const acMat = new THREE.PointsMaterial({
      size: 0.14,
      map: aircraftSilhouetteTexture(),
      vertexColors: false,
      color: 0x00d4ff,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });
    const acPoints = new THREE.Points(acGeo, acMat);
    acPointsRef.current = acPoints;
    globe.add(acPoints);

    const lGeo = new THREE.BufferGeometry();
    lGeoRef.current = lGeo;
    const lMat = new THREE.PointsMaterial({
      size: 0.16,
      map: dotTexture(),
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });
    const lPoints = new THREE.Points(lGeo, lMat);
    lPointsRef.current = lPoints;
    globe.add(lPoints);

    const liveGeo = new THREE.BufferGeometry();
    liveGeoRef.current = liveGeo;
    const liveMat = new THREE.PointsMaterial({
      size: 0.14,
      map: liveTrafficTexture(),
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });
    const livePoints = new THREE.Points(liveGeo, liveMat);
    livePointsRef.current = livePoints;
    globe.add(livePoints);

    const faaGeo = new THREE.BufferGeometry();
    faaGeoRef.current = faaGeo;
    const faaMat = new THREE.PointsMaterial({
      size: 0.22,
      map: faaClusterTexture(),
      vertexColors: false,
      color: 0xD4A017,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const faaPoints = new THREE.Points(faaGeo, faaMat);
    faaPointsRef.current = faaPoints;
    globe.add(faaPoints);

    const loop = () => {
      rafRef.current = requestAnimationFrame(loop);
      const now = new Date();
      const utcDecimal = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600;
      const sunLonDeg = (utcDecimal - 12) * 15;
      const sunLonRad = sunLonDeg * Math.PI / 180;
      const sunDist = 5.5;
      sunRef.current.position.set(
        Math.cos(sunLonRad) * sunDist, 1.8, Math.sin(sunLonRad) * sunDist
      );
      nightFillRef.current.position.set(
        Math.cos(sunLonRad + Math.PI) * sunDist, -0.5, Math.sin(sunLonRad + Math.PI) * sunDist
      );

      if (autoRotateRef.current && !dragRef.current.active) {
        rotRef.current.y += 0.0012;
      }
      globe.rotation.y = rotRef.current.y;
      globe.rotation.x = rotRef.current.x;
      renderer.render(scene, camera);
    };
    loop();

    const onResize = () => {
      const w = container.clientWidth, h = container.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    const onDown = (e) => {
      dragRef.current.active = true;
      autoRotateRef.current = false;
      dragRef.current.px = e.clientX;
      dragRef.current.py = e.clientY;
      downRef.current = [e.clientX, e.clientY];
      canvas.classList.add("cursor-grabbing");
    };
    const onUp = (e) => {
      setTimeout(() => { autoRotateRef.current = true; }, 2000);
      if (downRef.current) {
        const moved = Math.abs(e.clientX - downRef.current[0]) + Math.abs(e.clientY - downRef.current[1]);
        if (moved < 5) pick(e);
        downRef.current = null;
      }
      dragRef.current.active = false;
      canvas.classList.remove("cursor-grabbing");
    };
    const onMove = (e) => {
      if (!dragRef.current.active) return;
      rotRef.current.y += (e.clientX - dragRef.current.px) * 0.006;
      rotRef.current.x += (e.clientY - dragRef.current.py) * 0.006;
      rotRef.current.x = Math.max(-1.3, Math.min(1.3, rotRef.current.x));
      dragRef.current.px = e.clientX;
      dragRef.current.py = e.clientY;
    };
    const onWheel = (e) => {
      e.preventDefault();
      camera.position.z = Math.max(1.5, Math.min(7, camera.position.z + e.deltaY * 0.0018));
    };

    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointermove", onMove);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearInterval(timerRef.current);
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("wheel", onWheel);
      renderer.dispose();
      scene.clear();
    };
  }, [isDark, pick]);

  useEffect(() => {
    fetchTraffic();
    fetchLive();
    // Poll every 90s (was 30s) to stay well under platform rate limits.
    timerRef.current = setInterval(() => { fetchTraffic(); fetchLive(); }, 90000);
    return () => clearInterval(timerRef.current);
  }, [fetchTraffic, fetchLive]);

  const accentCyan = isDark ? "#00f5ff" : "#2563eb";
  const mutedColor = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";
  const textColor = isDark ? "#fff" : "#1e293b";

  return (
    <div ref={containerRef} className="relative w-full h-full" style={{ background: "transparent", minHeight: "320px" }}>
      <canvas ref={canvasRef} className="block w-full h-full cursor-grab opacity-100" />

      <div className="absolute top-3 left-3 z-20">
        <GlobeClock />
      </div>

      <div className="absolute bottom-2 left-2 flex gap-2 z-10">
        <div className="px-2 py-1 rounded-lg glass-pill text-[9px] font-bold tracking-wider"
          style={{ color: accentCyan }}>
          <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse"
            style={{
              background: trafficStatus === "live" ? accentCyan :
                trafficStatus === "loading" ? "#E8A83A" :
                  trafficStatus === "error" ? "#ff4d6d" : "#888",
              boxShadow: trafficStatus === "live" ? `0 0 6px ${accentCyan}` :
                trafficStatus === "loading" ? "0 0 6px #E8A83A" : "none"
            }} />
          {trafficStatus === "loading" ? "Fetching…" :
            trafficStatus === "error" ? "Unavailable" :
              trafficStatus === "live" ? `${trafficCount.toLocaleString()} ADS-B` :
                "Connecting…"}
        </div>
        {liveCount > 0 && (
          <div className="px-2 py-1 rounded-lg glass-pill text-[9px] font-bold tracking-wider"
            style={{ color: "#22c55e" }}>
            <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse"
              style={{ background: "#22c55e", boxShadow: "0 0 6px #22c55e" }} />
            {liveCount.toLocaleString()} Live DB
          </div>
        )}
        {faaCount > 0 && (
          <div className="px-2 py-1 rounded-lg glass-pill text-[9px] font-bold tracking-wider"
            style={{ color: "#D4A017" }}>
            <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5"
              style={{ background: "#D4A017", boxShadow: "0 0 6px #D4A017" }} />
            {faaCount.toLocaleString()} FAA · {faaStateCount} states
          </div>
        )}
      </div>

      <div className="absolute bottom-2 right-2 px-2 py-1 rounded-lg glass-pill text-[9px] font-bold tracking-wider z-10"
        style={{ color: "#E8A83A" }}>
        <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse"
          style={{ background: "#E8A83A", boxShadow: "0 0 6px #E8A83A" }} />
        {listings.length.toLocaleString()} listings
      </div>

      {detail && (
        <div className="absolute top-3 right-3 z-20 glass-card p-4" style={{ width: 260, maxWidth: "calc(100% - 24px)" }}>
          <button onClick={() => setDetail(null)} className="absolute top-2 right-2 opacity-40 hover:opacity-100 transition-opacity">
            <X className="w-3.5 h-3.5" />
          </button>

          {detail.type === "traffic" && (() => {
            const ac = detail.data;
            const nReg = ac.registration || null;
            const altFt = ac.baro_altitude != null ? Math.round(ac.baro_altitude * 3.28084) : null;
            const speedKt = ac.velocity != null ? Math.round(ac.velocity * 1.94384) : null;
            const vrateStr = ac.vertical_rate != null ?
              ac.vertical_rate > 0.5 ? `▲ ${Math.round(ac.vertical_rate * 196.85)} fpm` :
                ac.vertical_rate < -0.5 ? `▼ ${Math.round(Math.abs(ac.vertical_rate) * 196.85)} fpm` : "Level" : "—";
            const typeDisplay = ac.aircraft_type || null;
            const onGround = ac.on_ground;
            return (
              <>
                <div className="mb-3 pb-2.5 border-b" style={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}>
                  <p className="text-[11px] font-black text-[#E8A83A] uppercase tracking-wide">
                    {nReg || ac.callsign?.trim() || ac.icao24}
                  </p>
                  <p className="text-[8px] font-mono mt-0.5" style={{ color: mutedColor }}>
                    ICAO: {ac.icao24} {ac.squawk ? `· SQWK ${ac.squawk}` : ""}
                  </p>
                  {typeDisplay && (
                    <p className="text-[10px] font-black uppercase tracking-wide mt-1" style={{ color: accentCyan }}>{typeDisplay}</p>
                  )}
                  {onGround && (
                    <span className="inline-block text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded mt-1"
                      style={{ background: "rgba(255,77,109,0.12)", color: "#ff4d6d" }}>On Ground</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-1.5 mb-3 text-[10px]">
                  <div><span style={{ color: mutedColor }}>Alt: </span><strong style={{ color: textColor }}>{altFt != null ? `${altFt.toLocaleString()} ft` : "—"}</strong></div>
                  <div><span style={{ color: mutedColor }}>Speed: </span><strong style={{ color: textColor }}>{speedKt != null ? `${speedKt} kt` : "—"}</strong></div>
                  <div><span style={{ color: mutedColor }}>Hdg: </span><strong style={{ color: textColor }}>{ac.true_track != null ? `${Math.round(ac.true_track)}°` : "—"}</strong></div>
                  <div><span style={{ color: mutedColor }}>V/S: </span><strong style={{ color: textColor }}>{vrateStr}</strong></div>
                </div>
                {ac.listing && (
                  <div className="rounded-lg p-2.5 mb-3" style={{
                    background: isDark ? "rgba(212,160,23,0.06)" : "rgba(212,160,23,0.04)",
                    border: `1px solid ${isDark ? "rgba(212,160,23,0.25)" : "rgba(212,160,23,0.2)"}`
                  }}>
                    <p className="text-[7px] font-black uppercase tracking-[0.15em] text-[#D4A017] mb-1.5">ABOS Listing Match</p>
                    <p className="text-[10px] font-black" style={{ color: textColor }}>
                      {ac.listing.year || ""} {ac.listing.make || ""} {ac.listing.model || ""}
                    </p>
                    <div className="flex gap-3 mt-1.5 text-[9px]">
                      {ac.listing.ati_score && <span style={{ color: mutedColor }}>ATI: <strong style={{ color: textColor }}>{ac.listing.ati_score}</strong></span>}
                      {ac.listing.asking_price && <span style={{ color: mutedColor }}>$<strong style={{ color: textColor }}>{ac.listing.asking_price?.toLocaleString()}</strong></span>}
                    </div>
                  </div>
                )}
                {!ac.listing && nReg && /^N/i.test(nReg) && !scoringMap[ac.icao24] && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleScoreAircraft(ac); }}
                    className="w-full rounded-lg py-2 px-3 flex items-center justify-center gap-2 text-[10px] font-black text-white transition-all active:scale-95"
                    style={{ background: "linear-gradient(135deg, #0B2D5B, #1A4A8A)" }}>
                    <Sparkles className="w-3 h-3" /> Look up FAA & Create ATI Card
                  </button>
                )}
                {scoringMap[ac.icao24]?.status === "loading" && (
                  <div className="flex items-center gap-2 text-[10px] mt-2" style={{ color: mutedColor }}>
                    <div className="w-3 h-3 border-2 border-[#E8A83A]/30 border-t-[#E8A83A] rounded-full animate-spin" /> Scoring…
                  </div>
                )}
                {scoringMap[ac.icao24]?.status === "success" && (
                  <div className="flex items-center gap-2 text-[10px] font-bold text-[#22c55e] mt-2">
                    <CheckCircle2 className="w-3 h-3" /> ATI Card created! Score: {scoringMap[ac.icao24].atiScore}
                  </div>
                )}
                {scoringMap[ac.icao24]?.status === "error" && (
                  <div className="flex items-center gap-2 text-[10px] font-bold text-[#ff4d6d] mt-2">
                    <AlertCircle className="w-3 h-3" /> {scoringMap[ac.icao24].message}
                  </div>
                )}
              </>
            );
          })()}

          {detail.type === "livetraffic" && (() => {
            const ac = detail.data;
            const nReg = ac.n_number || ac.registration || null;
            const altFt = ac.altitude_ft != null ? Math.round(ac.altitude_ft) : null;
            const speedKt = ac.ground_speed_kt != null ? Math.round(ac.ground_speed_kt) : null;
            const vrateStr = ac.vertical_rate != null ?
              ac.vertical_rate > 0 ? `▲ ${ac.vertical_rate} fpm` : ac.vertical_rate < 0 ? `▼ ${Math.abs(ac.vertical_rate)} fpm` : "Level" : "—";
            return (
              <>
                <div className="mb-3 pb-2.5 border-b" style={{ borderColor: "rgba(34,197,94,0.25)" }}>
                  <p className="text-[11px] font-black text-[#22c55e] uppercase tracking-wide">
                    {nReg || ac.callsign?.trim() || ac.icao24}
                  </p>
                  <p className="text-[8px] font-mono mt-0.5" style={{ color: mutedColor }}>
                    ICAO: {ac.icao24} · Live DB
                  </p>
                  {ac.on_ground && (
                    <span className="inline-block text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded mt-1"
                      style={{ background: "rgba(255,77,109,0.12)", color: "#ff4d6d" }}>On Ground</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-1.5 mb-3 text-[10px]">
                  <div><span style={{ color: mutedColor }}>Alt: </span><strong style={{ color: textColor }}>{altFt != null ? `${altFt.toLocaleString()} ft` : "—"}</strong></div>
                  <div><span style={{ color: mutedColor }}>Speed: </span><strong style={{ color: textColor }}>{speedKt != null ? `${speedKt} kt` : "—"}</strong></div>
                  <div><span style={{ color: mutedColor }}>Hdg: </span><strong style={{ color: textColor }}>{ac.heading != null ? `${Math.round(ac.heading)}°` : "—"}</strong></div>
                  <div><span style={{ color: mutedColor }}>V/S: </span><strong style={{ color: textColor }}>{vrateStr}</strong></div>
                  {ac.origin_country && <div><span style={{ color: mutedColor }}>Country: </span><strong style={{ color: textColor }}>{ac.origin_country}</strong></div>}
                  {ac.departure_icao && <div><span style={{ color: mutedColor }}>Route: </span><strong style={{ color: textColor }}>{ac.departure_icao}{ac.arrival_icao ? ` → ${ac.arrival_icao}` : ""}</strong></div>}
                </div>
              </>
            );
          })()}

          {detail.type === "listing" && (
            <>
              <h3 className="text-[11px] font-bold text-[#00f5ff] tracking-wide">
                {detail.data.year} {detail.data.make} {detail.data.model}
              </h3>
              <table className="w-full mt-2 text-[10px]">
                <tbody>
                  {[
                    ["Registration", detail.data.registration || "—"],
                    ["ATI Score", detail.data.ati_score || "—"],
                    ["Price", detail.data.asking_price ? `$${detail.data.asking_price.toLocaleString()}` : "—"],
                    ["Status", detail.data.status || "—"],
                  ].map(([k, v]) => (
                    <tr key={k}><td className="py-0.5 opacity-40">{k}</td><td className="py-0.5 text-right tabular-nums font-medium">{v}</td></tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {detail.type === "faaregistry" && (() => {
            const d = detail.data;
            return (
              <>
                <div className="mb-3 pb-2.5 border-b" style={{ borderColor: "rgba(212,160,23,0.25)" }}>
                  <p className="text-[11px] font-black text-[#D4A017] uppercase tracking-wide">FAA Registry · {d.state}</p>
                  <p className="text-[8px] font-mono mt-0.5" style={{ color: mutedColor }}>{d.count.toLocaleString()} aircraft registered</p>
                </div>
                <div className="space-y-2 mb-3">
                  <div>
                    <p className="text-[8px] font-bold uppercase tracking-wider mb-1" style={{ color: mutedColor }}>Top Aircraft Types</p>
                    <div className="flex flex-wrap gap-1.5">
                      {d.topTypes.map((t, i) => (
                        <span key={i} className="text-[9px] font-bold px-2 py-0.5 rounded"
                          style={{ background: "rgba(212,160,23,0.1)", color: "#D4A017", border: "1px solid rgba(212,160,23,0.2)" }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[8px] font-bold uppercase tracking-wider mb-1" style={{ color: mutedColor }}>Sample N-Numbers</p>
                    <p className="text-[9px] font-mono" style={{ color: textColor }}>{d.sampleNums.join(", ")}</p>
                  </div>
                  <div className="rounded-lg p-2.5" style={{
                    background: isDark ? "rgba(212,160,23,0.06)" : "rgba(212,160,23,0.04)",
                    border: "1px solid rgba(212,160,23,0.2)"
                  }}>
                    <p className="text-[8px] font-bold uppercase tracking-wider mb-1" style={{ color: mutedColor }}>ATI Estimate</p>
                    <span className="text-[11px] font-black" style={{ color: d.atiEstimate != null ? "#D4A017" : mutedColor }}>
                      {d.atiEstimate != null ? `${d.atiEstimate}` : "— Unscored"}
                    </span>
                  </div>
                </div>
                <a href="/admin/supabase-sync" target="_blank" rel="noopener"
                  className="w-full rounded-lg py-2 px-3 flex items-center justify-center gap-1.5 text-[10px] font-black text-white transition-all active:scale-95"
                  style={{ background: "linear-gradient(135deg, #A67C00, #D4A017)" }}>
                  <ExternalLink className="w-3 h-3" /> View in Registry
                </a>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}