import ProtocolCard from "@/components/protocol/ProtocolCard";

export default function ProtocolGrid({ protocols, onRelatedRfc }) {
  return (
    <div role="tabpanel" aria-label="Protocol Specs">
      <div className="mb-5"><h2 className="text-xl font-black text-white">Normative Protocols</h2><p className="mt-1 text-sm text-white/50">The 9 interoperable standards that form the APS architecture.</p></div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{protocols.map((protocol) => <ProtocolCard key={protocol.key} protocol={protocol} onRelatedRfc={onRelatedRfc} />)}</div>
    </div>
  );
}