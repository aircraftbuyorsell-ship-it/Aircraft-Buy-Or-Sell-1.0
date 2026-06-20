import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Check, Heart, ArrowRight } from "lucide-react";

const STEPS = [
  {
    label: "STEP 01",
    title: "Score any aircraft in seconds",
    body: "Run an 8-dimension ATI Intelligence analysis on any aircraft in the register. Get market value, risk flags, and a deal rating before you spend a single hour on due diligence.",
    bullets: ["8-dimension scoring engine", "Open Market Value estimate (OMVM)"],
    cta: "Try ATI Quick Score →",
    route: "/ati-quick-score",
    navLabel: "Score any aircraft",
  },
  {
    label: "STEP 02",
    title: "Compare, filter & shortlist",
    body: "Browse 247+ verified listings. Filter by type, hours, price, and ATI score. Shortlist candidates and discard noise in one click — your shortlist persists across sessions.",
    bullets: ["Live ATI scores on every listing", "Swipe-to-shortlist, discard to focus"],
    cta: "Browse Aircraft Register →",
    route: "/listings",
    navLabel: "Compare & shortlist",
  },
  {
    label: "STEP 03",
    title: "Close with full confidence",
    body: "Connect with sellers through ABOS IntraZone. Coordinate pre-buy inspection, open escrow, and transfer title — all tracked in one deal thread.",
    bullets: ["Integrated escrow coordination", "ATI Verify for pre-buy sign-off"],
    cta: "Open Escrow Dashboard →",
    route: "/escrow",
    navLabel: "Close with confidence",
  },
];

const GOLD = "#E8A83A";
const AUTO_MS = 6000;

export default function PlatformTour() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const manualRef = useRef(false);
  const timeoutRef = useRef(null);

  const changeStep = useCallback((next) => {
    setActiveStep((cur) => {
      if (next === cur) return cur;
      setAnimating(true);
      setTimeout(() => {
        setActiveStep(next);
        setAnimKey((k) => k + 1);
        setAnimating(false);
      }, 350);
      return cur;
    });
  }, []);

  const goTo = (i) => { manualRef.current = true; changeStep(i); };
  const prev = () => { manualRef.current = true; changeStep((activeStep - 1 + STEPS.length) % STEPS.length); };
  const next = () => { manualRef.current = true; changeStep((activeStep + 1) % STEPS.length); };

  // Auto-advance unless the user has interacted
  useEffect(() => {
    if (manualRef.current) return;
    timeoutRef.current = setTimeout(() => {
      setActiveStep((cur) => {
        const n = (cur + 1) % STEPS.length;
        setAnimating(true);
        setTimeout(() => { setActiveStep(n); setAnimKey((k) => k + 1); setAnimating(false); }, 350);
        return cur;
      });
    }, AUTO_MS);
    return () => clearTimeout(timeoutRef.current);
  }, [activeStep]);

  const step = STEPS[activeStep];
  const isLast = activeStep === STEPS.length - 1;

  return (
    <div style={{ width: "100%" }}>
      <style>{KEYFRAMES}</style>

      {/* ── ZONE 1 — Step navigator ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 20 }}>
        {STEPS.map((s, i) => {
          const active = i === activeStep;
          const passed = i < activeStep;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "0 0 auto", minWidth: 0 }}>
              <button
                onClick={() => goTo(i)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 14px", borderRadius: 999, cursor: "pointer",
                  background: active ? "rgba(232,168,58,0.10)" : "rgba(255,255,255,0.06)",
                  border: `1px solid ${active ? "rgba(232,168,58,0.45)" : "rgba(255,255,255,0.08)"}`,
                  boxShadow: active ? "0 0 16px rgba(232,168,58,0.25)" : "none",
                  transition: "all 0.3s ease", whiteSpace: "nowrap",
                }}
              >
                <span style={{
                  width: 24, height: 24, borderRadius: "50%", display: "flex",
                  alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800,
                  border: `1.5px solid ${active || passed ? GOLD : "rgba(255,255,255,0.2)"}`,
                  color: active || passed ? GOLD : "rgba(255,255,255,0.35)",
                  background: active ? "rgba(232,168,58,0.12)" : "transparent",
                }}>{i + 1}</span>
                <span style={{
                  fontSize: 12, fontWeight: 700,
                  color: active ? GOLD : "rgba(255,255,255,0.3)",
                }} className="pt-hide-sm">{s.navLabel}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div style={{
                  flex: 1, height: 1.5, margin: "0 8px", borderRadius: 2, minWidth: 12,
                  background: passed ? GOLD : "rgba(255,255,255,0.1)",
                  transition: "background 0.4s ease",
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* ── ZONE 2 — Step content panel ── */}
      <div style={{
        position: "relative", overflow: "hidden",
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 20, minHeight: 340, padding: 28,
      }}>
        {/* dot grid overlay */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.5,
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }} />
        {/* gold ambient glow */}
        <div style={{
          position: "absolute", top: -40, left: "50%", transform: "translateX(-50%)",
          width: 420, height: 220, pointerEvents: "none",
          background: "radial-gradient(ellipse, rgba(232,168,58,0.08) 0%, transparent 70%)",
        }} />

        <div
          key={animKey}
          style={{
            position: "relative", zIndex: 1,
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "center",
            animation: animating ? "none" : "pt-enter 350ms ease-out",
            opacity: animating ? 0 : 1,
            transition: "opacity 200ms ease",
          }}
          className="pt-grid"
        >
          {/* LEFT column */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.18em", color: GOLD, marginBottom: 10 }}>{step.label}</p>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: "#fff", lineHeight: 1.15, margin: 0 }}>{step.title}</h2>
            <p style={{ fontSize: 15, lineHeight: 1.7, color: "rgba(255,255,255,0.5)", marginTop: 14 }}>{step.body}</p>
            <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 10 }}>
              {step.bullets.map((b, bi) => (
                <div key={bi} style={{ display: "flex", alignItems: "center", gap: 10, animation: `pt-fade 400ms ease-out ${200 + bi * 120}ms both` }}>
                  <span style={{
                    width: 20, height: 20, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                    background: "rgba(232,168,58,0.14)", border: `1px solid rgba(232,168,58,0.4)`, flexShrink: 0,
                  }}>
                    <Check size={12} color={GOLD} strokeWidth={3} />
                  </span>
                  <span style={{ fontSize: 13.5, color: "#fff", fontWeight: 500 }}>{b}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate(step.route)}
              style={{
                marginTop: 24, padding: "11px 20px", borderRadius: 12, cursor: "pointer",
                background: GOLD, color: "#0B1220", fontSize: 13, fontWeight: 800,
                border: "none", letterSpacing: "0.01em",
                boxShadow: "0 4px 18px rgba(232,168,58,0.3)", transition: "filter 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
            >{step.cta}</button>
          </div>

          {/* RIGHT column — animated visual */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 280 }} className="pt-visual">
            {activeStep === 0 && <ScoreVisual k={animKey} />}
            {activeStep === 1 && <CompareVisual k={animKey} />}
            {activeStep === 2 && <CloseVisual k={animKey} />}
          </div>
        </div>
      </div>

      {/* ── Navigation controls ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 18 }}>
        <div style={{ display: "flex", gap: 10 }}>
          <CircleBtn onClick={prev}><ChevronLeft size={18} /></CircleBtn>
          <CircleBtn onClick={next}><ChevronRight size={18} /></CircleBtn>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {STEPS.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} style={{
              height: 6, width: i === activeStep ? 20 : 6, borderRadius: 999, cursor: "pointer",
              border: "none", padding: 0,
              background: i === activeStep ? GOLD : "rgba(255,255,255,0.3)",
              transition: "all 0.3s ease",
            }} />
          ))}
        </div>

        <button
          onClick={() => (isLast ? navigate("/listings") : next())}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, color: GOLD, display: "flex", alignItems: "center", gap: 4 }}
        >
          {isLast ? "Get started" : "Next step"} <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}

function CircleBtn({ children, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
      background: "transparent", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)",
      cursor: "pointer", transition: "all 0.2s",
    }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(232,168,58,0.5)"; e.currentTarget.style.color = GOLD; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
    >{children}</button>
  );
}

/* ── STEP 1 visual — ATI gauge + dimension bars ── */
function ScoreVisual({ k }) {
  const R = 54, C = 2 * Math.PI * R, pct = 0.91;
  return (
    <div key={k} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
      <div style={{ position: "relative", width: 140, height: 140 }}>
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
          <circle cx="70" cy="70" r={R} fill="none" stroke={GOLD} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={C}
            style={{ strokeDashoffset: C, animation: "pt-gauge 1s ease-out 200ms forwards", transform: "rotate(-90deg)", transformOrigin: "70px 70px" }}
          />
          <style>{`@keyframes pt-gauge{to{stroke-dashoffset:${C * (1 - pct)}px}}`}</style>
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 34, fontWeight: 800, color: GOLD, lineHeight: 1 }}>91</span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 4, letterSpacing: "0.1em" }}>ATI Score</span>
        </div>
      </div>
      <div style={{ width: "100%", maxWidth: 220, display: "flex", flexDirection: "column", gap: 10 }}>
        {[["Airframe", 0.92], ["Engine", 0.85], ["Docs", 0.78]].map(([label, val], i) => (
          <div key={label}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.45)" }}>{label}</span>
            </div>
            <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 3, background: GOLD, width: 0, animation: `pt-bar 800ms ease-out ${i * 100 + 300}ms forwards`, ["--pt-w"]: `${val * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── STEP 2 visual — listing card stack + shortlist heart ── */
function CompareVisual({ k }) {
  const cards = [
    { name: "2019 Cirrus SR22T", price: "$845,000", ati: 91, off: 0 },
    { name: "2016 Cessna TTx", price: "$629,000", ati: 84, off: 1 },
  ];
  return (
    <div key={k} style={{ position: "relative", width: 240, height: 220 }}>
      {cards.map((c, i) => (
        <div key={i} style={{
          position: "absolute", left: i * 16, top: i * 18 + 10, width: 210,
          background: "rgba(13,21,38,0.95)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 14, padding: 16, zIndex: cards.length - i,
          animation: `pt-cardup 500ms ease-out ${i * 150}ms both`,
          boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
        }}>
          <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(232,168,58,0.14)", border: "1px solid rgba(232,168,58,0.4)", color: GOLD, fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 999 }}>ATI {c.ati}</div>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(232,168,58,0.1)", marginBottom: 12 }} />
          <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: 0 }}>{c.name}</p>
          <p style={{ fontSize: 15, fontWeight: 800, color: GOLD, marginTop: 6, marginBottom: 0 }}>{c.price}</p>
        </div>
      ))}
      <button style={{
        position: "absolute", bottom: 0, right: 0, width: 44, height: 44, borderRadius: "50%",
        background: GOLD, border: "none", display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 6px 20px rgba(232,168,58,0.4)", zIndex: 10, cursor: "pointer",
        animation: "pt-pulse 2s ease-in-out infinite",
      }}>
        <Heart size={20} color="#0B1220" fill="#0B1220" />
      </button>
    </div>
  );
}

/* ── STEP 3 visual — vertical status stepper ── */
function CloseVisual({ k }) {
  const steps = [
    { label: "Offer sent", state: "done" },
    { label: "Pre-buy inspection", state: "done" },
    { label: "Escrow opened", state: "active" },
    { label: "Title transfer", state: "pending" },
  ];
  return (
    <div key={k} style={{ width: "100%", maxWidth: 240, display: "flex", flexDirection: "column", gap: 0 }}>
      {steps.map((s, i) => {
        const done = s.state === "done", active = s.state === "active";
        const color = done ? "#22c55e" : active ? GOLD : "rgba(255,255,255,0.25)";
        return (
          <div key={i} style={{ display: "flex", gap: 14, animation: `pt-fade 400ms ease-out ${i * 100 + 150}ms both` }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{
                width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                background: done ? "rgba(34,197,94,0.15)" : active ? "rgba(232,168,58,0.15)" : "rgba(255,255,255,0.05)",
                border: `1.5px solid ${color}`,
              }}>
                {done ? <Check size={12} color="#22c55e" strokeWidth={3} />
                  : active ? <span style={{ width: 8, height: 8, borderRadius: "50%", background: GOLD, animation: "pt-dot 1.5s ease-in-out infinite" }} />
                  : <span style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.25)" }} />}
              </div>
              {i < steps.length - 1 && <div style={{ width: 1.5, flex: 1, minHeight: 26, background: done ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.1)" }} />}
            </div>
            <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? "#fff" : done ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.35)", paddingTop: 1, paddingBottom: 16 }}>{s.label}</span>
          </div>
        );
      })}
    </div>
  );
}

const KEYFRAMES = `
@keyframes pt-enter { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
@keyframes pt-fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes pt-bar { to { width: var(--pt-w); } }
@keyframes pt-cardup { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
@keyframes pt-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.08); } }
@keyframes pt-dot { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.4); opacity: 0.4; } }
@media (max-width: 720px) {
  .pt-grid { grid-template-columns: 1fr !important; }
  .pt-visual { order: -1; }
  .pt-hide-sm { display: none !important; }
}
`;