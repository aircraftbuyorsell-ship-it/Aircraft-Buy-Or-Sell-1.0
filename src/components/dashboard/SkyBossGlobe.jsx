import { useState, useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { base44 } from "@/api/base44Client";
import { useTheme } from "@/lib/useTheme";
import {
  Loader2, Sparkles, CheckCircle2, AlertCircle, X } from
"lucide-react";

const EARTH_DARK = "https://unpkg.com/three-globe/example/img/earth-dark.jpg";
const EARTH_BLUE = "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg";

// Registration prefix → country → coordinates
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

// Commercial airliner types to exclude from live traffic visualization
const COMMERCIAL_AIRLINER_TYPES = new Set([
// Boeing
"B731", "B732", "B733", "B734", "B735", "B736", "B737", "B738", "B739",
"B73H", "B73G", "B73W", "B74D", "B741", "B742", "B743", "B744", "B748",
"B752", "B753", "B762", "B763", "B764", "B772", "B773", "B77L", "B77W",
"B788", "B789", "B78X",
// Airbus
"A318", "A319", "A320", "A321", "A32N", "A32Q",
"A332", "A333", "A338", "A339", "A342", "A343", "A345", "A346",
"A359", "A35K", "A388",
// Regional / commercial turboprops & jets
"E170", "E175", "E190", "E195", "E290", "E295",
"CRJ1", "CRJ2", "CRJ7", "CRJ9", "CRJX",
"DH8A", "DH8B", "DH8C", "DH8D", "AT43", "AT44", "AT45", "AT46", "AT72", "AT73", "AT75", "AT76",
"MD11", "MD80", "MD81", "MD82", "MD83", "MD87", "MD88", "MD90",
"DC10", "DC85", "DC86", "DC87", "DC93", "DC94", "DC95",
"F100", "F70", "RJ85", "RJ1H", "BA46"]
);

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
  return null;
}

function atiColor(score) {
  if (!score) return [0.4, 0.4, 0.5];
  if (score >= 90) return [0.0, 0.96, 1.0];
  if (score >= 72) return [0.48, 0.0, 1.0];
  if (score >= 54) return [0.83, 0.63, 0.09];
  return [1.0, 0.3, 0.43];
}

function altColorM(altM) {
  if (altM == null) return "#999";
  const ft = altM * 3.28084;
  if (ft < 5000) return "#ef4444";
  if (ft < 15000) return "#f59e0b";
  if (ft < 30000) return "#22c55e";
  return "#3b82f6";
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
  return new THREE.CanvasTexture(cv);
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
  ctx.beginPath();
  ctx.arc(48, 48, 42, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(45, 10, 6, 66);
  ctx.beginPath();
  ctx.moveTo(48, 26);ctx.lineTo(18, 44);ctx.lineTo(20, 48);ctx.lineTo(48, 32);ctx.closePath();ctx.fill();
  ctx.beginPath();
  ctx.moveTo(48, 26);ctx.lineTo(78, 44);ctx.lineTo(76, 48);ctx.lineTo(48, 32);ctx.closePath();ctx.fill();
  ctx.beginPath();
  ctx.moveTo(48, 56);ctx.lineTo(26, 68);ctx.lineTo(28, 72);ctx.lineTo(48, 62);ctx.closePath();ctx.fill();
  ctx.beginPath();
  ctx.moveTo(48, 56);ctx.lineTo(70, 68);ctx.lineTo(68, 72);ctx.lineTo(48, 62);ctx.closePath();ctx.fill();
  ctx.strokeStyle = "rgba(0, 220, 255, 0.8)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(48, 10);ctx.lineTo(48, 76);
  ctx.moveTo(18, 44);ctx.lineTo(48, 28);ctx.lineTo(78, 44);
  ctx.moveTo(26, 68);ctx.lineTo(48, 58);ctx.lineTo(70, 68);
  ctx.stroke();
  return new THREE.CanvasTexture(cv);
}

function listingDotTexture(color) {
  const cv = document.createElement("canvas");
  cv.width = cv.height = 64;
  const x = cv.getContext("2d");
  const [r, g, b] = color;
  const outer = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  outer.addColorStop(0, `rgba(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)},1)`);
  outer.addColorStop(0.3, `rgba(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)},0.8)`);
  outer.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = outer;
  x.beginPath();
  x.arc(32, 32, 32, 0, 7);
  x.fill();
  return new THREE.CanvasTexture(cv);
}

export default function SkyBossGlobe({ className = "", listings = [], onSelectListing }) {
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
  const metaRef = useRef([]);
  const lMetaRef = useRef([]);
  const rotRef = useRef({ y: -0.3, x: 0.32 });
  const dragRef = useRef({ active: false, px: 0, py: 0 });
  const downRef = useRef(null);
  const rafRef = useRef(null);
  const timerRef = useRef(null);
  const loadingRef = useRef(false);
  const listingsRef = useRef(listings);

  const [trafficCount, setTrafficCount] = useState(0);
  const [trafficStatus, setTrafficStatus] = useState("idle");
  const [detail, setDetail] = useState(null);
  const [scoringMap, setScoringMap] = useState({});

  useEffect(() => {listingsRef.current = listings;}, [listings]);

  // ─── Fetch traffic from cachedTraffic (adsb.lol) ───
  const fetchTraffic = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setTrafficStatus("loading");
    try {
      const res = await base44.functions.invoke("cachedTraffic", {
        region_key: "world",
        region_label: "Global",
        force_refresh: true,
        limit: 1000,
        allow_heavy: true
      });
      const ac = res.data?.aircraft || [];
      renderToGlobe(ac);
      setTrafficStatus("live");
    } catch (e) {
      setTrafficStatus("error");
      console.warn("SkyBoss: cachedTraffic fetch failed", e);
    } finally {
      loadingRef.current = false;
    }
  }, []);

  // ─── Render traffic aircraft data to globe point cloud ───
  const renderToGlobe = useCallback((aircraft) => {
    const acGeo = acGeoRef.current;
    if (!acGeo) return;
    const pos = [],meta = [];
    for (const ac of aircraft) {
      if (ac.latitude == null || ac.longitude == null) continue;
      // Filter out commercial airliners
      if (ac.aircraft_type && COMMERCIAL_AIRLINER_TYPES.has(ac.aircraft_type.toUpperCase())) continue;
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

  // ─── Render ABOS listings onto globe ───
  const renderListings = useCallback((listingsData) => {
    const lGeo = lGeoRef.current;
    if (!lGeo) return;
    const pos = [],col = [],meta = [];
    listingsData.forEach((l, i) => {
      const coords = listingToLatLon(l, i);
      if (!coords) return;
      const v = latLonToVec3(coords.lat, coords.lon, 1.016);
      pos.push(v.x, v.y, v.z);
      const c = atiColor(l.ati_score);
      col.push(c[0], c[1], c[2]);
      meta.push(l);
    });
    if (pos.length === 0) return;
    lGeo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    lGeo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    lGeo.attributes.position.needsUpdate = true;
    lGeo.attributes.color.needsUpdate = true;
    lMetaRef.current = meta;
  }, []);

  useEffect(() => {
    renderListings(listings);
  }, [listings, renderListings]);

  // ─── Handle scoring for N-registered aircraft ───
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

  // ─── Raycasting click ───
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

    // Check listings first (larger dots)
    if (lPointsRef.current) {
      ray.setFromCamera(mouse, cameraRef.current);
      const lHits = ray.intersectObject(lPointsRef.current);
      if (lHits.length > 0) {
        const listing = lMetaRef.current[lHits[0].index];
        if (onSelectListing) onSelectListing(listing);else
        setDetail({ type: "listing", data: listing });
        return;
      }
    }

    // Check traffic
    if (acPointsRef.current) {
      ray.setFromCamera(mouse, cameraRef.current);
      const hits = ray.intersectObject(acPointsRef.current);
      if (hits.length > 0) {
        setDetail({ type: "traffic", data: metaRef.current[hits[0].index] });
        return;
      }
    }

    setDetail(null);
  }, [onSelectListing]);

  // ─── Three.js setup ───
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

    // Earth core
    const coreMat = new THREE.MeshPhongMaterial({
      color: 0x16213f, emissive: 0x05091c, shininess: 6, specular: 0x102844
    });
    const core = new THREE.Mesh(new THREE.SphereGeometry(1, 72, 72), coreMat);
    globe.add(core);
    new THREE.TextureLoader().load(EARTH_BLUE, (t) => {
      coreMat.map = t;coreMat.color.set(isDark ? 0x8899bb : 0xffffff);coreMat.needsUpdate = true;
    });

    // Grid
    const gridColor = isDark ? 0x1f6f86 : 0x334466;
    const grid = new THREE.Mesh(
      new THREE.SphereGeometry(1.003, 36, 24),
      new THREE.MeshBasicMaterial({ color: gridColor, wireframe: true, transparent: true, opacity: isDark ? 0.10 : 0.22 })
    );
    globe.add(grid);

    // Atmosphere
    const atmoColor = isDark ? 0x00b8d4 : 0x4488cc;
    const atmo = new THREE.Mesh(
      new THREE.SphereGeometry(1.10, 48, 48),
      new THREE.MeshBasicMaterial({ color: atmoColor, transparent: true, opacity: isDark ? 0.06 : 0.10, side: THREE.BackSide })
    );
    globe.add(atmo);

    // Lights
    scene.add(new THREE.AmbientLight(isDark ? 0x3a5575 : 0x8899bb, isDark ? 0.85 : 1.2));
    const sun = new THREE.DirectionalLight(isDark ? 0xfff1d6 : 0xffffff, isDark ? 0.9 : 1.2);
    sun.position.set(3, 1.5, 2.5);
    scene.add(sun);

    // Starfield
    const sg = new THREE.BufferGeometry();
    const sp = [];
    for (let i = 0; i < 800; i++) {
      const v = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).
      normalize().multiplyScalar(22 + Math.random() * 22);
      sp.push(v.x, v.y, v.z);
    }
    sg.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3));
    scene.add(new THREE.Points(sg, new THREE.PointsMaterial({
      color: isDark ? 0x8fa8cc : 0x445566, size: 0.07, transparent: true, opacity: isDark ? 0.7 : 0.4
    })));

    // Aircraft point cloud
    const acGeo = new THREE.BufferGeometry();
    acGeoRef.current = acGeo;
    const acMat = new THREE.PointsMaterial({
      size: 0.12,
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

    // Listing point cloud
    const lGeo = new THREE.BufferGeometry();
    lGeoRef.current = lGeo;
    const lMat = new THREE.PointsMaterial({
      size: 0.11,
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

    // Animation
    const loop = () => {
      rafRef.current = requestAnimationFrame(loop);
      if (!dragRef.current.active) rotRef.current.y += 0.0016;
      globe.rotation.y = rotRef.current.y;
      globe.rotation.x = rotRef.current.x;
      renderer.render(scene, camera);
    };
    loop();

    const onResize = () => {
      const w = container.clientWidth,h = container.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    const onDown = (e) => {
      dragRef.current.active = true;
      dragRef.current.px = e.clientX;
      dragRef.current.py = e.clientY;
      downRef.current = [e.clientX, e.clientY];
      canvas.classList.add("cursor-grabbing");
    };
    const onUp = (e) => {
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

  // Auto-refresh traffic every 30s
  useEffect(() => {
    fetchTraffic();
    timerRef.current = setInterval(fetchTraffic, 30000);
    return () => clearInterval(timerRef.current);
  }, [fetchTraffic]);

  const accentCyan = isDark ? "#00f5ff" : "#2563eb";
  const mutedColor = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)";
  const textColor = isDark ? "#fff" : "#1e293b";

  return (
    <div ref={containerRef} className={`relative ${className}`} style={{ background: "transparent" }}>
      <canvas ref={canvasRef} className="block w-full h-full cursor-grab rounded-[10023px] opacity-100" />

      {/* Traffic status badge */}
      <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg glass-pill text-[9px] font-bold tracking-wider z-10"
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
        trafficStatus === "live" ? `${trafficCount.toLocaleString()} airborne` :
        "Connecting…"}
      </div>

      {/* Listing count badge */}
      <div className="absolute bottom-2 right-2 px-2 py-1 rounded-lg glass-pill text-[9px] font-bold tracking-wider z-10"
      style={{ color: "#E8A83A" }}>
        <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse"
        style={{ background: "#E8A83A", boxShadow: "0 0 6px #E8A83A" }} />
        {listings.length.toLocaleString()} listings
      </div>

      {/* ─── Detail popup (enhanced — matches 2D map popup) ─── */}
      {detail &&
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
          ac.vertical_rate > 0.5 ? `▲ ${Math.round(ac.vertical_rate * 196.85)} fpm` : ac.vertical_rate < -0.5 ? `▼ ${Math.round(Math.abs(ac.vertical_rate) * 196.85)} fpm` : "Level" :
          "—";
          const typeDisplay = ac.aircraft_type || null;
          const onGround = ac.on_ground;

          return (
            <>
                {/* Header */}
                <div className="mb-3 pb-2.5 border-b" style={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}>
                  <p className="text-[11px] font-black text-[#E8A83A] uppercase tracking-wide">
                    {nReg || ac.callsign?.trim() || ac.icao24}
                  </p>
                  <p className="text-[8px] font-mono mt-0.5" style={{ color: mutedColor }}>
                    ICAO: {ac.icao24} {ac.squawk ? `· SQWK ${ac.squawk}` : ""}
                  </p>
                  {typeDisplay &&
                <p className="text-[10px] font-black uppercase tracking-wide mt-1" style={{ color: accentCyan }}>
                      {typeDisplay}
                    </p>
                }
                  {onGround &&
                <span className="inline-block text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded mt-1"
                style={{ background: "rgba(255,77,109,0.12)", color: "#ff4d6d" }}>On Ground</span>
                }
                </div>

                {/* Flight data grid */}
                <div className="grid grid-cols-2 gap-1.5 mb-3 text-[10px]">
                  <div><span style={{ color: mutedColor }}>Alt: </span><strong style={{ color: textColor }}>{altFt != null ? `${altFt.toLocaleString()} ft` : "—"}</strong></div>
                  <div><span style={{ color: mutedColor }}>Speed: </span><strong style={{ color: textColor }}>{speedKt != null ? `${speedKt} kt` : "—"}</strong></div>
                  <div><span style={{ color: mutedColor }}>Hdg: </span><strong style={{ color: textColor }}>{ac.true_track != null ? `${Math.round(ac.true_track)}°` : "—"}</strong></div>
                  <div><span style={{ color: mutedColor }}>V/S: </span><strong style={{ color: textColor }}>{vrateStr}</strong></div>
                </div>

                {/* ABOS Listing match */}
                {ac.listing &&
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
              }

                {/* FAA Lookup button (N-registered, no listing) */}
                {!ac.listing && nReg && /^N/i.test(nReg) && !scoringMap[ac.icao24] &&
              <button
                onClick={(e) => {e.stopPropagation();handleScoreAircraft(ac);}}
                className="w-full rounded-lg py-2 px-3 flex items-center justify-center gap-2 text-[10px] font-black text-white transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg, #0B2D5B, #1A4A8A)" }}>
                
                    <Sparkles className="w-3 h-3" /> Look up FAA & Create ATI Card
                  </button>
              }

                {/* Scoring states */}
                {scoringMap[ac.icao24]?.status === "loading" &&
              <div className="flex items-center gap-2 text-[10px] mt-2" style={{ color: mutedColor }}>
                    <Loader2 className="w-3 h-3 animate-spin text-[#E8A83A]" /> Scoring…
                  </div>
              }
                {scoringMap[ac.icao24]?.status === "success" &&
              <div className="flex items-center gap-2 text-[10px] font-bold text-[#22c55e] mt-2">
                    <CheckCircle2 className="w-3 h-3" /> ATI Card created! Score: {scoringMap[ac.icao24].atiScore}
                  </div>
              }
                {scoringMap[ac.icao24]?.status === "error" &&
              <div className="flex items-center gap-2 text-[10px] font-bold text-[#ff4d6d] mt-2">
                    <AlertCircle className="w-3 h-3" /> {scoringMap[ac.icao24].message}
                  </div>
              }
              </>);

        })()}

          {detail.type === "listing" &&
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
              ["Status", detail.data.status || "—"]].
              map(([k, v]) =>
              <tr key={k}><td className="py-0.5 opacity-40">{k}</td><td className="py-0.5 text-right tabular-nums font-medium">{v}</td></tr>
              )}
                </tbody>
              </table>
            </>
        }
        </div>
      }
    </div>);

}