import { Plane, ShieldCheck, Radio, Layers } from "lucide-react";

const SOURCES = [
  {
    icon: Plane,
    name: "FAA Registry System",
    description:
      "Real-time synchronization of North American aircraft identity, airworthiness status, and engine specifications.",
  },
  {
    icon: ShieldCheck,
    name: "EASA Compliance Database",
    description:
      "Automated integration for European Aviation Safety Agency technical directives and regulatory standards.",
  },
  {
    icon: Radio,
    name: "OpenSky Network",
    description:
      "Live global ADS-B flight telemetry and aircraft movement intelligence for real-time traffic awareness.",
  },
  {
    icon: Layers,
    name: "ATI Federated Compliance",
    description:
      "ABOS proprietary standard for verifying aircraft provenance, engine TBO integrity, and Digital Twin consistency.",
  },
];

export default function DataInfrastructureSection() {
  return (
    <section className="border-y border-black/[0.06] bg-white">
      <div className="mx-auto max-w-[1360px] px-5 py-16 sm:px-8 sm:py-20">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4A017]">
            Aviation Intelligence Infrastructure
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-[#1a1a1a] sm:text-3xl">
            Aggregated from authoritative data sources
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#666]">
            ABOS Marketspace aggregates live registry, technical, and regulatory data
            through robust enterprise-grade integrations — so every valuation,
            compliance check, and Digital Twin is grounded in verified truth.
          </p>
        </div>

        {/* Grid */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SOURCES.map(({ icon: Icon, name, description }) => (
            <div
              key={name}
              className="flex flex-col rounded-xl border border-black/[0.07] bg-[#fbfaf7] p-5 transition-shadow hover:shadow-sm"
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[#D4A017]/8">
                <Icon size={16} className="text-[#D4A017]" />
              </div>
              <h3 className="text-sm font-bold text-[#1a1a1a]">{name}</h3>
              <p className="mt-1.5 text-[12px] leading-relaxed text-[#666]">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}