import { useEffect, useRef, useState } from "react";

// ─── Glass pill card ───────────────────────────────────────────
function GlassCard({ children, className = "", style = {} }) {
  return (
    <div
      className={className}
      style={{
        background: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 16,
        boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Accent dot ────────────────────────────────────────────────
function Dot({ color }) {
  return (
    <span
      style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: color,
        boxShadow: `0 0 8px ${color}80`,
        flexShrink: 0,
      }}
    />
  );
}

// ─── Stat pill (bottom-left stack style) ───────────────────────
function StatPill({ color, label, value }) {
  return (
    <GlassCard
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 16px",
        borderRadius: 999,
      }}
    >
      <Dot color={color} />
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
        <span style={{ fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {label}
        </span>
        <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{value}</span>
      </div>
    </GlassCard>
  );
}

// ─── Black Globe (canvas) ─────────────────────────────────────
const POLYGONS = [
  [[[-168,72],[-140,71],[-125,50],[-124,49],[-124,46],[-122,38],[-117,32],[-110,24],[-105,20],[-99,16],[-91,16],[-88,16],[-84,10],[-79,9],[-77,8],[-63,11],[-60,11],[-53,47],[-56,47],[-64,44],[-67,44],[-70,43],[-70,41],[-74,40],[-76,35],[-80,32],[-81,30],[-81,29],[-80,25],[-80,24],[-97,26],[-97,30],[-93,30],[-90,29],[-89,29],[-93,28],[-97,26],[-100,25],[-107,24],[-110,26],[-117,32],[-124,49],[-141,60],[-168,72]]],
  [[[-45,83],[-20,83],[-18,76],[-22,72],[-28,68],[-40,64],[-44,60],[-52,62],[-52,66],[-54,70],[-58,74],[-50,78],[-45,83]]],
  [[[-72,12],[-63,10],[-52,5],[-50,2],[-50,0],[-50,-2],[-36,-8],[-35,-10],[-37,-12],[-39,-16],[-40,-20],[-41,-22],[-43,-23],[-47,-25],[-48,-27],[-50,-30],[-52,-33],[-52,-34],[-57,-35],[-57,-36],[-58,-38],[-60,-38],[-62,-40],[-63,-42],[-65,-42],[-66,-44],[-67,-46],[-66,-48],[-68,-50],[-68,-52],[-65,-54],[-67,-55],[-65,-55],[-70,-53],[-75,-50],[-75,-44],[-73,-42],[-72,-38],[-72,-36],[-72,-32],[-72,-30],[-71,-28],[-70,-24],[-70,-22],[-70,-18],[-70,-16],[-75,-14],[-76,-12],[-78,-10],[-78,-6],[-78,-4],[-80,-2],[-80,0],[-80,2],[-78,5],[-77,8],[-76,10],[-73,12],[-72,12]]],
  [[[26,71],[28,68],[20,64],[16,60],[12,58],[8,58],[4,57],[4,56],[8,54],[10,54],[14,54],[10,54],[8,54],[6,53],[4,52],[2,51],[0,51],[-2,49],[-5,48],[-2,48],[-2,47],[-2,46],[0,44],[3,43],[8,44],[8,46],[14,44],[18,43],[18,42],[20,42],[22,42],[24,43],[26,44],[28,45],[30,46],[30,45],[28,47],[22,47],[18,48],[18,50],[22,48],[24,48],[26,50],[26,52],[20,52],[14,52],[8,52],[6,51],[4,52],[6,53],[8,54],[14,54],[18,55],[18,56],[12,58],[8,58],[4,57],[4,58],[6,58],[5,62],[14,65],[20,68],[28,68],[26,71]]],
  [[[30,70],[50,70],[70,70],[90,68],[100,65],[132,65],[140,60],[138,56],[142,50],[142,48],[136,44],[130,42],[130,38],[136,34],[122,30],[120,26],[114,22],[110,20],[108,16],[106,12],[104,8],[104,2],[104,-2],[106,-4],[108,-6],[110,-8],[116,-8],[114,-6],[110,-4],[108,-2],[104,0],[100,4],[100,6],[98,8],[100,12],[98,16],[96,18],[92,22],[92,24],[88,24],[88,22],[86,18],[84,16],[82,14],[80,10],[78,10],[74,14],[72,16],[72,18],[70,20],[68,20],[68,22],[68,24],[68,26],[66,28],[62,28],[60,26],[58,24],[56,22],[54,26],[52,28],[50,28],[48,30],[44,34],[36,34],[36,36],[36,38],[38,40],[40,40],[42,42],[42,44],[44,44],[46,46],[48,48],[50,50],[52,52],[52,54],[50,52],[48,46],[44,42],[42,42],[40,40],[38,38],[36,36],[34,36],[32,44],[30,48],[48,30],[52,28],[56,22],[54,26],[52,28],[50,32],[50,36],[52,38],[54,50],[56,52],[60,54],[64,56],[68,60],[70,60]]],
  [[[128,-14],[130,-14],[134,-14],[136,-14],[138,-14],[138,-16],[140,-16],[141,-17],[140,-20],[138,-22],[138,-24],[140,-26],[142,-26],[144,-26],[148,-26],[152,-27],[154,-28],[153,-30],[152,-32],[151,-34],[150,-36],[148,-38],[146,-38],[142,-38],[140,-37],[138,-36],[136,-35],[136,-34],[134,-34],[132,-34],[130,-34],[128,-32],[116,-30],[114,-28],[114,-26],[114,-24],[114,-22],[118,-20],[122,-18],[124,-16],[126,-15],[128,-14]]],
];

function BlackGlobe({ rotationSpeed = 0.06 }) {
  const canvasRef = useRef(null);
  const rotRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    let W, H, R, CX, CY, DPR;

    const resize = () => {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      const rect = cv.parentElement.getBoundingClientRect();
      W = Math.round(rect.width * DPR);
      H = Math.round(rect.height * DPR);
      cv.width = W; cv.height = H;
      cv.style.width = rect.width + "px";
      cv.style.height = rect.height + "px";
      R = Math.min(W, H) * 0.42;
      CX = W / 2;
      CY = H / 2;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(cv.parentElement);

    const project = (lon, lat) => {
      const phi = (90 - lat) * Math.PI / 180;
      const theta = (lon + 180 + rotRef.current) * Math.PI / 180;
      const x = -Math.sin(phi) * Math.cos(theta);
      const y = Math.cos(phi);
      const z = Math.sin(phi) * Math.sin(theta);
      return { sx: CX + x * R, sy: CY - y * R, vis: z > 0, depth: z };
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // Ocean — pure black sphere
      const oceanGrad = ctx.createRadialGradient(CX - R * 0.3, CY - R * 0.3, R * 0.1, CX, CY, R);
      oceanGrad.addColorStop(0, "#0A0A0A");
      oceanGrad.addColorStop(0.7, "#050505");
      oceanGrad.addColorStop(1, "#000000");
      ctx.beginPath();
      ctx.arc(CX, CY, R, 0, Math.PI * 2);
      ctx.fillStyle = oceanGrad;
      ctx.fill();

      // Clip to globe
      ctx.save();
      ctx.beginPath();
      ctx.arc(CX, CY, R, 0, Math.PI * 2);
      ctx.clip();

      // Continent silhouettes — very dark grey
      for (const poly of POLYGONS) {
        for (const ring of poly) {
          ctx.beginPath();
          ring.forEach(([lon, lat], i) => {
            const p = project(lon, lat);
            if (i === 0) ctx.moveTo(p.sx, p.sy);
            else ctx.lineTo(p.sx, p.sy);
          });
          ctx.closePath();
          const alpha = 0.85;
          ctx.fillStyle = `rgba(20,20,20,${alpha})`;
          ctx.fill();
          ctx.strokeStyle = "rgba(40,40,40,0.5)";
          ctx.lineWidth = 0.5 * DPR;
          ctx.stroke();
        }
      }

      // Subtle dot grid for texture
      ctx.fillStyle = "rgba(255,255,255,0.015)";
      for (let la = -80; la <= 80; la += 8) {
        for (let lo = -180; lo <= 180; lo += 8) {
          const p = project(lo, la);
          if (!p.vis) continue;
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, 0.6 * DPR, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();

      // Rim glow — very subtle
      const rimGrad = ctx.createRadialGradient(CX, CY, R * 0.96, CX, CY, R * 1.12);
      rimGrad.addColorStop(0, "rgba(245,158,11,0.04)");
      rimGrad.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(CX, CY, R * 1.12, 0, Math.PI * 2);
      ctx.fillStyle = rimGrad;
      ctx.fill();

      // Thin rim line
      ctx.beginPath();
      ctx.arc(CX, CY, R, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1 * DPR;
      ctx.stroke();
    };

    const loop = () => {
      rotRef.current += rotationSpeed;
      draw();
      rafRef.current = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [rotationSpeed]);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />;
}

// ─── Main HUD overlay ─────────────────────────────────────────
export default function BlackGlobeHUD({
  utcTime,
  flight = { callsign: "AA102", aircraft: "B738" },
  stats = { adsbCount: 2315, liveDbCount: 10987, faaCount: 456 },
  listingsCount = 142,
}) {
  const [time, setTime] = useState(utcTime || "");

  useEffect(() => {
    if (utcTime) return;
    const update = () => {
      const d = new Date();
      const h = String(d.getUTCHours()).padStart(2, "0");
      const m = String(d.getUTCMinutes()).padStart(2, "0");
      const s = String(d.getUTCSeconds()).padStart(2, "0");
      setTime(`${h}:${m}:${s}`);
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [utcTime]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", minHeight: 500, background: "#000", overflow: "hidden", borderRadius: 16 }}>
      {/* Globe background */}
      <div style={{ position: "absolute", inset: 0 }}>
        <BlackGlobe />
      </div>

      {/* ── Top-Left: UTC time pill ── */}
      <div style={{ position: "absolute", top: 20, left: 20, zIndex: 10 }}>
        <GlassCard
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 18px",
            borderRadius: 999,
          }}
        >
          <Dot color="#F59E0B" />
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#fff", fontFamily: "'Courier New', monospace" }}>
              {time}
            </span>
            <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>UTC</span>
          </div>
        </GlassCard>
      </div>

      {/* ── Top-Right: Flight card ── */}
      <div style={{ position: "absolute", top: 20, right: 20, zIndex: 10 }}>
        <GlassCard
          style={{
            display: "flex",
            gap: 16,
            padding: "12px 16px",
            borderRadius: 16,
            position: "relative",
          }}
        >
          <div style={{ position: "absolute", top: 10, right: 10 }}>
            <Dot color="#0D9488" />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Flight</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: "'Courier New', monospace" }}>{flight.callsign}</span>
          </div>
          <div style={{ width: 1, background: "rgba(255,255,255,0.1)" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Aircraft</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: "'Courier New', monospace" }}>{flight.aircraft}</span>
          </div>
        </GlassCard>
      </div>

      {/* ── Bottom-Left: Stat stack ── */}
      <div style={{ position: "absolute", bottom: 20, left: 20, zIndex: 10, display: "flex", flexDirection: "column", gap: 8 }}>
        <StatPill color="#F59E0B" label="ADS-B count" value={stats.adsbCount.toLocaleString()} />
        <StatPill color="#0D9488" label="Live DB count" value={stats.liveDbCount.toLocaleString()} />
        <StatPill color="#0D9488" label="FAA count" value={stats.faaCount.toLocaleString()} />
      </div>

      {/* ── Bottom-Right: Listings pill ── */}
      <div style={{ position: "absolute", bottom: 20, right: 20, zIndex: 10 }}>
        <GlassCard
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 18px",
            borderRadius: 999,
          }}
        >
          <Dot color="#F59E0B" />
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
            <span style={{ fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.08em" }}>listings count</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>Total Listings: {listingsCount}</span>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}