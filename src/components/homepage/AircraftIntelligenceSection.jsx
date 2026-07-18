const PILLARS = [
  ["Aircraft Identity", "Registration, serial and airframe identity resolution."],
  ["Verification Findings", "Cross-checked findings from available data sources."],
  ["Ownership Context", "Registered owner and operator relationships."],
  ["ATI Assessment", "Structured aircraft trust and intelligence scoring."],
  ["Market Valuation", "Model-based value with expert calibration."],
  ["Document Analysis", "Records, logs and certificate review support."],
  ["Comparable Aircraft", "Market comps and positioning context."],
  ["Data Completeness", "What is known, missing and assumed."],
  ["Decision Support", "Structured outputs for professional judgment."],
];

export default function AircraftIntelligenceSection() {
  return (
    <section className="relative bg-[#0b111a]">
      <div className="pointer-events-none absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(rgba(140,160,190,0.14) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
      <div className="relative mx-auto max-w-[1360px] px-5 py-24 sm:px-8">
        <h2 className="text-center text-[11px] font-bold uppercase tracking-[0.24em] text-[#8ab4f8]">Aircraft Intelligence</h2>
        <p className="mt-3 text-center text-2xl font-semibold tracking-[-0.02em] text-white sm:text-4xl">See More Than the Asking Price</p>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map(([title, desc]) => (
            <div key={title} className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6">
              <div className="text-[13px] font-bold text-white">{title}</div>
              <div className="mt-2 text-[12px] leading-5 text-white/45">{desc}</div>
            </div>
          ))}
        </div>

        <p className="mt-12 text-center text-[12px] text-white/40">
          Every material output communicates:{" "}
          <span className="font-semibold text-[#F5C842]">source · timestamp · verification status · confidence · known limitations</span>
        </p>
      </div>
    </section>
  );
}