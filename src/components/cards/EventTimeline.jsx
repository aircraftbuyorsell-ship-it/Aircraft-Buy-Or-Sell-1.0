import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Activity, Eye, MousePointerClick, UserPlus, CheckCircle2, Unlock, MessageSquare, Send, Handshake, ArrowRightLeft, Calculator, DollarSign, Fingerprint, Share2 } from "lucide-react";
import { format } from "date-fns";

const EVENT_META = {
  card_created:          { icon: Fingerprint,      color: "#0B2D5B", label: "Card Created" },
  card_updated:          { icon: Fingerprint,      color: "#6B6560", label: "Card Updated" },
  card_viewed:           { icon: Eye,              color: "#6B6560", label: "Card Viewed" },
  card_shared:           { icon: Share2,           color: "#E8A83A", label: "Card Shared" },
  link_clicked:          { icon: MousePointerClick,color: "#185FA5", label: "Link Clicked" },
  lead_created:          { icon: UserPlus,         color: "#E8A83A", label: "Lead Created" },
  lead_qualified:        { icon: CheckCircle2,     color: "#0F7A56", label: "Lead Qualified" },
  buyer_unlocked:        { icon: Unlock,           color: "#0F7A56", label: "Buyer Unlocked" },
  seller_contacted:      { icon: MessageSquare,    color: "#185FA5", label: "Seller Contacted" },
  offer_submitted:       { icon: Send,             color: "#E8A83A", label: "Offer Submitted" },
  deal_closed:           { icon: Handshake,        color: "#0F7A56", label: "Deal Closed" },
  card_transferred:      { icon: ArrowRightLeft,   color: "#A67C00", label: "Card Transferred" },
  commission_calculated: { icon: Calculator,       color: "#0B2D5B", label: "Commission Calculated" },
  commission_settled:    { icon: DollarSign,       color: "#0F7A56", label: "Commission Settled" },
};

export default function EventTimeline({ card, limit = 20 }) {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["card-events", card?.id],
    enabled: !!card?.id,
    queryFn: () => base44.entities.LeadEvent.filter({ ati_card: card.id }, "-created_date", limit),
  });

  if (!card) return null;

  return (
    <div className="bg-white border border-black/[0.07] rounded-2xl p-5 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-[#E8A83A]" />
        <p className="text-[10px] uppercase tracking-[0.15em] font-black text-[#E8A83A]">Event Timeline · Audit Trail</p>
        <span className="text-[10px] text-[#AAA49C] ml-auto">{events.length} events</span>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-black/[0.03] rounded animate-pulse" />)}
        </div>
      ) : events.length === 0 ? (
        <p className="text-center text-sm text-[#AAA49C] py-6">No events logged yet.</p>
      ) : (
        <div className="space-y-1">
          {events.map(e => {
            const meta = EVENT_META[e.event_type] || { icon: Activity, color: "#6B6560", label: e.event_type };
            const Icon = meta.icon;
            return (
              <div key={e.id} className="flex items-start gap-3 py-2 border-b border-black/[0.04] last:border-0">
                <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: meta.color + "15" }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: meta.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[12px] font-black text-[#1A1814]">{meta.label}</p>
                    {e.is_verified && (
                      <span className="text-[9px] uppercase tracking-wider font-black px-1.5 py-0.5 rounded-full bg-[rgba(15,122,86,0.1)] text-[#0F7A56]">
                        Verified
                      </span>
                    )}
                    {e.affiliate_link_slug && (
                      <span className="font-mono text-[10px] text-[#0B2D5B] bg-[#0B2D5B]/5 px-1.5 py-0.5 rounded">
                        {e.affiliate_link_slug}
                      </span>
                    )}
                  </div>
                  {e.chain_slugs?.length > 0 && (
                    <p className="text-[10px] text-[#AAA49C] font-mono mt-0.5">
                      Chain: {e.chain_slugs.join(" → ")}
                    </p>
                  )}
                  {e.actor_email && <p className="text-[10px] text-[#6B6560] mt-0.5 truncate">{e.actor_email}</p>}
                </div>
                <p className="text-[10px] text-[#AAA49C] shrink-0 whitespace-nowrap">
                  {e.created_date ? format(new Date(e.created_date), "MMM d HH:mm") : "—"}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}