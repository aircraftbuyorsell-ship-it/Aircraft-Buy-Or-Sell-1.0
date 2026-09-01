import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Zap, Clock, Lock, CheckCircle2, ShieldCheck,
  FileText, Download, TrendingUp, Calculator, BarChart3,
  Users, Plane, Building2, UserCheck, ChevronRight, RotateCw, Sparkles
} from "lucide-react";

/* ─── DS v3 tokens ─── */
const INK = "#04060a";
const INK1 = "#0d1117";
const GLASS = {
  background: "rgba(255,255,255,0.04)",
  border: "0.5px solid rgba(255,255,255,0.08)",
  borderRadius: "12px",
};
const ACCENT = "#a855f7";
const ACCENT_LINE = { height: "2px", background: "#a855f7", flexShrink: 0, margin: "0 0 16px" };
const GOLD = "#f5c242";
const TEAL = "#5dcaa5";
const CYAN = "#5dcaa5";
const MUTED = "rgba(255,255,255,0.35)";
const WHITE = "rgba(255,255,255,0.90)";

/* ─── Demo data ─── */
const DEMO_LISTINGS = [
  { reg: "N-DEMO1", make: "Cessna", model: "172S Skyhawk", year: 2018, ati: 87, omvm: 285000, lat: 40.64, lon: -73.78 },
  { reg: "N-DEMO2", make: "Piper", model: "PA-28 Archer", year: 2015, ati: 72, omvm: 198000, lat: 51.47, lon: -0.46 },
  { reg: "N-DEMO3", make: "Beechcraft", model: "Baron G58", year: 2020, ati: 94, omvm: 1250000, lat: 50.03, lon: 8.57 },
  { reg: "N-DEMO4", make: "Cirrus", model: "SR22T", year: 2019, ati: 81, omvm: 620000, lat: 33.94, lon: -118.41 },
  { reg: "N-DEMO5", make: "Mooney", model: "M20V Acclaim", year: 2016, ati: 76, omvm: 445000, lat: 41.98, lon: -87.90 },
];

const VERIFY_STEPS = [
  { label: "N-Reg", sub: "FAA / EASA registry", color: "#22c55e" },
  { label: "Owner / Operator", sub: "name + address match", color: "#22c55e" },
  { label: "Dealer DB", sub: "ABOS dealer cross-ref", color: "#22c55e" },
  { label: "AW / AD / SD / STC", sub: "compliance flags", color: "#22c55e" },
  { label: "Damage History", sub: "incident & accident", color: "#22c55e" },
];

const USER_CATEGORIES = [
  { icon: Users, label: "Private Buyer", color: "#00c2cb", desc: "Individual purchase intent" },
  { icon: Plane, label: "Private Seller", color: "#22c55e", desc: "Single aircraft listing" },
  { icon: Building2, label: "Dealer / Broker", color: "#f48120", desc: "Verified dealer account" },
  { icon: UserCheck, label: "Operator / FBO", color: "#D4A017", desc: "Fleet or charter context" },
];

const UPSELL_HOOKS = [
  { icon: FileText, label: "ATI Score Report", desc: "Full 8-dimension PDF scorecard", color: "#E8A83A" },
  { icon: Download, label: "Export PDF", desc: "Download branded .pdf or .docx", color: "#a855f7" },
  { icon: TrendingUp, label: "OMVM Price Check", desc: "Off-Market Valuation Model — real comps", color: "#22c55e" },
  { icon: Calculator, label: "OPEX Calculator", desc: "Total cost of ownership breakdown", color: "#f97316" },
  { icon: BarChart3, label: "CAPEX Analysis", desc: "Investment & acquisition cost modelling", color: "#00c2cb" },
];

/* ─── Session timer ─── */
const SESSION_MS = 30 * 60 * 1000;

function useDemoSession() {
  const [expired, setExpired] = useState(false);
  const [remaining, setRemaining] = useState(SESSION_MS);

  useEffect(() => {
    const stored = sessionStorage.getItem("demo_start");
    const start = stored ? Number(stored) : Date.now();
    if (!stored) sessionStorage.setItem("demo_start", String(start));

    const tick = () => {
      const elapsed = Date.now() - start;
      const left = Math.max(0, SESSION_MS - elapsed);
      setRemaining(left);
      setExpired(left <= 0);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);

  return { expired, remaining, minutes: Math.floor(remaining / 60000), seconds: Math.floor((remaining % 60000) / 1000) };
}

/* ─── Canvas Globe ─── */
function DemoGlobe() {
  const ref = useRef(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const W = cv.parentElement.clientWidth || 400;
    const H = 320;
    cv.width = W;
    cv.height = H;
    const ctx = cv.getContext("2d");

    const cx = W / 2, cy = H / 2, r = Math.min(W, H) * 0.38;

    function draw() {
      // Sphere
      const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r * 1.1);
      grad.addColorStop(0, "rgba(26,42,74,0.9)");
      grad.addColorStop(1, "rgba(10,22,40,0.98)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // Atmosphere glow
      ctx.strokeStyle = "rgba(0,194,203,0.15)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
      ctx.stroke();

      // Grid lines
      ctx.strokeStyle = "rgba(255,255,255,0.03)";
      ctx.lineWidth = 0.5;
      for (let i = 0; i < 6; i++) {
        const y = cy - r + (r * 2 * i) / 5;
        ctx.beginPath();
        ctx.moveTo(cx - r, y);
        ctx.lineTo(cx + r, y);
        ctx.stroke();
      }
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI * i) / 4;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
        ctx.stroke();
      }

      // Gold diamond markers
      DEMO_LISTINGS.forEach((l) => {
        const lx = cx + (l.lon / 180) * r * 1.6;
        const ly = cy - (l.lat / 90) * r;
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = GOLD;
        ctx.fillRect(-4, -4, 8, 8);
        ctx.restore();
      });

      // Label
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("DEMO DATA", cx, cy + r + 20);
    }

    draw();
  }, []);

  return <canvas ref={ref} style={{ width: "100%", height: "320px", borderRadius: "16px", background: "transparent" }} />;
}

export default function IntraZoneDemo() {
  const { expired, minutes, seconds } = useDemoSession();

  const formatTime = () => `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div style={{ minHeight: "100vh", background: INK, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.09) 1.5px, transparent 1.5px)", backgroundSize: "40px 40px", color: WHITE, position: "relative", overflow: "hidden", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ position: "fixed", top: "-200px", left: "50%", transform: "translateX(-50%)", width: "800px", height: "500px", background: "radial-gradient(ellipse, rgba(168,85,247,0.06) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
      {/* DEMO DATA watermark */}
      {!expired && (
        <div style={{
          position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%) rotate(-30deg)",
          fontSize: "clamp(40px, 10vw, 120px)", fontWeight: 900, whiteSpace: "nowrap",
          color: "rgba(168,85,247,0.04)", pointerEvents: "none", zIndex: 0, letterSpacing: "0.3em",
        }}>
          DEMO DATA
        </div>
      )}

      {/* ─── DEMO Banner ─── */}
      <div style={{ position: "sticky", top: 0, zIndex: 30, background: "rgba(168,85,247,0.09)", borderBottom: "0.5px solid rgba(168,85,247,0.22)", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: "5px",
            background: "rgba(168,85,247,0.09)", border: "0.5px solid rgba(168,85,247,0.22)",
            borderRadius: "9999px", padding: "2px 10px", fontSize: "9px", fontWeight: 700,
            color: ACCENT, textTransform: "uppercase", letterSpacing: "0.08em",
          }}>
            <Sparkles size={11} /> DEMO MODE
          </span>
          <span style={{ fontSize: "11px", color: MUTED }}>
            30-minute session · Demo data only · No real aircraft
          </span>
        </div>
        <span style={{
          display: "flex", alignItems: "center", gap: "6px",
          fontFamily: "monospace", fontSize: "14px", fontWeight: 700,
          color: expired ? "#ef4444" : ACCENT,
        }}>
          <Clock size={14} />
          {expired ? "EXPIRED" : formatTime()}
        </span>
      </div>

      {/* ─── Content ─── */}
      <div style={{ position: "relative", zIndex: 10, padding: "20px 24px 80px", maxWidth: "1100px", margin: "0 auto" }}>
        <section style={{ marginBottom: "24px" }}>
          <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.2em", color: ACCENT, marginBottom: "4px" }}>A.B.O.S — AIRCRAFT BUY OR SELL</p>
          <h1 style={{ fontSize: "clamp(22px, 3vw, 32px)", fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>
            Aviation Intelligence Platform <span style={{ color: ACCENT }}>· DEMO</span>
          </h1>
        </section>

        {/* Globe */}
        <section style={{ ...GLASS, overflow: "hidden", marginBottom: "24px" }}>
          <div style={ACCENT_LINE} />
          <div style={{ padding: "4px 20px 20px" }}>
          <p style={{ fontSize: "9px", fontWeight: 600, letterSpacing: "0.12em", color: ACCENT, marginBottom: "12px", textTransform: "uppercase" }}>DEMO GLOBE · SAMPLE POSITIONS</p>
          <DemoGlobe />
          <div style={{ display: "flex", gap: "16px", marginTop: "12px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "10px", color: MUTED, display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ width: "8px", height: "8px", background: GOLD, transform: "rotate(45deg)", display: "inline-block" }} /> {DEMO_LISTINGS.length} demo listings
            </span>
            <span style={{ fontSize: "10px", color: MUTED }}>
              JFK · LHR · FRA · LAX · ORD
            </span>
          </div>
          </div>
        </section>

        {/* ATI Score demo card */}
        <section style={{ ...GLASS, overflow: "hidden", marginBottom: "24px" }}>
          <div style={ACCENT_LINE} />
          <div style={{ padding: "8px 24px 24px" }}>
          <p style={{ fontSize: "9px", fontWeight: 600, letterSpacing: "0.12em", color: ACCENT, marginBottom: "16px", textTransform: "uppercase" }}>DEMO AIRCRAFT · ATI QUICK SCORE</p>
          <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
            <div style={{ flex: "0 0 auto", textAlign: "center" }}>
              <svg width="120" height="120" viewBox="0 0 90 90">
                <defs>
                  <linearGradient id="demoTeal" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#5dcaa5" />
                    <stop offset="100%" stopColor="#3da888" />
                  </linearGradient>
                </defs>
                <circle cx="45" cy="45" r="38" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                <circle cx="45" cy="45" r="38" fill="none" stroke="url(#demoTeal)" strokeWidth="5" strokeLinecap="round"
                  strokeDasharray={`${((87 / 120) * 238.76).toFixed(1)} ${(238.76 - (87 / 120) * 238.76).toFixed(1)}`}
                  transform="rotate(-90 45 45)" />
                <text x="45" y="46" textAnchor="middle" fill={TEAL} fontSize="18" fontWeight="600" letterSpacing="-0.04em">87</text>
                <text x="45" y="58" textAnchor="middle" fill="rgba(255,255,255,0.30)" fontSize="9">/120</text>
              </svg>
              <span style={{ display: "inline-block", fontSize: "9px", fontWeight: 700, color: TEAL, marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.08em", background: "rgba(93,202,165,0.09)", border: "0.5px solid rgba(93,202,165,0.20)", borderRadius: "9999px", padding: "2px 10px" }}>Buy</span>
            </div>
            <div>
              <p style={{ fontWeight: 800, fontSize: "18px", margin: "0 0 4px" }}>
                <span style={{ color: GOLD, fontFamily: "monospace" }}>N-DEMO1</span>
                {" "}<span style={{ color: MUTED, fontWeight: 600 }}>Cessna 172S Skyhawk · 2018</span>
              </p>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "8px" }}>
                {[
                  { label: "Documentation", score: "12/15" },
                  { label: "Technical", score: "13/15" },
                  { label: "Transparency", score: "10/15" },
                  { label: "Market Readiness", score: "11/15" },
                  { label: "Config Clarity", score: "10/15" },
                  { label: "Storage", score: "9/15" },
                  { label: "Usage", score: "11/15" },
                  { label: "Transaction Ready", score: "11/15" },
                ].map((d) => (
                  <div key={d.label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "6px", padding: "6px 10px", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <span style={{ fontSize: "9px", color: MUTED, display: "block" }}>{d.label}</span>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: WHITE }}>{d.score}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: "16px", marginTop: "12px", alignItems: "baseline" }}>
                <span style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "9px", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: MUTED }}>OMVM Estimate</span>
                  <span style={{ fontSize: "24px", fontWeight: 600, letterSpacing: "-0.03em", color: TEAL }}>$285,000</span>
                </span>
                <span style={{ fontSize: "10px", color: MUTED }}>Demo data · Upgrade for real valuations</span>
              </div>
            </div>
          </div>
          </div>
        </section>

        {/* Verify Pipeline — all green */}
        <section style={{ ...GLASS, padding: "20px", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.18em", color: "#f48120", margin: 0 }}>AIRCRAFT VERIFICATION PIPELINE</p>
              <p style={{ fontSize: "11px", color: MUTED, margin: "2px 0 0" }}>All steps shown as completed for demo</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
            {VERIFY_STEPS.map((step, i) => (
              <div key={step.label} style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                <div style={{ borderRadius: "10px", padding: "8px 12px", textAlign: "center", background: `${step.color}10`, border: `1px solid ${step.color}25` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "2px" }}>
                    <CheckCircle2 size={12} color="#22c55e" />
                    <span style={{ fontSize: "9px", fontWeight: 800, color: step.color }}>{step.label}</span>
                  </div>
                  <span style={{ fontSize: "8px", color: MUTED }}>{step.sub}</span>
                </div>
                {i < VERIFY_STEPS.length - 1 && <ChevronRight size={12} color={MUTED} style={{ opacity: 0.4 }} />}
              </div>
            ))}
            <ChevronRight size={12} color={MUTED} style={{ opacity: 0.4, flexShrink: 0 }} />
            <div style={{ borderRadius: "10px", padding: "8px 12px", textAlign: "center", background: "rgba(212,160,23,0.10)", border: "1.5px solid rgba(212,160,23,0.35)", flexShrink: 0 }}>
              <span style={{ fontSize: "9px", fontWeight: 800, color: GOLD }}>ATI CARD</span>
            </div>
            <ChevronRight size={12} color={MUTED} style={{ opacity: 0.4, flexShrink: 0 }} />
            <div style={{ borderRadius: "10px", padding: "8px 12px", textAlign: "center", background: "rgba(34,197,94,0.10)", border: "1.5px solid rgba(34,197,94,0.35)", flexShrink: 0 }}>
              <ShieldCheck size={14} color="#22c55e" style={{ margin: "0 auto 1px" }} />
              <span style={{ fontSize: "9px", fontWeight: 800, color: "#22c55e" }}>ATI PASS</span>
            </div>
          </div>
        </section>

        {/* User Identity */}
        <section style={{ ...GLASS, padding: "20px", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.18em", color: GOLD, margin: 0 }}>ABOS USER IDENTITY</p>
              <p style={{ fontSize: "11px", color: MUTED, margin: "2px 0 0" }}>Get your ABOS ID — verified via LOI, contracts & purchase agreements</p>
            </div>
            <span style={{ fontSize: "10px", fontWeight: 600, padding: "4px 10px", borderRadius: "6px", background: "rgba(168,85,247,0.10)", border: "1px solid rgba(168,85,247,0.25)", color: ACCENT, display: "flex", alignItems: "center", gap: "4px" }}>
              <Lock size={10} /> Upgrade to unlock
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "8px" }}>
            {USER_CATEGORIES.map((cat) => (
              <div key={cat.label} style={{ borderRadius: "10px", padding: "10px", background: `${cat.color}08`, border: `1px solid ${cat.color}20` }}>
                <cat.icon size={14} color={cat.color} style={{ marginBottom: "4px" }} />
                <p style={{ fontSize: "10px", fontWeight: 700, color: cat.color, margin: 0 }}>{cat.label}</p>
                <p style={{ fontSize: "8px", color: MUTED, margin: "2px 0 0" }}>{cat.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Upsell hooks */}
        <section style={{ ...GLASS, padding: "20px", marginBottom: "24px" }}>
          <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.18em", color: MUTED, textAlign: "center", marginBottom: "4px" }}>GENERATE · EXPORT · ANALYSE</p>
          <p style={{ fontSize: "11px", color: MUTED, textAlign: "center", marginBottom: "14px" }}>After verification, unlock the full intelligence layer</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px" }}>
            {UPSELL_HOOKS.map((hook) => (
              <div key={hook.label} style={{ borderRadius: "10px", padding: "14px", background: `${hook.color}06`, border: `1px solid ${hook.color}20`, textAlign: "center", cursor: "pointer" }}
                onClick={() => {}}>
                <hook.icon size={18} color={hook.color} style={{ marginBottom: "8px" }} />
                <p style={{ fontSize: "10px", fontWeight: 800, color: hook.color, margin: "0 0 4px" }}>{hook.label}</p>
                <p style={{ fontSize: "9px", color: MUTED, margin: "0 0 6px" }}>{hook.desc}</p>
                <span style={{ fontSize: "9px", fontWeight: 600, color: ACCENT, display: "flex", alignItems: "center", justifyContent: "center", gap: "3px" }}>
                  <Lock size={9} /> Upgrade to unlock real data
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* CTA strip */}
        <section style={{ textAlign: "center" }}>
          <Link to="/pricing" style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            background: "linear-gradient(135deg, #D4A017, #f48120)", color: WHITE,
            border: "none", borderRadius: "12px", padding: "14px 32px",
            fontWeight: 700, fontSize: "14px", textDecoration: "none",
            letterSpacing: "0.04em", textTransform: "uppercase",
          }}>
            <Zap size={16} /> Upgrade to IntraZone
          </Link>
        </section>
      </div>

      {/* ─── Expired overlay ─── */}
      {expired && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(5,10,25,0.88)", backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}>
          <div style={{ ...GLASS, background: "rgba(255,255,255,0.10)", maxWidth: "440px", width: "90%", textAlign: "center", padding: "40px 32px" }}>
            <div style={{
              width: "56px", height: "56px", borderRadius: "50%", margin: "0 auto 20px",
              background: "rgba(168,85,247,0.12)", border: "2px solid rgba(168,85,247,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Clock size={26} color={ACCENT} />
            </div>
            <h2 style={{ fontSize: "20px", fontWeight: 800, margin: "0 0 8px", letterSpacing: "-0.01em" }}>
              Your demo session has ended
            </h2>
            <p style={{ color: MUTED, fontSize: "13px", marginBottom: "28px", lineHeight: 1.6 }}>
              The 30-minute demo session has expired. Upgrade to IntraZone for unlimited access to real aircraft data, ATI scoring, OMVM valuations, and more.
            </p>
            <Link to="/pricing" style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: "linear-gradient(135deg, #D4A017, #f48120)", color: WHITE,
              border: "none", borderRadius: "10px", padding: "12px 28px",
              fontWeight: 700, fontSize: "13px", textDecoration: "none",
              letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "14px",
            }}>
              <Zap size={14} /> Upgrade to IntraZone
            </Link>
            <div>
              <button onClick={() => {
                sessionStorage.removeItem("demo_start");
                window.location.reload();
              }} style={{
                display: "inline-flex", alignItems: "center", gap: "4px",
                background: "transparent", border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "8px", color: MUTED, fontSize: "12px",
                padding: "8px 18px", cursor: "pointer", fontWeight: 600,
              }}>
                <RotateCw size={12} /> Start new demo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}