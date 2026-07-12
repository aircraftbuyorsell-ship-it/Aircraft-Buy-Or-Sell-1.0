import { BookOpen, FileCheck2, ShieldCheck } from "lucide-react";

export default function ProtocolHero({ rfcCount, implementedCount, normativeCount }) {
  const stats = [
    [BookOpen, "Total RFCs", rfcCount], [FileCheck2, "Implemented", implementedCount], [ShieldCheck, "Normative", normativeCount],
  ];
  return (
    <section className="border-b border-white/[0.08] px-4 py-10 sm:px-8 sm:py-14">
      <div className="mx-auto max-w-6xl">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-[#f5c242]">Developers · Open Governance</p>
        <h1 className="text-balance text-3xl font-black tracking-[-0.04em] text-white sm:text-5xl">ABOS Protocol Suite</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-white/60">The open standards layer for interoperable aircraft intelligence, verification and transaction infrastructure.</p>
        <div className="mt-8 grid max-w-2xl grid-cols-3 gap-2 sm:gap-3">
          {stats.map(([Icon, label, value]) => <div key={label} className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-3 sm:p-4"><Icon className="mb-3 h-4 w-4 text-[#f5c242]" /><p className="text-2xl font-black tabular-nums text-white">{value}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-white/45">{label}</p></div>)}
        </div>
      </div>
    </section>
  );
}