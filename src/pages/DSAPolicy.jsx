/**
 * DSAPolicy.jsx — ABOS Marketspace
 * EU Digital Services Act — Notice & Action mechanism
 * DS v3 styling · CZ/EN language toggle
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Flag, Globe } from "lucide-react";

const C = {
  ink: "#04060a", ink1: "#0d1117", ink2: "#111620",
  amber: "#f5c242", amberDim: "rgba(245,194,66,0.09)", amberBorder: "rgba(245,194,66,0.22)",
  teal: "#5dcaa5", tealDim: "rgba(93,202,165,0.09)", tealBorder: "rgba(93,202,165,0.20)",
  blue: "#4e8ef7", blueDim: "rgba(78,142,247,0.09)", blueBorder: "rgba(78,142,247,0.20)",
  w1: "rgba(255,255,255,0.90)", w2: "rgba(255,255,255,0.60)",
  w3: "rgba(255,255,255,0.35)", border: "rgba(255,255,255,0.08)",
};

const CONTENT = {
  cz: {
    lang: "CZ",
    title: "Digital Services Act",
    subtitle: "Nařízení EU o digitálních službách · ABOS Marketspace",
    section1: "Nahlášení nezákonného obsahu",
    s1body: `V souladu s nařízením EU o digitálních službách (Digital Services Act, DSA) umožňuje Aircraft Buy Or Sell (ABOS) každému nahlásit inzerát, profil nebo jiný obsah na platformě, který je podle jeho názoru nezákonný.

Jak nahlásit obsah:
• Použijte tlačítko „Nahlásit" u konkrétního inzerátu/profilu, NEBO
• Zašlete e-mail na legal@aircraftbuyorsell.com s následujícími údaji:
  – Přesný odkaz (URL) na nahlašovaný obsah
  – Důvod, proč považujete obsah za nezákonný (s odkazem na konkrétní právní předpis, pokud je znám)
  – Vaše kontaktní údaje (jméno, e-mail)
  – Čestné prohlášení, že informace uvedené v oznámení jsou podle vašeho nejlepšího vědomí pravdivé a úplné`,
    s1process: "Co se stane po nahlášení:",
    s1steps: [
      "Oznámení zpracujeme bez zbytečného odkladu",
      "Pokud oznámení obsahuje všechny potřebné údaje, posoudíme obsah a rozhodneme o dalším postupu (odstranění, omezení viditelnosti, ponechání)",
      "O výsledku informujeme osobu, která obsah nahlásila, i poskytovatele obsahu (pokud je znám), včetně důvodu rozhodnutí",
      "Poskytovatel obsahu má možnost rozhodnutí napadnout prostřednictvím interního systému pro vyřizování stížností",
    ],
    section2: "Interní systém pro vyřizování stížností",
    s2body: `Pokud nesouhlasíte s rozhodnutím o vašem obsahu, můžete podat stížnost na legal@aircraftbuyorsell.com do 6 měsíců od oznámení rozhodnutí. Stížnost vyřídíme nestranně a bez zbytečného odkladu.`,
    section3: "Kontaktní místo pro orgány veřejné moci",
    s3body: `Pro účely DSA je kontaktním místem pro komunikaci s orgány členských států EU, Evropskou komisí a Evropským sborem pro digitální služby:

E-mail: legal@aircraftbuyorsell.com
Jazyk komunikace: čeština, angličtina`,
    contact: "legal@aircraftbuyorsell.com",
  },
  en: {
    lang: "EN",
    title: "Digital Services Act",
    subtitle: "EU DSA Compliance · ABOS Marketspace",
    section1: "Reporting Illegal Content",
    s1body: `In accordance with the EU Digital Services Act (DSA), Aircraft Buy Or Sell (ABOS) allows anyone to report a listing, profile, or other content on the platform that they believe to be illegal.

How to report content:
• Use the "Report" button on the specific listing/profile, OR
• Email legal@aircraftbuyorsell.com with the following information:
  – Exact link (URL) to the reported content
  – Reason why you consider the content illegal (citing the specific legal provision, if known)
  – Your contact details (name, email)
  – A statement confirming that, to the best of your knowledge, the information in the notice is accurate and complete`,
    s1process: "What happens after you report content:",
    s1steps: [
      "We process notices without undue delay",
      "If the notice contains all required information, we assess the content and decide on appropriate action (removal, visibility restriction, or no action)",
      "We inform both the person who submitted the notice and the content provider (if known) of the outcome, including the reasoning",
      "The content provider may challenge the decision through our internal complaint-handling system",
    ],
    section2: "Internal Complaint-Handling System",
    s2body: `If you disagree with a decision regarding your content, you may file a complaint at legal@aircraftbuyorsell.com within 6 months of being notified of the decision. We will handle complaints impartially and without undue delay.`,
    section3: "Point of Contact for Public Authorities",
    s3body: `For DSA purposes, the point of contact for communication with EU Member State authorities, the European Commission, and the European Board for Digital Services is:

Email: legal@aircraftbuyorsell.com
Languages: Czech, English`,
    contact: "legal@aircraftbuyorsell.com",
  },
};

function EmailLink({ email }) {
  return (
    <a href={`mailto:${email}`} style={{ color: C.amber, textDecoration: "none", fontWeight: 600 }}>
      {email}
    </a>
  );
}

function renderWithEmail(text, email) {
  return text.split(email).map((part, i, arr) =>
    i < arr.length - 1
      ? [part, <EmailLink key={i} email={email} />]
      : part
  );
}

export default function DSAPolicy() {
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
                background: lang === l ? C.blueDim : "transparent",
                border: lang === l ? `0.5px solid ${C.blueBorder}` : "0.5px solid transparent",
                color: lang === l ? C.blue : C.w3,
                fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
              }}>{l.toUpperCase()}</button>
            ))}
          </div>
        </div>

        {/* Header */}
        <div style={{ marginBottom: "36px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <Flag size={18} color={C.blue} />
            <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: C.blue }}>EU Regulation 2022/2065</span>
          </div>
          <h1 style={{ fontSize: "clamp(26px,4vw,36px)", fontWeight: 500, letterSpacing: "-0.04em", lineHeight: 1.06, margin: "0 0 10px" }}>
            {t.title}
          </h1>
          <p style={{ fontSize: "13px", color: C.w2, margin: 0 }}>{t.subtitle}</p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "14px" }}>
            {["DSA Art. 16", "Notice & Action", "Complaint system", "Public authority contact"].map(tag => (
              <span key={tag} style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", background: C.blueDim, border: `0.5px solid ${C.blueBorder}`, color: C.blue, padding: "2px 10px", borderRadius: "9999px" }}>{tag}</span>
            ))}
          </div>
        </div>

        {/* Section 1 */}
        <div style={{ background: C.ink1, border: `0.5px solid ${C.border}`, borderRadius: "12px", overflow: "hidden", marginBottom: "12px" }}>
          <div style={{ height: "2px", background: C.blue }} />
          <div style={{ padding: "20px 22px" }}>
            <h2 style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 14px", color: C.w1 }}>{t.section1}</h2>
            <p style={{ fontSize: "13px", color: C.w2, lineHeight: 1.75, whiteSpace: "pre-line", margin: "0 0 16px" }}>
              {renderWithEmail(t.s1body, t.contact)}
            </p>
            <p style={{ fontSize: "12px", fontWeight: 600, color: C.w1, margin: "0 0 10px" }}>{t.s1process}</p>
            <ol style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {t.s1steps.map((step, i) => (
                <li key={i} style={{ fontSize: "13px", color: C.w2, lineHeight: 1.65 }}>{step}</li>
              ))}
            </ol>
          </div>
        </div>

        {/* Section 2 */}
        <div style={{ background: C.ink1, border: `0.5px solid ${C.border}`, borderRadius: "12px", overflow: "hidden", marginBottom: "12px" }}>
          <div style={{ padding: "20px 22px" }}>
            <h2 style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 12px", color: C.w1 }}>{t.section2}</h2>
            <p style={{ fontSize: "13px", color: C.w2, lineHeight: 1.75, margin: 0 }}>
              {renderWithEmail(t.s2body, t.contact)}
            </p>
          </div>
        </div>

        {/* Section 3 */}
        <div style={{ background: C.ink1, border: `0.5px solid ${C.border}`, borderRadius: "12px", overflow: "hidden", marginBottom: "12px" }}>
          <div style={{ padding: "20px 22px" }}>
            <h2 style={{ fontSize: "14px", fontWeight: 700, letterSpacing: "-0.02em", margin: "0 0 12px", color: C.w1 }}>{t.section3}</h2>
            <p style={{ fontSize: "13px", color: C.w2, lineHeight: 1.75, whiteSpace: "pre-line", margin: 0 }}>
              {renderWithEmail(t.s3body, t.contact)}
            </p>
          </div>
        </div>

        {/* Contact card */}
        <div style={{ marginTop: "28px", padding: "18px 22px", background: C.blueDim, border: `0.5px solid ${C.blueBorder}`, borderRadius: "12px", display: "flex", alignItems: "center", gap: "14px" }}>
          <Globe size={18} color={C.blue} style={{ flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: C.blue, margin: "0 0 4px" }}>DSA Contact Point</p>
            <p style={{ fontSize: "13px", color: C.w2, margin: 0 }}>
              <EmailLink email="legal@aircraftbuyorsell.com" /> · Czech / English
            </p>
          </div>
        </div>

        <p style={{ fontSize: "10px", color: C.w3, marginTop: "24px", letterSpacing: "0.02em" }}>
          ABOS s.r.o. · Regulation (EU) 2022/2065 of the European Parliament · Effective: February 2024
        </p>
      </div>
    </div>
  );
}