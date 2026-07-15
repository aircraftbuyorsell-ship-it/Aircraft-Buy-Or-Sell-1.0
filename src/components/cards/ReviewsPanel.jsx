import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, LogIn, MessageSquare, Star } from "lucide-react";
import StarRating from "./StarRating";
import ReviewForm from "./ReviewForm";
import { useCardPermissions } from "@/lib/useCardPermissions";

const isPublished = (review) => review.status === "published" || review.status === "approved";

export default function ReviewsPanel({ card, listing, limit = null, publicOnly = false }) {
  const qc = useQueryClient();
  const { user, isAdmin } = useCardPermissions(card);
  const [writing, setWriting] = useState(false);
  const subjectId = listing?.id || card?.listing;
  const filter = { listing: subjectId };
  const { data: reviews = [], isLoading } = useQuery({ queryKey: ["aircraft-reviews", subjectId], queryFn: () => base44.entities.ATICardReview.filter(filter, "-created_date", 100), enabled: !!subjectId });
  const published = reviews.filter(isPublished);
  const ownReview = reviews.find((review) => review.author_user_id === user?.id || review.created_by_id === user?.id);
  const visible = isAdmin && !publicOnly ? reviews : published.concat(ownReview && !isPublished(ownReview) ? [ownReview] : []);
  const displayed = limit ? visible.slice(0, limit) : visible;
  const average = published.length ? published.reduce((sum, review) => sum + review.rating, 0) / published.length : 0;
  const distribution = [5, 4, 3, 2, 1].map((rating) => ({ rating, count: published.filter((review) => review.rating === rating).length }));

  const moderate = async (review, status) => {
    await base44.entities.ATICardReview.update(review.id, { status, moderated_by: user.email, moderated_at: new Date().toISOString() });
    qc.invalidateQueries({ queryKey: ["aircraft-reviews", subjectId] });
  };

  return (
    <section id="reviews" className="rounded-2xl border border-black/[0.07] bg-white p-5 md:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#E8A83A]">Community reviews</p><div className="mt-1 flex items-center gap-2"><StarRating value={average} size="md" /><span className="text-sm font-black text-[#1A1814]">{average ? average.toFixed(1) : "—"}</span><span className="text-[11px] text-[#AAA49C]">· {published.length} review{published.length === 1 ? "" : "s"}</span></div></div>
        {!publicOnly && user ? <button onClick={() => setWriting(true)} disabled={!!ownReview} className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B2D5B] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"><Star className="h-3.5 w-3.5" />{ownReview ? "Review submitted" : "Write a review"}</button> : !publicOnly ? <button onClick={() => base44.auth.redirectToLogin(window.location.href)} className="inline-flex items-center gap-1.5 rounded-lg border border-[#0B2D5B]/20 px-3 py-2 text-xs font-bold text-[#0B2D5B]"><LogIn className="h-3.5 w-3.5" />Sign in to review</button> : null}
      </div>
      <div className="mb-5 space-y-1.5">{distribution.map(({ rating, count }) => <div key={rating} className="flex items-center gap-2 text-[10px]"><span className="w-6 text-right text-[#6B6560]">{rating}★</span><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/[0.06]"><div className="h-full rounded-full bg-[#E8A83A]" style={{ width: `${published.length ? (count / published.length) * 100 : 0}%` }} /></div><span className="w-4 text-[#AAA49C]">{count}</span></div>)}</div>
      {writing && <div className="mb-5"><ReviewForm card={card} listing={listing} user={user} existingReview={ownReview?.status === "pending" ? ownReview : null} onSubmitted={() => setWriting(false)} /></div>}
      {ownReview?.status === "pending" && !writing && <button onClick={() => setWriting(true)} className="mb-4 text-xs font-semibold text-[#0B2D5B] underline">Edit your pending review</button>}
      {isLoading ? <div className="h-20 animate-pulse rounded-lg bg-black/[0.04]" /> : displayed.length === 0 ? <p className="py-6 text-center text-sm text-[#AAA49C]">No reviews yet. Be the first to share an opinion about this aircraft.</p> : <div className="space-y-3">{displayed.map((review) => <article key={review.id} className="rounded-lg border border-black/[0.06] p-3"><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><StarRating value={review.rating} size="sm" /><span className="text-xs font-bold text-[#1A1814]">{review.reviewer_name || "Community member"}</span>{!isPublished(review) && <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold uppercase text-amber-700">{review.status}</span>}</div><span className="text-[10px] text-[#AAA49C]">{new Date(review.created_date).toLocaleDateString()}</span></div><p className="mt-2 text-sm font-bold text-[#1A1814]">{review.review_title}</p><p className="mt-1 text-sm leading-relaxed text-[#4A4845]">{review.review_text || review.comment}</p>{isAdmin && !isPublished(review) && <div className="mt-3 flex gap-3 border-t border-black/[0.05] pt-2"><button onClick={() => moderate(review, "published")} className="text-[10px] font-bold uppercase text-emerald-700">Publish</button><button onClick={() => moderate(review, "rejected")} className="text-[10px] font-bold uppercase text-red-700">Reject</button></div>}</article>)}</div>}
      {user && ownReview?.status === "pending" && <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-amber-700"><CheckCircle2 className="h-3.5 w-3.5" />Your review is pending moderation and is not public yet.</p>}
      {!user && !publicOnly && <p className="mt-4 text-xs text-[#6B6560]">Sign in to submit a rating and review. Published reviews remain visible to everyone.</p>}
    </section>
  );
}