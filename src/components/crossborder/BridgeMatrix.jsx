import { useState } from "react";
import { CheckCircle2, AlertTriangle, FileText, Clock, ArrowRight, ExternalLink } from "lucide-react";

/* ═══════════════════════════════════════
   BILATERAL BRIDGE DATA
   Each bridge defines the regulatory pathway
   between two authorities.
═══════════════════════════════════════ */
const BRIDGES = [
  {
    id: "faa-ukcaa",
    from: { code: "FAA", label: "Federal Aviation Administration", country: "United States", flag: "🇺🇸" },
    to: { code: "UK CAA", label: "Civil Aviation Authority", country: "United Kingdom", flag: "🇬🇧" },
    agreement: "Bilateral Agreement US–UK (post-Brexit, 2021)",
    status: "active",
    bilateralType: "BASAs",
    steps: [
      { phase: "Deregistration (FAA)", action: "Submit AC 8050-64 to cancel US registration", authority: "FAA AFS-750", timeline: "5–10 days", docs: ["AC 8050-64", "Bill of Sale", "Return of original CofR"] },
      { phase: "Export CofA", action: "FAA Form 8130-4 Export Certificate of Airworthiness", authority: "FAA FSDO / MIDO", timeline: "3–7 days", docs: ["Form 8130-4", "Maintenance records", "Weight & balance"] },
      { phase: "UK Import Validation", action: "UK CAA validates airworthiness under CAA A8-21", authority: "UK CAA Aircraft Registration", timeline: "10–20 days", docs: ["Form CA1", "Form 8130-4", "Insurance", "Noise certificate"] },
      { phase: "UK Registration", action: "Apply for G- registration mark and CofA", authority: "UK CAA Registration Section", timeline: "15–30 days", docs: ["Form CA1", "Ownership proof", "Fee payment"] },
    ],
    notes: "Post-Brexit bilateral. UK CAA no longer accepts EASA Form 52 — requires direct validation.",
    sourceLinks: [
      { label: "FAA AC 8050-64 (Deregistration)", url: "https://www.faa.gov/documentLibrary/media/Advisory_Circular/AC_8050-64.pdf" },
      { label: "FAA Form 8130-4 (Export CofA)", url: "https://www.faa.gov/documentLibrary/media/Form/FAA_Form_8130-4.pdf" },
      { label: "UK CAA Registration Forms", url: "https://www.caa.co.uk/aircraft/aircraft-registration/apply-for-registration/" },
      { label: "UK CAA A8-21 (Org Approvals)", url: "https://www.caa.co.uk/aircraft/airworthiness/engineering-and-organisational-approvals/cap-562-civil-aircraft-airworthiness-information-and-procedures/" },
    ],
  },
  {
    id: "faa-easa",
    from: { code: "FAA", label: "Federal Aviation Administration", country: "United States", flag: "🇺🇸" },
    to: { code: "EASA", label: "European Union Aviation Safety Agency", country: "EU Member States", flag: "🇪🇺" },
    agreement: "EU–US Bilateral Aviation Safety Agreement (BASA) + Implementation Procedures (IP)",
    status: "active",
    bilateralType: "BASA + IP",
    steps: [
      { phase: "Deregistration (FAA)", action: "Cancel N-registration via AC 8050-64", authority: "FAA AFS-750", timeline: "5–10 days", docs: ["AC 8050-64", "Bill of Sale", "CofR surrender"] },
      { phase: "Export CofA", action: "FAA Form 8130-4 with dual-language if required", authority: "FAA FSDO / MIDO", timeline: "3–7 days", docs: ["Form 8130-4", "Maintenance records", "AD compliance"] },
      { phase: "EASA Import", action: "National CAA validates under EASA Part-21 Subpart H", authority: "National CAA (e.g. LBA, DGAC, CAA CZ)", timeline: "20–45 days", docs: ["EASA Form 20", "Form 8130-4", "Noise certificate", "ELA1/ELA2 docs"] },
      { phase: "EASA Registration", action: "Register under national mark (OK-, D-, F-, etc.)", authority: "National Aircraft Registry", timeline: "15–30 days", docs: ["Registration application", "Ownership proof", "Insurance"] },
    ],
    notes: "BASA covers type-certified aircraft. Non-TC aircraft require individual validation (EASA Form 20).",
    sourceLinks: [
      { label: "FAA AC 8050-64 (Deregistration)", url: "https://www.faa.gov/documentLibrary/media/Advisory_Circular/AC_8050-64.pdf" },
      { label: "FAA Form 8130-4 (Export CofA)", url: "https://www.faa.gov/documentLibrary/media/Form/FAA_Form_8130-4.pdf" },
      { label: "EASA Form 20 (Import Application)", url: "https://www.easa.europa.eu/en/document-library/forms" },
      { label: "EU–US BASA & Implementation Procedures", url: "https://www.easa.europa.eu/en/document-library/implementing-rules/bilateral-agreements" },
      { label: "EASA Part-21 Subpart H", url: "https://www.easa.europa.eu/en/document-library/regulations/regulation-eu-no-7482012" },
    ],
  },
  {
    id: "ukcaa-easa",
    from: { code: "UK CAA", label: "Civil Aviation Authority", country: "United Kingdom", flag: "🇬🇧" },
    to: { code: "EASA", label: "European Union Aviation Safety Agency", country: "EU Member States", flag: "🇪🇺" },
    agreement: "EU–UK Trade and Cooperation Agreement (TCA) — Aviation Safety Annex",
    status: "active",
    bilateralType: "TCA Annex",
    steps: [
      { phase: "Deregistration (UK CAA)", action: "Cancel G- registration, return CofR", authority: "UK CAA Registration", timeline: "5–10 days", docs: ["Form CA1 (deregistration)", "Bill of Sale", "CofR return"] },
      { phase: "Export CofA", action: "UK CAA EASA Form 27 (Export CofA)", authority: "UK CAA Surveyor", timeline: "5–10 days", docs: ["EASA Form 27", "Maintenance review", "AD/SB compliance"] },
      { phase: "EASA Import Validation", action: "National CAA validates under EASA Part-21", authority: "National CAA", timeline: "15–30 days", docs: ["EASA Form 20", "Form 27", "Noise cert", "Insurance"] },
      { phase: "EASA Registration", action: "Register under national mark", authority: "National Aircraft Registry", timeline: "15–30 days", docs: ["Registration application", "Ownership proof", "Insurance"] },
    ],
    notes: "Post-Brexit TCA. UK-issued EASA Form 27 still accepted by EU CAAs for transition-period aircraft.",
    sourceLinks: [
      { label: "UK CAA Form CA1 (Registration)", url: "https://www.caa.co.uk/aircraft/aircraft-registration/apply-for-registration/" },
      { label: "EASA Form 27 (Export CofA)", url: "https://www.easa.europa.eu/en/document-library/forms" },
      { label: "EASA Form 20 (Import Application)", url: "https://www.easa.europa.eu/en/document-library/forms" },
      { label: "EU–UK TCA Aviation Safety Annex", url: "https://www.easa.europa.eu/en/document-library/implementing-rules/bilateral-agreements" },
      { label: "EASA Part-21 Subpart H", url: "https://www.easa.europa.eu/en/document-library/regulations/regulation-eu-no-7482012" },
    ],
  },
];

const STATUS_COLORS = {
  active: { color: "#5dcaa5", dim: "rgba(93,202,165,0.09)", border: "rgba(93,202,165,0.20)" },
  pending: { color: "#f5c242", dim: "rgba(245,194,66,0.09)", border: "rgba(245,194,66,0.22)" },
  review:  { color: "#4e8ef7", dim: "rgba(78,142,247,0.09)", border: "rgba(78,142,247,0.20)" },
};

function BridgeCard({ bridge }) {
  const [expanded, setExpanded] = useState(false);
  const sc = STATUS_COLORS[bridge.status] || STATUS_COLORS.active;

  return (
    <div className="rounded-xl overflow-hidden transition-all"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "0.5px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
      }}>
      {/* Accent line */}
      <div style={{ height: 2, background: sc.color }} />

      <div className="p-5">
        {/* Authority headers */}
        <div className="flex items-center gap-3 mb-4">
          {/* From */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span style={{ fontSize: 18 }}>{bridge.from.flag}</span>
              <span style={{ fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.90)", letterSpacing: "-0.03em" }}>
                {bridge.from.code}
              </span>
            </div>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", lineHeight: 1.3 }}>
              {bridge.from.country}
            </p>
          </div>

          {/* Arrow */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            <ArrowRight size={16} style={{ color: sc.color }} />
            <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>
              Transfer
            </span>
          </div>

          {/* To */}
          <div className="flex-1 min-w-0 text-right">
            <div className="flex items-center gap-2 mb-1 justify-end">
              <span style={{ fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.90)", letterSpacing: "-0.03em" }}>
                {bridge.to.code}
              </span>
              <span style={{ fontSize: 18 }}>{bridge.to.flag}</span>
            </div>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", lineHeight: 1.3 }}>
              {bridge.to.country}
            </p>
          </div>
        </div>

        {/* Agreement badge */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="inline-flex items-center gap-1 rounded-full"
            style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "2px 10px", background: sc.dim, color: sc.color, border: `0.5px solid ${sc.border}` }}>
            <CheckCircle2 size={10} /> {bridge.bilateralType}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full"
            style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "2px 10px", background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
            {bridge.steps.length} phases
          </span>
        </div>

        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.60)", lineHeight: 1.5, marginBottom: 12 }}>
          {bridge.agreement}
        </p>

        {/* Expand button */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-2 rounded-lg transition-all"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "0.5px solid rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.60)",
            fontSize: 11,
            fontWeight: 600,
            padding: "8px 12px",
            minHeight: 36,
          }}
        >
          {expanded ? "Hide" : "View"} Transfer Pathway ({bridge.steps.length} phases)
        </button>

        {/* Expanded steps */}
        {expanded && (
          <div className="mt-4 space-y-3">
            {bridge.steps.map((step, i) => (
              <div key={i} className="rounded-lg p-3"
                style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "rgba(245,194,66,0.09)", border: "0.5px solid rgba(245,194,66,0.22)" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#f5c242" }}>{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.90)", marginBottom: 2 }}>
                      {step.phase}
                    </p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.60)", lineHeight: 1.4, marginBottom: 6 }}>
                      {step.action}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1" style={{ fontSize: 9, color: "rgba(255,255,255,0.35)" }}>
                        <FileText size={10} /> {step.authority}
                      </span>
                      <span className="inline-flex items-center gap-1" style={{ fontSize: 9, color: "rgba(255,255,255,0.35)" }}>
                        <Clock size={10} /> {step.timeline}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {step.docs.map((doc, di) => (
                        <span key={di} className="rounded-md"
                          style={{ fontSize: 8, fontWeight: 600, padding: "2px 6px", background: "rgba(78,142,247,0.09)", color: "#4e8ef7", border: "0.5px solid rgba(78,142,247,0.20)" }}>
                          {doc}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {bridge.notes && (
              <div className="flex items-start gap-2 rounded-lg p-3"
                style={{ background: "rgba(245,194,66,0.06)", border: "0.5px solid rgba(245,194,66,0.15)" }}>
                <AlertTriangle size={14} style={{ color: "#f5c242", flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.60)", lineHeight: 1.4 }}>
                  {bridge.notes}
                </p>
              </div>
            )}
            {bridge.sourceLinks?.length > 0 && (
              <div className="rounded-lg p-3"
                style={{ background: "rgba(78,142,247,0.05)", border: "0.5px solid rgba(78,142,247,0.15)" }}>
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#4e8ef7", marginBottom: 8 }}>
                  Official Document Sources
                </p>
                <div className="flex flex-col gap-2">
                  {bridge.sourceLinks.map((link, li) => (
                    <a key={li} href={link.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 transition-all"
                      style={{ fontSize: 10, color: "rgba(255,255,255,0.70)", textDecoration: "none" }}>
                      <ExternalLink size={11} style={{ color: "#4e8ef7", flexShrink: 0 }} />
                      <span style={{ textDecoration: "underline", textDecorationColor: "rgba(78,142,247,0.30)" }}>
                        {link.label}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BridgeMatrix() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {BRIDGES.map((bridge) => (
          <BridgeCard key={bridge.id} bridge={bridge} />
        ))}
      </div>

      {/* Summary stats */}
      <div className="rounded-xl p-5"
        style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: 12 }}>
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(245,194,66,0.70)", marginBottom: 12 }}>
          Transfer Intelligence
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p style={{ fontSize: 22, fontWeight: 700, color: "#f5c242", letterSpacing: "-0.03em" }}>3</p>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Active Bilaterals</p>
          </div>
          <div>
            <p style={{ fontSize: 22, fontWeight: 700, color: "#5dcaa5", letterSpacing: "-0.03em" }}>12</p>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Total Phases</p>
          </div>
          <div>
            <p style={{ fontSize: 22, fontWeight: 700, color: "#4e8ef7", letterSpacing: "-0.03em" }}>30–90</p>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Days (avg)</p>
          </div>
          <div>
            <p style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.90)", letterSpacing: "-0.03em" }}>40+</p>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Required Docs</p>
          </div>
        </div>
      </div>
    </div>
  );
}