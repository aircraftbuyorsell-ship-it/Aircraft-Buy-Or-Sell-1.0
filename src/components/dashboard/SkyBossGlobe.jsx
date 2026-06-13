import { useState, useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { useTheme } from "@/lib/useTheme";

const EARTH_DARK = "https://unpkg.com/three-globe/example/img/earth-dark.jpg";
const EARTH_BLUE = "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg";

const TOKEN_URL = "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token";
const STATES_URL = "https://opensky-network.org/api/states/all?extended=1";

const POS_SRC = { 0: "ADS-B", 1: "ASTERIX", 2: "MLAT", 3: "FLARM" };

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
  "VN": [14, 108], "HB": [47, 8],
};

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

function altColor(altM) {
  const t = Math.max(0, Math.min(1, (altM || 0) / 12000));
  return [0.83 + (0.0 - 0.83) * t, 0.63 + (0.96 - 0.63) * t, 0.09 + (1.0 - 0.09) * t];
}

function latLonToVec3(lat, lon, r) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
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
  const tokenRef = useRef(null);
  const tokenExpRef = useRef(0);
  const listingsRef = useRef(listings);

  const [trafficCount, setTrafficCount] = useState(0);
  const [trafficStatus, setTrafficStatus] = useState("idle"); // idle | loading | live | error
  const [detail, setDetail] = useState(null);

  useEffect(() => { listingsRef.current = listings; }, [listings]);

  const fetchStates = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setTrafficStatus("loading");
    try {
      const cid = "aircraftbuyorsell@gmail.com-api-client";
      const csec = "IEP2aVXNWl5znURwv52525Vz9SxpA7ea";
      if ((!tokenRef.current || Date.now() >= tokenExpRef.current) && cid && csec) {
        const body = new URLSearchParams({ grant_type: "client_credentials", client_id: cid, client_secret: csec });
        const res = await fetch(TOKEN_URL, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body.toString() });
        if (res.ok) {
          const d = await res.json();
          tokenRef.current = d.access_token;
          tokenExpRef.current = Date.now() + (d.expires_in - 30) * 1000;
        }
      }
      let url = STATES_URL + "&lamin=34&lomin=-25&lamax=72&lomax=45"; // Europe default
      const opt = tokenRef.current ? { headers: { Authorization: `Bearer ${tokenRef.current}` } } : {};
      const res = await fetch(url, opt);
      if (res.status === 429) { setTrafficStatus("error"); console.warn("SkyBoss: OpenSky rate limited"); return; }
      if (!res.ok) { setTrafficStatus("error"); console.warn("SkyBoss: OpenSky fetch failed", res.status); return; }
      const data = await res.json();
      renderToGlobe(data?.states || []);
      setTrafficStatus("live");
    } catch (e) {
      setTrafficStatus("error");
      console.warn("SkyBoss: OpenSky unreachable", e);
    }
    finally { loadingRef.current = false; }
  }, []);

  const renderToGlobe = useCallback((states) => {
    const acGeo = acGeoRef.current;
    if (!acGeo) return;
    const pos = [], col = [], meta = [];
    for (let i = 0; i < states.length; i++) {
      const s = states[i], lon = s[5], lat = s[6];
      if (lat == null || lon == null) continue;
      const altM = (s[13] != null ? s[13] : s[7]) || 0;
      const v = latLonToVec3(lat, lon, 1.012 + Math.min(altM, 14000) / 6371000 * 22);
      pos.push(v.x, v.y, v.z);
      const c = altColor(altM);
      col.push(c[0], c[1], c[2]);
      meta.push(s);
    }
    acGeo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    acGeo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    acGeo.attributes.position.needsUpdate = true;
    acGeo.attributes.color.needsUpdate = true;
    metaRef.current = meta;
    setTrafficCount(meta.length);
  }, []);

  // Render ABOS listings onto globe
  const renderListings = useCallback((listingsData) => {
    const lGeo = lGeoRef.current;
    if (!lGeo) return;
    const pos = [], col = [], meta = [];
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

  const pick = useCallback((e) => {
    const cv = canvasRef.current;
    if (!cv) return;
    const r = cv.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - r.left) / r.width) * 2 - 1,
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
        if (onSelectListing) onSelectListing(listing);
        else setDetail({ type: "listing", data: listing });
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

  // Setup Three.js
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
      color: 0x16213f, emissive: 0x05091c, shininess: 6, specular: 0x102844,
    });
    const core = new THREE.Mesh(new THREE.SphereGeometry(1, 72, 72), coreMat);
    globe.add(core);
    new THREE.TextureLoader().load(EARTH_BLUE, (t) => {
      coreMat.map = t; coreMat.color.set(isDark ? 0x8899bb : 0xffffff); coreMat.needsUpdate = true;
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
    const ambBright = isDark ? 0.85 : 1.2;
    scene.add(new THREE.AmbientLight(isDark ? 0x3a5575 : 0x8899bb, ambBright));
    const sun = new THREE.DirectionalLight(isDark ? 0xfff1d6 : 0xffffff, isDark ? 0.9 : 1.2);
    sun.position.set(3, 1.5, 2.5);
    scene.add(sun);

    // Starfield
    const sg = new THREE.BufferGeometry();
    const sp = [];
    for (let i = 0; i < 800; i++) {
      const v = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5)
        .normalize().multiplyScalar(22 + Math.random() * 22);
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
      size: 0.08,
      map: dotTexture(),
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
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
      sizeAttenuation: true,
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

    // Resize
    const onResize = () => {
      const w = container.clientWidth, h = container.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    // Pointer
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
    fetchStates();
    timerRef.current = setInterval(fetchStates, 30000);
    return () => clearInterval(timerRef.current);
  }, [fetchStates]);

  return (
    <div ref={containerRef} className={`relative ${className}`} style={{ background: "transparent" }}>
      <canvas ref={canvasRef} className="block w-full h-full cursor-grab" />
      {/* Traffic status badge */}
      <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg glass-pill text-[9px] font-bold tracking-wider"
        style={{ color: isDark ? "#00f5ff" : "#0B2D5B" }}>
        <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse"
          style={{
            background: trafficStatus === "live" ? (isDark ? "#00f5ff" : "#2563eb") :
                        trafficStatus === "loading" ? "#E8A83A" :
                        trafficStatus === "error" ? "#ff4d6d" : (isDark ? "#888" : "#666"),
            boxShadow: trafficStatus === "live" ? `0 0 6px ${isDark ? "#00f5ff" : "#2563eb"}` :
                       trafficStatus === "loading" ? "0 0 6px #E8A83A" : "none"
          }} />
        {trafficStatus === "loading" ? "Fetching traffic…" :
         trafficStatus === "error" ? "Traffic unavailable" :
         trafficStatus === "live" ? `${trafficCount.toLocaleString()} airborne` :
         "Connecting…"}
      </div>
      {/* Listing count badge */}
      <div className="absolute bottom-2 right-2 px-2 py-1 rounded-lg glass-pill text-[9px] font-bold tracking-wider"
        style={{ color: "#E8A83A" }}>
        <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse"
          style={{ background: "#E8A83A", boxShadow: `0 0 6px #E8A83A` }} />
        {listings.length.toLocaleString()} listings
      </div>
      {/* Detail popup */}
      {detail && (
        <div className="absolute top-2 right-2 w-[240px] glass-card p-3 z-20">
          <button onClick={() => setDetail(null)} className="absolute top-2 right-2 text-xs opacity-50 hover:opacity-100">✕</button>
          {detail.type === "traffic" && (
            <>
              <h3 className="text-[11px] font-bold text-[#D4A017] tracking-wide">
                {(detail.data[1] || "").trim() || "(no callsign)"}
              </h3>
              <table className="w-full mt-2 text-[10px]">
                <tbody>
                  {[
                    ["ICAO24", (detail.data[0] || "—").toUpperCase()],
                    ["Altitude", detail.data[13] != null ? `${Math.round(detail.data[13] * 3.281).toLocaleString()} ft` : detail.data[8] ? "on ground" : "—"],
                    ["Speed", detail.data[9] != null ? `${Math.round(detail.data[9] * 1.944)} kts` : "—"],
                    ["Heading", detail.data[10] != null ? `${Math.round(detail.data[10])}°` : "—"],
                  ].map(([k, v]) => (
                    <tr key={k}><td className="py-0.5 opacity-40">{k}</td><td className="py-0.5 text-right tabular-nums font-medium">{v}</td></tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
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
        </div>
      )}
    </div>
  );
}