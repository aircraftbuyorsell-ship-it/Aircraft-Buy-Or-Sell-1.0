const PILLARS = ["ATI Intelligence Standard", "Verified Expert Network", "280k Aviation Community", "Responsible AI Governance"];

export default function WhyTrustABOS() {
  return (
    <section className="bg-[#fbfaf7]">
      <div className="mx-auto max-w-[1100px] px-5 py-20 text-center sm:px-8">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#D4A017]">Why Trust ABOS</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((p) => (
            <div key={p} className="rounded-2xl border border-black/[0.07] bg-white px-4 py-6 text-[13px] font-bold text-[#1a1a1a] shadow-sm">{p}</div>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-[11px] leading-5 text-[#999]">
          Source transparency · confidence indicators · controlled automation · human oversight · evidence provenance · auditable execution
        </p>
        <p className="mx-auto mt-4 max-w-2xl text-[11px] leading-5 text-[#aaa]">
          ABOS provides decision-support tools and does not replace certified aircraft inspections, official registry records, legal advice, financial advice or professional technical judgment.
        </p>
      </div>
    </section>
  );
}