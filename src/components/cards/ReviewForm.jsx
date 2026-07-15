import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import StarRating from "./StarRating";

export default function ReviewForm({ card, listing, user, existingReview, onSubmitted }) {
  const qc = useQueryClient();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [title, setTitle] = useState(existingReview?.review_title || "");
  const [text, setText] = useState(existingReview?.review_text || existingReview?.comment || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const subjectId = listing?.id || card?.listing;

  const submit = async () => {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return setError("Choose a rating from 1 to 5 stars.");
    if (!title.trim() || !text.trim()) return setError("Add a review title and review text.");
    setSubmitting(true);
    setError("");
    const payload = {
      rating,
      review_title: title.trim(),
      review_text: text.trim(),
      comment: text.trim(),
      status: "pending",
    };
    try {
      if (existingReview) {
        await base44.entities.ATICardReview.update(existingReview.id, payload);
      } else {
        const mine = await base44.entities.ATICardReview.filter({ listing: subjectId }, "-created_date", 100);
        if (mine.some((review) => review.author_user_id === user.id || review.created_by_id === user.id)) {
          return setError("You have already submitted a review for this aircraft.");
        }
        await base44.entities.ATICardReview.create({
          ...payload,
          ...(card?.id ? { ati_card: card.id, public_card_code: card.public_card_code } : {}),
          listing: subjectId,
          author_user_id: user.id,
          reviewer_email: user.email,
          reviewer_name: user.full_name,
        });
      }
      setSuccess(true);
      qc.invalidateQueries({ queryKey: ["aircraft-reviews", subjectId] });
      onSubmitted?.();
    } catch (submitError) {
      setError(submitError.message || "Review submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) return <div className="rounded-xl border border-emerald-600/20 bg-emerald-500/5 p-4 text-sm text-emerald-700"><CheckCircle2 className="mr-2 inline h-4 w-4" />Thanks — your review is pending moderation.</div>;

  return (
    <div className="rounded-xl border border-black/[0.06] bg-[#F7F4EF] p-4">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-[#1A1814]">{existingReview ? "Edit pending review" : "Write a review"}</p>
      <div className="mb-3 flex items-center gap-2"><StarRating value={rating} onChange={setRating} size="lg" interactive />{rating > 0 && <span className="text-xs font-semibold text-[#6B6560]">{rating}/5</span>}</div>
      <input value={title} onChange={(event) => setTitle(event.target.value.slice(0, 120))} placeholder="Review title" className="mb-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm" />
      <textarea value={text} onChange={(event) => setText(event.target.value.slice(0, 1000))} rows={4} placeholder="Share your opinion about the publicly visible aircraft information…" className="w-full resize-none rounded-lg border border-black/10 bg-white px-3 py-2 text-sm" />
      <div className="mt-2 flex items-center justify-between gap-3"><span className="text-[10px] text-[#AAA49C]">{text.length}/1000 · Reviews are published after moderation</span><button onClick={submit} disabled={submitting} className="inline-flex items-center gap-1.5 rounded-md bg-[#0B2D5B] px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-white disabled:opacity-40">{submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}Submit review</button></div>
      {error && <p className="mt-2 text-xs text-[#C0392B]">{error}</p>}
    </div>
  );
}