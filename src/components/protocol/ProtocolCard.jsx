import StatusBadge from "@/components/protocol/StatusBadge";

export default function ProtocolCard({ protocol, onRelatedRfc }) {
  const Icon = protocol.icon;
  return (
    <article id={`protocol-${protocol.key}`} className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-5 transition-colors duration-200 hover:border-[#f5c242]/30">
      <div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#f5c242]/20 bg-[#f5c242]/[0.08]"><Icon className="h-4 w-4 text-[#f5c242]" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-bold text-white">{protocol.name} <span className="font-mono text-xs text-white/40">v{protocol.version}</span></h3><p className="text-xs text-white/40">{protocol.fullName}</p></div><StatusBadge status={protocol.status} protocol /></div></div></div>
      <p className="mt-4 text-sm leading-6 text-white/60">{protocol.description}</p>
      <button onClick={() => onRelatedRfc(protocol.rfc)} className="mt-4 min-h-11 text-xs font-bold text-[#f5c242] hover:text-[#ffd76a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5c242]">Related {protocol.rfc} →</button>
    </article>
  );
}