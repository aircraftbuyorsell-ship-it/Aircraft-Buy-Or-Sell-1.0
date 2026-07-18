const PILLARS = [
  { title: "Evidence & Provenance", text: "Sources, timestamps, evidence and history behind every output.", node: "#34d399" },
  { title: "Confidence & Limits", text: "Uncertainty, missing data and assumptions stated explicitly.", node: "#60a5fa" },
  { title: "Human Oversight", text: "Review and approval gates for higher-risk actions.", node: "#a78bfa" },
  { title: "Auditable Execution", text: "Actor, intent, inputs, decision and result — recorded.", node: "#60a5fa" },
  { title: "Controlled Access", text: "Defined identities, permissions and capability scopes.", node: "#34d399" },
];

export default function TrustByDesignSection() {
  return (
    <section
      className="relative"
      style={{ background: "#0b111a", "--grid-dot-color": "rgba(120,135,158,0.16)", "--grid-opacity": 1 }}
    >
      <div className="homepage-grid-layer" aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl px-5 py-20 sm:px-8 sm:py-28">
        <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-[0.24em] text-[#F5C842]/70">Trust by Design</p>
        <h2 className="mb-12 text-center text-2xl font-semibold tracking-tight text-white sm:text-4xl">Intelligence that shows its work</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((pillar) => (
            <div key={pillar.title} className="rounded-xl border border-white/8 bg-white/[0.03] p-5">
              <span className="mb-3 block h-2 w-2 rounded-full" style={{ background: pillar.node, boxShadow: `0 0 10px ${pillar.node}66` }} />
              <h3 className="mb-1.5 text-sm font-semibold text-white">{pillar.title}</h3>
              <p className="text-[11px] leading-relaxed text-white/55">{pillar.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}