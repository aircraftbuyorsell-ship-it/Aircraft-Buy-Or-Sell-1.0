/**
 * AITransparency.jsx — ABOS Marketspace
 * EU AI Act Article 50 — AI Transparency Disclosure
 * DS v3 styling · CZ/EN language toggle
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Brain, AlertTriangle, CheckCircle } from "lucide-react";

const C = {
  ink: "#04060a", ink1: "#0d1117", ink2: "#111620",
  amber: "#f5c242", amberDim: "rgba(245,194,66,0.09)", amberBorder: "rgba(245,194,66,0.22)",
  teal: "#5dcaa5", tealDim: "rgba(93,202,165,0.09)", tealBorder: "rgba(93,202,165,0.20)",
  w1: "rgba(255,255,255,0.90)", w2: "rgba(255,255,255,0.60)",
  w3: "rgba(255,255,255,0.35)", border: "rgba(255,255,255,0.08)",
};

const CONTENT = {
  cz: {
    eyebrow: "Nařízení EU o umělé inteligenci · Čl. 50",
    title: "Transparentnost AI",
    subtitle: "Informace o využití umělé inteligence · ABOS Marketspace",
    chips: ["AI Act 2024/1689", "Čl. 50 — transparentnost", "Platné od 2. 8. 2026"],
    introTitle: "Používání umělé inteligence na platformě ABOS",
    intro: "Aircraft Buy Or Sell využívá nástroje umělé inteligence k podpoře následujících funkcí:",
    features: [
      {
        name: "ATI Report (Aircraft Transparency Index)",
        desc: "Automatizované hodnocení letadla v 8 dimenzích na základě veřejně dostupných dat (registr FAA, databáze nehod NTSB, historie údržby, tržní data).",
        color: "#f5c242",
      },
      {
        name: "OMVM (odhad tržní hodnoty)",
        desc: "Statistický/AI model odhadující tržní hodnotu letadla na základě srovnatelných transakcí a historických dat.",
        color: "#5dcaa5",
      },
      {
        name: "4ir.stream podcast",
        desc: "Epizody využívající AI generování hlasu (text-to-speech).",
        color: "rgba(255,255,255,0.35)",
      },
    ],
    disclosureTitle: "Povinné sdělení dle čl. 50 AI Act",
    disclosureItems: [
      "Výše uvedený obsah je generován nebo zásadně podporován AI nástroji",
      "AI výstupy jsou orientační a nenahrazují odborné posouzení (letecký mechanik, znalec, právník)",
      "Finální rozhodnutí o nákupu/prodeji letadla by mělo vždy zahrnovat nezávislou pre-buy inspekci",
    ],
    notHighRiskTitle: "Systémy bez klasifikace vysokého rizika",
    notHighRisk: "Tato informace se netýká vysoce rizikových AI systémů ve smyslu AI Act (např. biometrika, úvěrové hodnocení) — ABOS žádný takový systém neprovozuje.",
    deadline: "Termín pro splnění povinnosti transparentnosti AI: 2. prosinec 2026 (dle Digital Omnibus).",
  },
  en: {
    eyebrow: "EU AI Act · Article 50",
    title: "AI Transparency",
    subtitle: "Disclosure of Artificial Intelligence Use · ABOS Marketspace",
    chips: ["AI Act 2024/1689", "Art. 50 — transparency", "Effective 2 Aug 2026"],
    introTitle: "Use of Artificial Intelligence on the ABOS Platform",
    intro: "Aircraft Buy Or Sell uses artificial intelligence tools to support the following features:",
    features: [
      {
        name: "ATI Report (Aircraft Transparency Index)",
        desc: "Automated aircraft assessment across 8 dimensions based on publicly available data (FAA registry, NTSB accident database, maintenance history, market data).",
        color: "#f5c242",
      },
      {
        name: "OMVM (market value estimate)",
        desc: "A statistical/AI model estimating aircraft market value based on comparable transactions and historical data.",
        color: "#5dcaa5",
      },
      {
        name: "4ir.stream podcast",
        desc: "Episodes using AI voice generation (text-to-speech).",
        color: "rgba(255,255,255,0.35)",
      },
    ],
    disclosureTitle: "Mandatory Disclosure per AI Act Art. 50",
    disclosureItems: [
      "The content above is generated or substantially supported by AI tools",
      "AI outputs are indicative only and do not replace professional assessment (aircraft mechanic, certified appraiser, legal counsel)",
      "Any final purchase/sale decision should always include an independent pre-buy inspection",
    ],
    notHighRiskTitle: "Non-High-Risk AI Classification",
    notHighRisk: "This notice does not concern high-risk AI systems under the AI Act (e.g. biometrics, credit scoring) — ABOS does not operate any such system.",
    deadline: "Compliance deadline for AI transparency obligations: 2 December 2026 (per Digital Omnibus).",
  },
};

export default function AITransparency() {
  const navigate = useNavigate();
  const [lang, setLang] = useState("en");
  const t = CONTENT[lang];

  return (
    <div style={{
      background: C.ink,
      backgroundImage: "radial-gradient(ellipse at 8% 12%, rgba(245,194,66,0.14) 0%, transparent 52%), radial-gradient(ellipse at 92% 88%, rgba(93,202,165,0.12) 0%, transparent 52%), radial-gradient(ellipse at 85% 8%, rgba(78,142,247,0.07) 0%, transparent 40%), radial-gradient(circle, rgba(255,255,255,0.18) 1px, transparent 1px)",
      backgroundSize: "100% 100%, 100% 100%, 100% 100%, 24px 24px",
      minHeight: "100vh",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
      color: C.w1,
    }}>
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%) rotate(-8deg)", opacity: 0.055, pointerEvents: "none", zIndex: 0 }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 172 106" width="480" height="296">
          <defs>
            <marker id="wm-arr" markerWidth="9" markerHeight="9" refX="8.5" refY="4.5" orient="auto" markerUnits="userSpaceOnUse">
              <polygon points="0,0 9,4.5 0,9" fill="white" />
            </marker>
          </defs>
          <polyline points="2,98 52,8 70,98" stroke="white" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <polyline points="70,98 86,48 102,70 122,14 140,80 156,57" stroke="white" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none" markerEnd="url(#wm-arr)" />
        </svg>
      </div>

      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "48px 24px 96px", position: "relative", zIndex: 1 }}>

        {/* Back + lang toggle */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <button onClick={() => navigate(-1)} style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "transparent", border: "none", color: C.w3, fontSize: "13px", cursor: "pointer", padding: 0 }}>
            <ArrowLeft size={14} /> Back
          </button>
          <div style={{ display: "flex", gap: "4px", background: C.ink1, border: `0.5px solid ${C.border}`, borderRadius: "8px", padding: "3px" }}>
            {["en", "cz"].map(l => (
              <button key={l} onClick={() => setLang(l)} style={{
                padding: "5px 14px", borderRadius: "6px", border: "none", cursor: "pointer",
                background: lang === l ? C.amberDim : "transparent",
                border: lang === l ? `0.5px solid ${C.amberBorder}` : "0.5px solid transparent",
                color: lang === l ? C.amber : C.w3,
                fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
              }}>{l.toUpperCase()}</button>
            ))}
          </div>
        </div>

        {/* Header */}
        <div style={{ marginBottom: "36px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <Brain size={18} color={C.amber} />
            <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: C.amber }}>{t.eyebrow}</span>
          </div>
          <h1 style={{ fontSize: "clamp(26px,4vw,36px)", fontWeight: 500, letterSpacing: "-0.04em", lineHeight: 1.06, margin: "0 0 10px" }}>
            {t.title}
          </h1>
          <p style={{ fontSize: "13px", color: C.w2, margin: 0 }}>{t.subtitle}</p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "14px" }}>
            {t.chips.map(tag => (
              <span key={tag} style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", background: C.amberDim, border: `0.5px solid ${C.amberBorder}`, color: C.amber, padding: "2px 10px", borderRadius: "9999px" }}>{tag}</span>
            ))}
          </div>
        </div>

        {/* Intro + Features */}
        <div style={{ background: C.ink1, border: `0.5px solid ${C.border}`, borderRadius: "12px", overflow: "hidden", marginBottom: "12px" }}>
          <div style={{ height: "2px", background: C.amber }} />
          <div style={{ padding: "20px 22px" }}>
            <h2 style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 10px", color: C.w1 }}>{t.introTitle}</h2>
            <p style={{ fontSize: "13px", color: C.w2, lineHeight: 1.65, margin: "0 0 16px" }}>{t.intro}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {t.features.map((f) => (
                <div key={f.name} style={{ display: "flex", gap: "12px", padding: "12px 14px", background: "rgba(255,255,255,0.03)", border: `0.5px solid ${C.border}`, borderRadius: "8px", borderLeft: `3px solid ${f.color}` }}>
                  <div>
                    <p style={{ fontSize: "12px", fontWeight: 700, color: C.w1, margin: "0 0 4px" }}>{f.name}</p>
                    <p style={{ fontSize: "12px", color: C.w2, lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mandatory Disclosure */}
        <div style={{ background: "rgba(245,194,66,0.03)", border: `0.5px solid ${C.amberBorder}`, borderRadius: "12px", overflow: "hidden", marginBottom: "12px" }}>
          <div style={{ height: "2px", background: C.amber }} />
          <div style={{ padding: "20px 22px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <AlertTriangle size={14} color={C.amber} />
              <h2 style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "-0.02em", margin: 0, color: C.amber }}>{t.disclosureTitle}</h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {t.disclosureItems.map((item, i) => (
                <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: C.amberDim, border: `0.5px solid ${C.amberBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>
                    <span style={{ fontSize: "9px", fontWeight: 800, color: C.amber }}>{i + 1}</span>
                  </div>
                  <p style={{ fontSize: "13px", color: C.w2, lineHeight: 1.65, margin: 0 }}>{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Not high-risk */}
        <div style={{ background: C.tealDim, border: `0.5px solid ${C.tealBorder}`, borderRadius: "12px", padding: "16px 20px", display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "12px" }}>
          <CheckCircle size={16} color={C.teal} style={{ flexShrink: 0, marginTop: "1px" }} />
          <div>
            <p style={{ fontSize: "11px", fontWeight: 700, color: C.teal, margin: "0 0 4px", letterSpacing: "0.04em", textTransform: "uppercase" }}>{t.notHighRiskTitle}</p>
            <p style={{ fontSize: "12px", color: C.w2, lineHeight: 1.65, margin: 0 }}>{t.notHighRisk}</p>
          </div>
        </div>

        {/* Deadline note */}
        <p style={{ fontSize: "11px", color: C.w3, margin: "20px 0 0", lineHeight: 1.6, letterSpacing: "0.01em" }}>
          ℹ️ {t.deadline}
        </p>

        <p style={{ fontSize: "10px", color: C.w3, marginTop: "12px", letterSpacing: "0.02em" }}>
          ABOS s.r.o. · Regulation (EU) 2024/1689 (AI Act) · Article 50 — Transparency obligations
        </p>
      </div>
    </div>
  );
}