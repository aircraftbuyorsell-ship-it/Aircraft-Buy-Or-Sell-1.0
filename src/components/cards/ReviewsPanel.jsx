import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { MessageSquare, CheckCircle2, Clock, XCircle, Trash2 } from "lucide-react";
import StarRating from "./StarRating";
import ReviewForm from "./ReviewForm";
import { useCardPermissions } from "@/lib/useCardPermissions";

function StatusBadge({ status }) {
  const map = {
    approved: { icon: CheckCircle2, color: "#0F7A56", bg: "rgba(15,122,86,0.08)", label: "Approved" },
    pending: { icon: Clock, color: "#A67C00", bg: "rgba(166,124,0,0.08)", label: "Pending" },
    rejected: { icon: XCircle, color: "#C0392B", bg: "rgba(192,57,43,0.08)", label: "Rejected" },
  };
  const s = map[status] || map.pending;
  const Icon = s.icon;
  return (
    <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full"
      style={{ color: s.color, backgroundColor: s.bg }}>
      <Icon className="w-3 h-3" /> {s.label}
    </span>
  );
}

export default function ReviewsPanel({ card, limit = null, publicOnly = false }) {
  const qc = useQueryClient();
  const { user, isAdmin } = useCardPermissions(card);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["card-reviews", card?.id],
    queryFn: () => base44.entities.ATICardReview.filter({ ati_card: card.id }, "-created_date", 100),
    enabled: !!card?.id,
  });

  // Public view: only approved. Signed-in: approved + your own (pending/rejected).
  const visible = reviews.filter((r) => {
    if (r.status === "approved") return true;
    if (publicOnly) return false;
    if (isAdmin) return true;
    return user && r.created_by === user.email;
  });
  const displayed = limit ? visible.slice(0, limit) : visible;

  const moderate = async (review, status) => {
    await base44.entities.ATICardReview.update(review.id, {
      status,
      moderated_by: user?.email,
      moderated_at: new Date().toISOString(),
    });
    qc.invalidateQueries({ queryKey: ["card-reviews", card.id] });
  };

  const remove = async (review) => {
    if (!confirm("Delete this review?")) return;
    await base44.entities.ATICardReview.delete(review.id);
    qc.invalidateQueries({ queryKey: ["card-reviews", card.id] });
  };

  const canReview = !!user && !publicOnly && !reviews.some((r) => r.created_by === user.email);
  const avg = card?.average_review_rating || 0;
  const count = card?.review_count || visible.filter((r) => r.status === "approved").length;

  return (
    <div className="bg-white border border-black/[0.07] rounded-2xl p-5 md:p-6">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#E8A83A]">Hodnocení · Reviews</p>
          <div className="flex items-center gap-2 mt-1">
            <StarRating value={avg} size="md" />
            <span className="text-sm font-black text-[#1A1814]">{avg ? avg.toFixed(1) : "—"}</span>
            <span className="text-[11px] text-[#AAA49C]">· {count} review{count === 1 ? "" : "s"}</span>
          </div>
        </div>
        <MessageSquare className="w-5 h-5 text-[#AAA49C]" />
      </div>

      {canReview && (
        <div className="mb-4">
          <ReviewForm card={card} user={user} />
        </div>
      )}

      {isLoading ? (
        <div className="h-20 bg-black/[0.04] rounded-lg animate-pulse" />
      ) : displayed.length === 0 ? (
        <p className="text-sm text-[#AAA49C] text-center py-6">No reviews yet{canReview ? "" : " — sign in to write the first one"}.</p>
      ) : (
        <div className="space-y-3">
          {displayed.map((r) => (
            <div key={r.id} className="border border-black/[0.06] rounded-lg p-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <StarRating value={r.rating} size="sm" />
                  <span className="text-xs font-bold text-[#1A1814]">{r.reviewer_name || r.created_by || "Anonymous"}</span>
                  {r.status !== "approved" && <StatusBadge status={r.status} />}
                </div>
                <span className="text-[10px] text-[#AAA49C]">{new Date(r.created_date).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-[#4A4845] leading-relaxed mt-2">{r.comment}</p>

              {/* Admin moderation + owner delete */}
              {(isAdmin || r.created_by === user?.email) && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-black/[0.05]">
                  {isAdmin && r.status !== "approved" && (
                    <button onClick={() => moderate(r, "approved")}
                      className="text-[10px] uppercase tracking-wider font-bold text-[#0F7A56] hover:underline">
                      Approve
                    </button>
                  )}
                  {isAdmin && r.status !== "rejected" && (
                    <button onClick={() => moderate(r, "rejected")}
                      className="text-[10px] uppercase tracking-wider font-bold text-[#C0392B] hover:underline">
                      Reject
                    </button>
                  )}
                  <button onClick={() => remove(r)}
                    className="text-[10px] uppercase tracking-wider font-bold text-[#AAA49C] hover:text-[#C0392B] flex items-center gap-1 ml-auto">
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              )}
            </div>
          ))}
          {limit && visible.length > limit && (
            <p className="text-[11px] text-center text-[#AAA49C]">Showing {limit} of {visible.length} reviews</p>
          )}
        </div>
      )}
    </div>
  );
}