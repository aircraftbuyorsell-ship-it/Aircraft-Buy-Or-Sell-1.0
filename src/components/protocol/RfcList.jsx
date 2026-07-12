import RfcRow from "@/components/protocol/RfcRow";

export default function RfcList({ rfcs, expandedId, isAdmin, savingId, onToggle, onStatus, onOpenSpec }) {
  if (!rfcs.length) return <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-10 text-center"><p className="font-bold text-white">No RFCs published yet</p><p className="mt-2 text-sm text-white/50">The first governance record will appear here.</p></div>;
  return (
    <div role="tabpanel" aria-label="RFC Series"><div className="mb-5"><h2 className="text-xl font-black text-white">RFC Lifecycle</h2><p className="mt-1 text-sm text-white/50">Public decision records from proposal through platform integration.</p></div><div className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.04]">{rfcs.map((rfc) => <RfcRow key={rfc.id} rfc={rfc} expanded={expandedId === rfc.id} isAdmin={isAdmin} saving={savingId === rfc.id} onToggle={() => onToggle(rfc.id)} onStatus={(status) => onStatus(rfc, status)} onOpenSpec={onOpenSpec} />)}</div></div>
  );
}