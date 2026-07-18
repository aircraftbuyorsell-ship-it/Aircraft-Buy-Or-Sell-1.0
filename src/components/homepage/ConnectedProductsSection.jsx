import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const PRODUCTS = [
  { name: "ABOS MARKETSPACE", desc: "Discover, publish, compare and manage aircraft opportunities in a global market.", cta: "Explore", to: "/listings" },
  { name: "AIRCRAFT INTELLIGENCE", desc: "Identity, ATI assessments, valuation, evidence, verification and market context.", cta: "Explore", to: "/ati-center" },
  { name: "ABOS INTRAZONE", desc: "Professional workspace for documents, reports, workflows, matching and transaction work.", cta: "Enter", to: "/intrazone" },
];

export default function ConnectedProductsSection() {
  return (
    <section className="border-t border-black/[0.06] bg-white">
      <div className="mx-auto max-w-[1360px] px-5 py-20 sm:px-8">
        <h2 className="text-center text-[11px] font-bold uppercase tracking-[0.22em] text-[#D4A017]">One Platform</h2>
        <p className="mt-2 text-center text-2xl font-semibold tracking-[-0.02em] text-[#1a1a1a] sm:text-4xl">Three Aviation Environments.</p>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {PRODUCTS.map((p) => (
            <div key={p.name} className="flex flex-col rounded-2xl border border-black/[0.07] bg-[#fbfaf7] p-7 shadow-sm">
              <div className="text-[12px] font-black uppercase tracking-[0.14em] text-[#1a1a1a]">{p.name}</div>
              <p className="mt-3 flex-1 text-[13px] leading-6 text-[#666]">{p.desc}</p>
              <Link to={p.to} className="mt-6 inline-flex items-center gap-2 text-[13px] font-bold text-[#D4A017] hover:gap-3">
                {p.cta} <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}