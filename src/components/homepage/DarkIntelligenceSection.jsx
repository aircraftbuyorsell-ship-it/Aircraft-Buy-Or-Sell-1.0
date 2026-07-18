const CAPABILITIES = [
  "Aircraft Identity", "Verification Findings", "Ownership Context",
  "ATI Assessment", "Market Valuation", "Document Analysis",
  "Comparable Aircraft", "Data Completeness", "Decision Support",
];

export default function DarkIntelligenceSection() {
  return (
    <section
      className="relative"
      style={{ background: "#0b111a", "--grid-dot-color": "rgba(120,135,158,0.22)", "--grid-opacity": 1 }}
    >
      <div className="homepage-grid-layer" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl px-5 py-20 sm:px-8 sm:py-28">
        <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-[0.24em] text-[#F5C842]/70">Aircraft Intelligence</p>
        <h2 className="mb-12 text-center text-2xl font-semibold tracking-tight text-white sm:text-4xl">See more than the asking price</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {CAPABILITIES.map((label) => (
            <div key={label} className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-4 text-center text-[11px] font-medium text-white/75 sm:text-xs">
              {label}
            </div>
          ))}
        </div>
        <p className="mt-10 text-center text-[11px] leading-relaxed text-white/45">
          Every material result communicates:<br className="sm:hidden" />
          <span className="text-white/65"> source · timestamp · verification status · confidence · limitations</span>
        </p>
      </div>
    </section>
  );
}