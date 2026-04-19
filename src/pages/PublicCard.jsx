import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Fingerprint, Plane, Shield, QrCode, ExternalLink, Lock } from "lucide-react";
import { STATUS_META, CARD_TYPE_META } from "@/lib/atiCard";

/**
 * Public ATI Card view — shareable URL /c/:code.
 * Shows identity layer + aircraft snapshot + QR. Gated deep data behind login.
 */
export default function PublicCard() {
  const { code } = useParams();
  const queryClient = useQueryClient();

  const { data: card, isLoading } = useQuery({
    queryKey: ["public-card", code],
    queryFn: async () => {
      const results = await base44.entities.ATICard.filter({ public_card_code: code }, "-created_date", 1);
      return results[0] || null;
    },
    enabled: !!code,
  });

  const { data: listing } = useQuery({
    queryKey: ["public-card-listing", card?.listing],
    queryFn: () => base44.entities.AircraftListing.get(card.listing),
    enabled: !!card?.listing,
  });

  // Increment view count once per page load
  useEffect(() => {
    if (!card?.id) return;
    base44.entities.ATICard.update(card.id, { view_count: (card.view_count || 0) + 1 })
      .catch(() => {});
  }, [card?.id]); // eslint-disable-line

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/c/${code}` : "";
  const qrSrc = useMemo(() =>
    `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=4&data=${encodeURIComponent(shareUrl)}`,
    [shareUrl]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F4EF] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#0B2D5B]/20 border-t-[#0B2D5B] rounded-full animate-spin" />
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen bg-[#F7F4EF] flex items-center justify-center p-6">
        <div className="bg-white border border-black/[0.08] rounded-2xl p-8 text-center max-w-md">
          <Fingerprint className="w-10 h-10 text-[#AAA49C] mx-auto mb-3" />
          <h1 className="text-lg font-black text-[#1A1814] uppercase tracking-tight">Card not found</h1>
          <p className="text-sm text-[#6B6560] mt-2">No ATI card with code <span className="font-mono font-bold">{code}</span> exists in the registry.</p>
          <Link to="/" className="inline-block mt-5 bg-[#0B2D5B] hover:bg-[#143C75] text-white font-black uppercase text-xs tracking-wider px-5 py-2.5 rounded-md">
            Back to ABOS
          </Link>
        </div>
      </div>
    );
  }

  const status = STATUS_META[card.status] || STATUS_META.issued;
  const type = CARD_TYPE_META[card.card_type] || CARD_TYPE_META.basic;
  const ati = listing?.ati_score;
  const atiColor = !ati ? "#AAA49C" : ati >= 108 ? "#0F7A56" : ati >= 90 ? "#185FA5" : ati >= 72 ? "#E8A83A" : "#C0392B";

  return (
    <div className="min-h-screen bg-[#F7F4EF]">
      {/* Hero card */}
      <div className="bg-[#0B2D5B] text-white">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-10 md:py-14">
          <div className="flex items-center gap-2">
            <Fingerprint className="w-4 h-4 text-[#E8A83A]" />
            <p className="text-[11px] uppercase tracking-[0.2em] font-black text-[#E8A83A]">ATI Card · Public Registry</p>
          </div>
          <p className="font-mono text-xl md:text-3xl font-black tracking-tight mt-2 break-all">{card.public_card_code}</p>

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider font-black px-2.5 py-1 rounded-full bg-white/10">
              {status.label}
            </span>
            <span className="text-[10px] uppercase tracking-wider font-black px-2.5 py-1 rounded-full bg-white/10">
              {type.label} · v{card.card_version}
            </span>
            <span className="text-[10px] uppercase tracking-wider font-black px-2.5 py-1 rounded-full bg-white/10">
              Sequence #{String(card.sequence_number).padStart(6, "0")}
            </span>
          </div>

          <div className="grid md:grid-cols-[1fr_auto] gap-6 mt-8 items-start">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-[#E8A83A] font-black">Subject Aircraft</p>
              <p className="text-xl md:text-2xl font-black mt-1 flex items-center gap-2 flex-wrap">
                <Plane className="w-5 h-5 text-[#E8A83A]" />
                {card.aircraft_label || "—"}
              </p>
              {card.aircraft_registration && (
                <p className="font-mono text-sm text-white/70 mt-0.5">{card.aircraft_registration}</p>
              )}
              <div className="flex items-center gap-4 mt-4">
                {ati != null && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">ATI Score</p>
                    <p className="text-3xl font-black" style={{ color: atiColor }}>{ati}<span className="text-base text-white/40 font-normal">/120</span></p>
                  </div>
                )}
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">Issuer</p>
                  <p className="text-sm font-bold mt-1">{card.issuer_entity || "ABOS"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">Attribution</p>
                  <p className="text-sm font-bold mt-1">First Verified</p>
                </div>
              </div>
            </div>

            {/* QR */}
            <div className="bg-white p-3 rounded-xl shadow-lg self-start">
              <img src={qrSrc} alt="QR code" className="w-[160px] h-[160px] md:w-[200px] md:h-[200px] block" />
              <p className="text-[9px] uppercase tracking-wider text-center font-black text-[#1A1814] mt-2 flex items-center justify-center gap-1">
                <QrCode className="w-3 h-3" /> Scan to verify
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Role layer */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 space-y-5">
        <div className="bg-white border border-black/[0.07] rounded-2xl p-5 md:p-6">
          <p className="text-[10px] uppercase tracking-[0.15em] font-black text-[#E8A83A]">Ownership & Distribution Chain</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {[
              { label: "Subject Owner", value: card.subject_owner_email || "Not disclosed", icon: Shield },
              { label: "Operator", value: card.subject_operator_email || "Not disclosed", icon: Shield },
              { label: "Card Owner", value: card.card_owner_email || "—", icon: Fingerprint },
              { label: "Distribution", value: card.distribution_owner_email || "Direct (ABOS)", icon: Shield },
            ].map(r => (
              <div key={r.label} className="bg-[#F7F4EF] rounded-xl p-3">
                <p className="text-[9px] uppercase tracking-wider text-[#AAA49C] font-semibold">{r.label}</p>
                <p className="text-[12px] font-bold text-[#1A1814] mt-1 truncate">{r.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Locked CTA — sign in for the full passport */}
        <div className="bg-[#1A1814] text-white rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start gap-5">
          <div className="w-12 h-12 rounded-md bg-[#E8A83A]/20 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5 text-[#E8A83A]" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-[0.15em] font-black text-[#E8A83A]">Full Transparency Report</p>
            <h3 className="text-xl font-black mt-1 uppercase tracking-tight">See the 8-dimension ATI breakdown</h3>
            <p className="text-sm text-white/75 mt-2 leading-relaxed">
              Logbooks, AD compliance, engine health, avionics quality, market readiness, ownership trace, OMVM valuation,
              and AI-generated risk analysis. Verified professionals only.
            </p>
          </div>
          <Link to={`/ati-passport/${card.listing}`}
            className="bg-[#E8A83A] hover:bg-[#f5bb4e] text-[#0B2D5B] uppercase font-black text-xs tracking-wider px-5 py-3 rounded-md flex items-center gap-2 shrink-0">
            Open Passport <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center pt-4">
          <p className="text-[10px] uppercase tracking-wider text-[#AAA49C] font-semibold">
            Issued {card.issued_at ? new Date(card.issued_at).toLocaleDateString() : "—"} · {card.view_count || 0} verifications · ABOS Aviation IntraZone
          </p>
        </div>
      </div>
    </div>
  );
}