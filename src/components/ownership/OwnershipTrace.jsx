import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plus, FileText, ShieldCheck, Clock, XCircle, ExternalLink, Fingerprint } from "lucide-react";
import AddOwnershipEventModal from "./AddOwnershipEventModal";
import VerifiedTitleStamp from "./VerifiedTitleStamp";
import { isAdminRole } from "@/utils/roles";

const EVENT_LABEL = {
  manufacture: "Manufacture",
  first_registration: "First Registration",
  ownership_transfer: "Ownership Transfer",
  title_deed: "Title Deed",
  logbook_entry: "Logbook Entry",
  lien_release: "Lien Release",
  export_import: "Export / Import",
  damage_repair: "Damage / Repair",
  other: "Other",
};

const STATUS = {
  verified: { color: "#0F7A56", bg: "rgba(15,122,86,0.08)", icon: ShieldCheck, label: "Verified" },
  pending:  { color: "#E8A83A", bg: "rgba(232,168,58,0.1)", icon: Clock, label: "Pending" },
  rejected: { color: "#C0392B", bg: "rgba(192,57,43,0.08)", icon: XCircle, label: "Rejected" },
};

function fmt(d) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); }
  catch { return d; }
}

export default function OwnershipTrace({ listingId }) {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["ownership-trace", listingId],
    queryFn: () => base44.entities.OwnershipTrace.filter({ listing: listingId }, "-event_date", 50),
    enabled: !!listingId,
  });

  const { data: currentUser } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => base44.auth.me(),
    retry: false,
  });
  const isAdmin = isAdminRole(currentUser);

  const verifyMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.OwnershipTrace.update(id, {
      verification_status: status,
      verified_by: currentUser?.email,
      verified_at: new Date().toISOString(),
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ownership-trace", listingId] }),
  });

  const verifiedCount = events.filter(e => e.verification_status === "verified").length;
  const totalCount = events.length;

  return (
    <div className="bg-white border border-black/[0.07] rounded-2xl p-5 md:p-6">
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div className="flex items-center gap-4">
          <VerifiedTitleStamp verifiedCount={verifiedCount} totalCount={totalCount} size="lg" />
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#E8A83A]">Digital Title · Provenance</p>
            <h3 className="text-lg md:text-xl font-black text-[#0B2D5B] uppercase tracking-tight">Ownership Trace</h3>
            <p className="text-[12px] text-[#6B6560] mt-1 max-w-md">
              Verified documents build this aircraft's digital title. Each stamp of legitimacy strengthens the ATI Score Card.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[#0B2D5B] hover:bg-[#143C75] text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add event
        </button>
      </div>

      {/* Timeline */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-black/5 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-black/10 rounded-xl">
          <Fingerprint className="w-8 h-8 text-[#AAA49C] mx-auto mb-2 opacity-40" />
          <p className="text-sm font-semibold text-[#1A1814]">No provenance events yet</p>
          <p className="text-[11px] text-[#AAA49C] mt-1 max-w-xs mx-auto">
            Upload logbooks, title deeds or bills of sale to start building the verified chain.
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* vertical line */}
          <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-black/[0.06]" />
          <ul className="space-y-4">
            {events.map(ev => {
              const st = STATUS[ev.verification_status] || STATUS.pending;
              const StIcon = st.icon;
              return (
                <li key={ev.id} className="relative pl-10">
                  {/* timeline dot */}
                  <div
                    className="absolute left-0 top-1 w-8 h-8 rounded-full border-2 flex items-center justify-center"
                    style={{ borderColor: st.color, backgroundColor: st.bg }}
                  >
                    <StIcon className="w-3.5 h-3.5" style={{ color: st.color }} />
                  </div>

                  <div className="bg-[#F7F4EF] rounded-xl p-4 border border-black/[0.05]">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-black text-[#1A1814] uppercase tracking-tight">
                            {EVENT_LABEL[ev.event_type] || ev.event_type}
                          </p>
                          <span
                            className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full"
                            style={{ color: st.color, backgroundColor: st.bg }}
                          >
                            {st.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#6B6560] mt-0.5">
                          {fmt(ev.event_date)}
                          {ev.owner_name && <> · <span className="font-semibold text-[#1A1814]">{ev.owner_name}</span></>}
                          {ev.owner_country && <> · {ev.owner_country}</>}
                        </p>
                        {ev.notes && <p className="text-[12px] text-[#4A4845] mt-1.5">{ev.notes}</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      {ev.document_url ? (
                        <a
                          href={ev.document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#0B2D5B] hover:text-[#E8A83A] transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          {ev.document_name || "View document"}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-[11px] text-[#AAA49C]">No document attached</span>
                      )}

                      {ev.verified_by && ev.verification_status === "verified" && (
                        <span className="text-[10px] text-[#6B6560]">
                          Stamped by {ev.verified_by} · {fmt(ev.verified_at)}
                        </span>
                      )}

                      {isAdmin && ev.verification_status !== "verified" && (
                        <button
                          onClick={() => verifyMutation.mutate({ id: ev.id, status: "verified" })}
                          className="ml-auto text-[10px] uppercase tracking-wider font-black text-[#0F7A56] hover:underline"
                        >
                          Stamp as verified
                        </button>
                      )}
                      {isAdmin && ev.verification_status === "pending" && (
                        <button
                          onClick={() => verifyMutation.mutate({ id: ev.id, status: "rejected" })}
                          className="text-[10px] uppercase tracking-wider font-bold text-[#C0392B] hover:underline"
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {showModal && (
        <AddOwnershipEventModal
          listingId={listingId}
          onClose={() => setShowModal(false)}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ["ownership-trace", listingId] })}
        />
      )}
    </div>
  );
}