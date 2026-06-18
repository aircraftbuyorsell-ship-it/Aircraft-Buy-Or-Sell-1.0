import { useState, useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { Link } from "react-router-dom";
import {
  ChevronDown, ChevronUp, RotateCw, Pause, Play, X, Globe,
  Gauge, MapPin, Navigation, ArrowUpDown, Radio, Hash
} from "lucide-react";
import { useTheme } from "@/lib/useTheme";

const EARTH_TEX = "https://unpkg.com/three-globe/example/img/earth-dark.jpg";

const BBOX = {
  cz: [48.5, 12.0, 51.1, 18.9],
  eu: [34.0, -25.0, 72.0, 45.0],
  us: [24.0, -125.0, 50.0, -66.0],
  global: null,
};

const TOKEN_URL = "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token";
const STATES_URL = "https://opensky-network.org/api/states/all?extended=1";
const POS_SRC = { 0: "ADS-B", 1: "ASTERIX", 2: "MLAT", 3: "FLARM" };

/* ── Three.js dot texture ──────────────────────────────────── */
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

/* ── Helpers ───────────────────────────────────────────────── */
function latLonToVec3(lat, lon, r) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

function altColor(altM) {
  const t = Math.max(0, Math.min(1, (altM || 0) / 12000));
  const lo = [0.83, 0.63, 0.09];
  const hi = [0.0, 0.96, 1.0];
  return [lo[0] + (hi[0] - lo[0]) * t, lo[1] + (hi[1] - lo[1]) * t, lo[2] + (hi[2] - lo[2]) * t];
}

export default function SkyBoss() {
  const isDark = useTheme();
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  /* ── React state ─────────────────────────────────────────── */
  const [region, setRegion] = useState("eu");
  const [intervalMs, setIntervalMs] = useState(30000);
  const [spin, setSpin] = useState(true);
  const [status, setStatus] = useState({ text: "Connecting…", live: false });
  const [count, setCount] = useState(0);
  const [updated, setUpdated] = useState("—");
  const [credits, setCredits] = useState("—");
  const [showAuth, setShowAuth] = useState(false);
  const [cid, setCid] = useState("");
  const [csec, setCsec] = useState("");
  const [btok, setBtok] = useState("");
  const [detail, setDetail] = useState(null);
  const [toast, setToast] = useState(null);

  /* ── Three.js refs ───────────────────────────────────────── */
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const globeRef = useRef(null);
  const acPointsRef = useRef(null);
  const acGeoRef = useRef(null);
  const metaRef = useRef([]);
  const rotRef = useRef({ y: -0.3, x: 0.32 });
  const dragRef = useRef({ active: false, px: 0, py: 0 });
  const downRef = useRef(null);
  const spinRef = useRef(true);
  const rafRef = useRef(null);
  const timerRef = useRef(null);
  const loadingRef = useRef(false);
  const tokenRef = useRef(null);
  const tokenExpRef = useRef(0);

  /* ── Toast helper ────────────────────────────────────────── */
  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 6000);
  }, []);

  /* ── Token ────────────────────────────────────────────────── */
  const getToken = useCallback(async () => {
    if (btok.trim()) return btok.trim();
    if (tokenRef.current && Date.now() < tokenExpRef.current) return tokenRef.current;

    // Try user-entered credentials
    if (cid.trim() && csec.trim()) {
      try {
        const body = new URLSearchParams({ grant_type: "client_credentials", client_id: cid, client_secret: csec });
        const res = await fetch(TOKEN_URL, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: body.toString(),
        });
        if (res.ok) {
          const d = await res.json();
          tokenRef.current = d.access_token;
          tokenExpRef.current = Date.now() + (d.expires_in - 30) * 1000;
          showToast("Authenticated · 4,000 credits/day · 5 s resolution");
          return tokenRef.current;
        }
      } catch { /* fall through */ }
    }

    return null;
  }, [cid, csec, btok, showToast]);

  /* ── Fetch states from OpenSky ───────────────────────────── */
  const fetchStates = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setStatus({ text: "Fetching…", live: false });
    try {
      const tok = await getToken();
      const bbox = BBOX[region];
      let url = STATES_URL;
      if (bbox) url += `&lamin=${bbox[0]}&lomin=${bbox[1]}&lamax=${bbox[2]}&lomax=${bbox[3]}`;
      const opt = tok ? { headers: { Authorization: `Bearer ${tok}` } } : {};

      const res = await fetch(url, opt);
      const cr = res.headers.get("X-Rate-Limit-Remaining");
      if (cr !== null) setCredits(cr);
      if (res.status === 429) { showToast("Rate limit reached — slow the refresh or authenticate."); throw 0; }
      if (!res.ok) throw 0;

      const data = await res.json();
      renderToGlobe(data?.states || []);
      setStatus({ text: "Live", live: true });
      setUpdated(new Date().toLocaleTimeString());
    } catch {
      setStatus({ text: "Connection failed", live: false });
      showToast("Could not reach OpenSky. Some networks block the API.");
    } finally {
      loadingRef.current = false;
    }
  }, [region, getToken, showToast]);

  /* ── Render aircraft to Three.js ─────────────────────────── */
  const renderToGlobe = useCallback((states) => {
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
    const geo = acGeoRef.current;
    if (!geo) return;
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    geo.attributes.position.needsUpdate = true;
    metaRef.current = meta;
    setCount(meta.length);
  }, []);

  /* ── Click → detail ──────────────────────────────────────── */
  const pick = useCallback((e) => {
    const cv = canvasRef.current;
    if (!cv || !acPointsRef.current) return;
    const r = cv.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      -((e.clientY - r.top) / r.height) * 2 + 1
    );
    const ray = new THREE.Raycaster();
    ray.params.Points.threshold = 0.022;
    ray.setFromCamera(mouse, cameraRef.current);
    const hits = ray.intersectObject(acPointsRef.current);
    if (hits.length > 0) {
      setDetail(metaRef.current[hits[0].index]);
    }
  }, []);

  /* ── Setup Three.js scene ────────────────────────────────── */
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const W = container.clientWidth;
    const H = container.clientHeight;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
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

    /* Earth core */
    const coreMat = new THREE.MeshPhongMaterial({
      color: 0x16213f, emissive: 0x05091c, shininess: 6, specular: 0x102844,
    });
    const core = new THREE.Mesh(new THREE.SphereGeometry(1, 72, 72), coreMat);
    globe.add(core);
    new THREE.TextureLoader().load(EARTH_TEX, (t) => {
      coreMat.map = t; coreMat.color.set(0xffffff); coreMat.needsUpdate = true;
    });

    /* Grid */
    const grid = new THREE.Mesh(
      new THREE.SphereGeometry(1.003, 36, 24),
      new THREE.MeshBasicMaterial({ color: 0x1f6f86, wireframe: true, transparent: true, opacity: 0.10 })
    );
    globe.add(grid);

    /* Atmosphere */
    const atmo = new THREE.Mesh(
      new THREE.SphereGeometry(1.10, 48, 48),
      new THREE.MeshBasicMaterial({ color: 0x00b8d4, transparent: true, opacity: 0.06, side: THREE.BackSide })
    );
    globe.add(atmo);

    /* Lights */
    scene.add(new THREE.AmbientLight(0x3a5575, 0.85));
    const sun = new THREE.DirectionalLight(0xfff1d6, 0.9);
    sun.position.set(3, 1.5, 2.5);
    scene.add(sun);

    /* Starfield */
    const sg = new THREE.BufferGeometry();
    const sp = [];
    for (let i = 0; i < 800; i++) {
      const v = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5)
        .normalize().multiplyScalar(22 + Math.random() * 22);
      sp.push(v.x, v.y, v.z);
    }
    sg.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3));
    scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0x8fa8cc, size: 0.07, transparent: true, opacity: 0.7 })));

    /* Aircraft point cloud */
    const acGeo = new THREE.BufferGeometry();
    acGeoRef.current = acGeo;
    const acMat = new THREE.PointsMaterial({
      size: 0.045,
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

    /* Animation loop */
    const loop = () => {
      rafRef.current = requestAnimationFrame(loop);
      if (spinRef.current && !dragRef.current.active) rotRef.current.y += 0.0016;
      globe.rotation.y = rotRef.current.y;
      globe.rotation.x = rotRef.current.x;
      renderer.render(scene, camera);
    };
    loop();

    /* Resize */
    const onResize = () => {
      const w = container.clientWidth, h = container.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    /* Pointer events */
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
  }, [pick]);

  /* ── Sync spin ref ───────────────────────────────────────── */
  useEffect(() => { spinRef.current = spin; }, [spin]);

  /* ── Auto-refresh interval ───────────────────────────────── */
  useEffect(() => {
    clearInterval(timerRef.current);
    if (intervalMs > 0) timerRef.current = setInterval(fetchStates, intervalMs);
    return () => clearInterval(timerRef.current);
  }, [intervalMs, fetchStates]);

  /* ── Fetch on region change + initial ────────────────────── */
  useEffect(() => { fetchStates(); }, [region, fetchStates]);

  return (
    <div ref={containerRef} className="fixed inset-0 bg-[#04030c] overflow-hidden" style={{ zIndex: 1 }}>
      <canvas ref={canvasRef} className="block w-full h-full cursor-grab" />

      {/* ── HUD Panel ───────────────────────────────────────── */}
      <div className="absolute top-4 left-4 w-[272px] glass-card p-4 space-y-3">
        <div>
          <h1 className="text-[14px] font-bold tracking-wider text-[#00f5ff] uppercase">
            SKYBOSS · LIVE TRAFFIC
          </h1>
          <p className="text-[10px] text-white/40 mt-0.5 tracking-wider">ABOS — Aircraft Buy Or Sell · OpenSky</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] uppercase tracking-wider text-white/40">Region</label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-[140px] bg-[#0A081E]/80 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
            >
              <option value="cz">Czech / CEE · 1 credit</option>
              <option value="eu">Europe · 4 credits</option>
              <option value="us">CONUS · 4 credits</option>
              <option value="global">Global · 4 credits</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-[10px] uppercase tracking-wider text-white/40">Auto-refresh</label>
            <select
              value={intervalMs}
              onChange={(e) => setIntervalMs(parseInt(e.target.value))}
              className="w-[140px] bg-[#0A081E]/80 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
            >
              <option value={0}>Off</option>
              <option value={15000}>15 s</option>
              <option value={30000}>30 s</option>
              <option value={60000}>60 s</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${status.live ? "bg-[#00f5ff] animate-pulse shadow-[0_0_8px_#00f5ff]" : "bg-white/30"}`} />
            <span className="text-xs text-white/70">{status.text}</span>
          </span>
          <span className="text-xs font-bold tabular-nums text-[#00f5ff]">{count.toLocaleString()} aircraft</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-white/40">Updated</span>
          <span className="text-xs tabular-nums text-white/70">{updated}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-white/40">Credits left</span>
          <span className="text-xs tabular-nums text-[#D4A017] font-bold">{credits}</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchStates}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs hover:border-[#00f5ff] hover:text-[#00f5ff] transition-colors"
          >
            <RotateCw className="w-3 h-3" /> Refresh
          </button>
          <button
            onClick={() => setSpin(!spin)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs hover:border-[#00f5ff] hover:text-[#00f5ff] transition-colors"
          >
            {spin ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {spin ? "Pause spin" : "Resume spin"}
          </button>
        </div>

        {/* Auth */}
        <div className="border-t border-white/[0.07] pt-3">
          <button
            onClick={() => setShowAuth(!showAuth)}
            className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-white/40 hover:text-white/60 transition-colors w-full"
          >
            {showAuth ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            Authentication (higher limits)
          </button>
          {showAuth && (
            <div className="mt-2 space-y-2">
              <input
                value={cid}
                onChange={(e) => setCid(e.target.value)}
                placeholder="client_id"
                className="w-full bg-[#0A081E]/80 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none placeholder:text-white/20"
              />
              <input
                value={csec}
                onChange={(e) => setCsec(e.target.value)}
                type="password"
                placeholder="client_secret"
                className="w-full bg-[#0A081E]/80 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none placeholder:text-white/20"
              />
              <input
                value={btok}
                onChange={(e) => setBtok(e.target.value)}
                placeholder="…or paste a Bearer token"
                className="w-full bg-[#0A081E]/80 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none placeholder:text-white/20"
              />
              <p className="text-[9px] text-white/30 leading-relaxed">
                Anonymous = 400 credits/day. Enter credentials for 4,000/day + 5 s resolution. Credentials stay in your browser only.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Detail Panel ─────────────────────────────────────── */}
      {detail && (
        <div className="absolute top-4 right-4 w-[260px] glass-card p-4">
          <button onClick={() => setDetail(null)} className="absolute top-3 right-3 text-white/40 hover:text-white">
            <X className="w-4 h-4" />
          </button>
          <h2 className="text-[13px] font-bold text-[#D4A017] tracking-wide">
            {(detail[1] || "").trim() || "(no callsign)"}
          </h2>
          <p className="text-[10px] text-white/40 mt-0.5">{detail[2] || "—"}</p>
          <table className="w-full mt-3 text-xs border-collapse">
            <tbody>
              {[
                ["ICAO24", (detail[0] || "—").toUpperCase()],
                ["Altitude", detail[13] != null ? `${Math.round(detail[13] * 3.281).toLocaleString()} ft` : detail[8] ? "on ground" : "—"],
                ["Ground speed", detail[9] != null ? `${Math.round(detail[9] * 1.944)} kts` : "—"],
                ["Heading", detail[10] != null ? `${Math.round(detail[10])}°` : "—"],
                ["Vertical rate", detail[11] != null ? `${detail[11] > 0 ? "+" : ""}${Math.round(detail[11] * 196.85)} fpm` : "—"],
                ["Squawk", detail[14] || "—"],
                ["Position src", POS_SRC[detail[16]] || "—"],
                ["Lat / Lon", `${detail[6]?.toFixed(2) || "—"}, ${detail[5]?.toFixed(2) || "—"}`],
              ].map(([label, value]) => (
                <tr key={label}>
                  <td className="py-1 text-white/40">{label}</td>
                  <td className="py-1 text-right tabular-nums text-white/80 font-medium">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Legend ────────────────────────────────────────────── */}
      <div className="absolute bottom-4 left-4 flex items-center gap-4 px-4 py-2.5 glass-card text-[10px]">
        <span className="flex items-center gap-1.5 text-white/40">
          <span className="w-2.5 h-2.5 rounded-full bg-[#D4A017]" /> Low / ground
        </span>
        <span className="flex items-center gap-1.5 text-white/40">
          <span className="w-2.5 h-2.5 rounded-full bg-[#3fd0e0]" /> Mid
        </span>
        <span className="flex items-center gap-1.5 text-white/40">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00f5ff]" /> High cruise
        </span>
      </div>

      {/* ── Hint ──────────────────────────────────────────────── */}
      <div className="absolute bottom-4 right-4 text-[10px] text-white/30 tracking-wider">
        Drag to rotate · scroll to zoom · click an aircraft
      </div>

      {/* ── Toast ─────────────────────────────────────────────── */}
      {toast && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 px-4 py-2 glass-card text-xs text-[#D4A017] text-center max-w-[520px]">
          {toast}
        </div>
      )}

      {/* ── Back to Dashboard ─────────────────────────────────── */}
      <Link
        to="/"
        className="absolute top-4 right-4 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] text-white/50 hover:text-[#00f5ff] hover:border-[#00f5ff] transition-colors uppercase tracking-wider"
      >
        ← Dashboard
      </Link>
    </div>
  );
}