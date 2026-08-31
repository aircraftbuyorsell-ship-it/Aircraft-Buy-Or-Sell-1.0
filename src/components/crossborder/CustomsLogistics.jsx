import { useState } from "react";
import { Truck, Plane, Ship, FileText, DollarSign, Globe, Clock, AlertTriangle } from "lucide-react";

/* ═══════════════════════════════════════
   CUSTOMS & INTERNATIONAL FREIGHT
   Covers: HS classification, duties/VAT,
   transport modes (ferry/cargo/sea),
   overflight permits, overseas logistics.
═══════════════════════════════════════ */

const TRANSPORT_MODES = [
  {
    id: "ferry",
    label: "Ferry Flight",
    icon: Plane,
    color: "#5dcaa5",
    description: "Aircraft flies under its own power with ferry permit",
    pros: ["Fastest option (1–3 days)", "No disassembly needed", "Aircraft immediately operational"],
    cons: ["Requires ferry permit from CAA", "Pilot costs & fuel", "Weather dependent", "Overflight clearances needed"],
    timeline: "3–10 days",
    estCost: "$5k–$50k",
  },
  {
    id: "cargo-air",
    label: "Air Cargo (Freighter)",
    icon: Plane,
    color: "#f5c242",
    description: "Aircraft disassembled and shipped via cargo freighter (AN-124, B747F)",
    pros: ["No overflight permits for aircraft", "Works for non-airworthy aircraft", "Faster than sea freight"],
    cons: ["Wing removal / reassembly", "Cradle & packaging costs", "Requires specialist freight forwarder", "Reassembly & recertification"],
    timeline: "2–4 weeks",
    estCost: "$50k–$250k",
  },
  {
    id: "sea-freight",
    label: "Sea Freight (Container/RoRo)",
    icon: Ship,
    color: "#4e8ef7",
    description: "Containerized or roll-on/roll-off sea transport",
    pros: ["Most economical for long distance", "Handles oversized cargo", "No airworthiness needed"],
    cons: ["Slowest option (3–8 weeks)", "Disassembly & crating", "Port handling & customs", "Reassembly at destination"],
    timeline: "4–8 weeks",
    estCost: "$20k–$100k",
  },
];

const CUSTOMS_STEPS = [
  {
    id: "hs-classify",
    label: "HS Code Classification",
    icon: FileText,
    description: "Classify aircraft under harmonized system codes",
    details: [
      "8802.20 — Airplanes, other aircraft (≤ 15,000 kg)",
      "8802.30 — Airplanes, other aircraft (> 15,000 kg)",
      "8802.60 — Helicopters",
      "8802.40 — Spacecraft (incl. satellites)",
    ],
  },
  {
    id: "export-decl",
    label: "Export Declaration",
    icon: Globe,
    description: "File export paperwork at origin country",
    details: [
      "US: EEI via AES (ITN number)",
      "EU: SAD (Single Administrative Document) / Export Accompanying Document",
      "UK: CHIEF/CDS export declaration",
      "Include: HS code, value, origin, destination, consignee",
    ],
  },
  {
    id: "duty-vat",
    label: "Duties & VAT",
    icon: DollarSign,
    description: "Calculate and pay import duties at destination",
    details: [
      "EU import duty: 0–8% (aircraft typically 0% under WTO)",
      "EU VAT: 19–25% (varies by member state, may be exempt for commercial use)",
      "UK import duty: 0% (aircraft), VAT: 20% (may be zero-rated for qualifying aircraft)",
      "US: 0% duty on aircraft, use tax varies by state",
    ],
  },
  {
    id: "clearance",
    label: "Customs Clearance",
    icon: Truck,
    description: "Physical clearance at border / airport of entry",
    details: [
      "Present: export declaration, CofR, CofA, Bill of Sale, insurance",
      "Inspection by customs officer at designated airport of entry",
      "Temporary admission via ATA Carnet (for demo / temporary use)",
      "Free Zone / bonded warehouse storage (if deferred import)",
    ],
  },
];

const OVERFLIGHT_REQUIRED = [
  { region: "Europe (EU)", permits: "Eurocontrol CFMU route filing", timeline: "24–48h" },
  { region: "North Atlantic (NAT)", permits: "NAT HLA track clearance", timeline: "12–24h" },
  { region: "Middle East", permits: "Individual state overflight (Saudi, UAE, Qatar, etc.)", timeline: "3–5 days" },
  { region: "Russia / CIS", permits: "Russian CAA overflight permit", timeline: "5–7 days" },
  { region: "Africa", permits: "Per-state overflight + landing permits", timeline: "3–7 days" },
  { region: "Asia-Pacific", permits: "Per-state: China, Japan, India, etc.", timeline: "5–10 days" },
];

function TransportCard({ mode, selected, onSelect }) {
  return (
    <button
      onClick={onSelect}
      className="text-left rounded-xl overflow-hidden transition-all w-full"
      style={{
        background: selected ? `${mode.color}0A` : "rgba(255,255,255,0.04)",
        border: selected ? `0.5px solid ${mode.color}40` : "0.5px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        minHeight: 44,
      }}
    >
      <div style={{ height: 2, background: selected ? mode.color : "rgba(255,255,255,0.08)" }} />
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${mode.color}15`, border: `0.5px solid ${mode.color}30` }}>
            <mode.icon size={18} style={{ color: mode.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <p style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.90)", letterSpacing: "-0.03em" }}>
              {mode.label}
            </p>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{mode.timeline} · {mode.estCost}</p>
          </div>
        </div>

        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.60)", lineHeight: 1.4, marginBottom: 10 }}>
          {mode.description}
        </p>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#5dcaa5", marginBottom: 4 }}>Pros</p>
            <ul className="space-y-1">
              {mode.pros.map((p, i) => (
                <li key={i} style={{ fontSize: 10, color: "rgba(255,255,255,0.60)", lineHeight: 1.3 }}>+ {p}</li>
              ))}
            </ul>
          </div>
          <div>
            <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#e24b4a", marginBottom: 4 }}>Cons</p>
            <ul className="space-y-1">
              {mode.cons.map((c, i) => (
                <li key={i} style={{ fontSize: 10, color: "rgba(255,255,255,0.60)", lineHeight: 1.3 }}>− {c}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </button>
  );
}

function CustomsStep({ step }) {
  return (
    <div className="rounded-xl p-4"
      style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: 12 }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "rgba(245,194,66,0.09)", border: "0.5px solid rgba(245,194,66,0.22)" }}>
          <step.icon size={16} style={{ color: "#f5c242" }} />
        </div>
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.90)", letterSpacing: "-0.03em" }}>
            {step.label}
          </p>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{step.description}</p>
        </div>
      </div>
      <ul className="space-y-1.5 mt-2">
        {step.details.map((d, i) => (
          <li key={i} className="flex items-start gap-2">
            <span style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(255,255,255,0.25)", marginTop: 6, flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.60)", lineHeight: 1.4 }}>{d}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function CustomsLogistics() {
  const [selectedMode, setSelectedMode] = useState("ferry");

  return (
    <div className="space-y-5">
      {/* Transport mode selector */}
      <div>
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(245,194,66,0.70)", marginBottom: 12 }}>
          International Freight — Transport Mode
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TRANSPORT_MODES.map((mode) => (
            <TransportCard
              key={mode.id}
              mode={mode}
              selected={selectedMode === mode.id}
              onSelect={() => setSelectedMode(mode.id)}
            />
          ))}
        </div>
      </div>

      {/* Customs workflow */}
      <div>
        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(245,194,66,0.70)", marginBottom: 12 }}>
          Customs Clearance Pipeline
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CUSTOMS_STEPS.map((step) => (
            <CustomsStep key={step.id} step={step} />
          ))}
        </div>
      </div>

      {/* Overflight permits */}
      <div className="rounded-xl p-5"
        style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: 12 }}>
        <div className="flex items-center gap-2 mb-4">
          <Globe size={16} style={{ color: "#4e8ef7" }} />
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(78,142,247,0.80)" }}>
            Overflight & Landing Permits (by Region)
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {OVERFLIGHT_REQUIRED.map((region, i) => (
            <div key={i} className="rounded-lg p-3"
              style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.06)" }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.90)", marginBottom: 4 }}>
                {region.region}
              </p>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.60)", lineHeight: 1.3, marginBottom: 6 }}>
                {region.permits}
              </p>
              <div className="flex items-center gap-1">
                <Clock size={10} style={{ color: "rgba(255,255,255,0.35)" }} />
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.35)" }}>{region.timeline}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Advisory banner */}
      <div className="rounded-xl p-4 flex items-start gap-3"
        style={{ background: "rgba(226,75,74,0.06)", border: "0.5px solid rgba(226,75,74,0.15)" }}>
        <AlertTriangle size={16} style={{ color: "#e24b4a", flexShrink: 0, marginTop: 1 }} />
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.90)", marginBottom: 2 }}>
            Always engage a licensed customs broker and aviation logistics specialist
          </p>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.60)", lineHeight: 1.4 }}>
            Requirements vary by aircraft type, registration state, and bilateral agreements.
            This module provides reference guidance — verify all procedures with the relevant
            national CAA and customs authority before execution.
          </p>
        </div>
      </div>
    </div>
  );
}