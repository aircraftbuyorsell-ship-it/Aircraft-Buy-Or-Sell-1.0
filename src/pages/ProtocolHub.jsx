import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import ProtocolHero from "@/components/protocol/ProtocolHero";
import ProtocolTabs from "@/components/protocol/ProtocolTabs";
import ProtocolGrid from "@/components/protocol/ProtocolGrid";
import RfcList from "@/components/protocol/RfcList";
import { APS_PROTOCOLS } from "@/components/protocol/protocolData";

export default function ProtocolHub() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("rfc");
  const [expandedId, setExpandedId] = useState(null);
  const { data: rfcs = [], isLoading } = useQuery({ queryKey: ["protocol-rfcs"], queryFn: () => base44.entities.ProtocolRFC.list("rfc_id", 100) });
  const { data: user } = useQuery({ queryKey: ["auth-me"], queryFn: () => base44.auth.me(), retry: false });
  const updateStatus = useMutation({ mutationFn: ({ id, status }) => base44.entities.ProtocolRFC.update(id, { status }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ["protocol-rfcs"] }) });
  const statusError = updateStatus.isError ? "Status could not be saved. Check your admin access and try again." : null;
  const openSpec = (category) => { setTab("specs"); requestAnimationFrame(() => document.getElementById(`protocol-${category}`)?.scrollIntoView({ behavior: "smooth", block: "center" })); };
  const openRfc = (rfcId) => { setTab("rfc"); const match = rfcs.find((rfc) => rfc.rfc_id === rfcId); if (match) setExpandedId(match.id); };
  const implementedCount = rfcs.filter((rfc) => ["implemented", "integrated"].includes(rfc.status)).length;
  const normativeCount = APS_PROTOCOLS.filter((protocol) => protocol.status === "Normative").length;
  return (
    <div className="min-h-screen bg-[#04060a] text-white"><ProtocolHero rfcCount={rfcs.length} implementedCount={implementedCount} normativeCount={normativeCount} /><div className="mx-auto max-w-6xl px-4 py-8 sm:px-8"><ProtocolTabs active={tab} onChange={setTab} /><div className="mt-8">{statusError && <div role="alert" className="mb-4 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">{statusError}</div>}{isLoading ? <div className="h-52 animate-pulse rounded-xl border border-white/[0.08] bg-white/[0.04]" aria-label="Loading protocol records" /> : tab === "rfc" ? <RfcList rfcs={rfcs} expandedId={expandedId} isAdmin={user?.role === "admin"} savingId={updateStatus.isPending ? updateStatus.variables?.id : null} onToggle={(id) => setExpandedId(expandedId === id ? null : id)} onStatus={(rfc, status) => updateStatus.mutate({ id: rfc.id, status })} onOpenSpec={openSpec} /> : <ProtocolGrid protocols={APS_PROTOCOLS} onRelatedRfc={openRfc} />}</div></div></div>
  );
}