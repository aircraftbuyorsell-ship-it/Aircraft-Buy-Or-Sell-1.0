import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Send, Loader2 } from "lucide-react";
import StarRating from "./StarRating";

export default function ReviewForm({ card, user, onSubmitted }) {
  const qc = useQueryClient();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const submit = async () => {
    if (!rating || !comment.trim()) {
      setError("Please provide a rating and a comment");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await base44.entities.ATICardReview.create({
        ati_card: card.id,
        public_card_code: card.public_card_code,
        reviewer_email: user?.email,
        reviewer_name: user?.full_name,
        rating,
        comment: comment.trim(),
        status: "pending",
      });
      setRating(0);
      setComment("");
      qc.invalidateQueries({ queryKey: ["card-reviews", card.id] });
      onSubmitted?.();
    } catch (err) {
      setError(err.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#F7F4EF] border border-black/[0.06] rounded-xl p-4">
      <p className="text-[10px] uppercase tracking-wider font-bold text-[#1A1814] mb-2">Write a review</p>
      <div className="flex items-center gap-2 mb-3">
        <StarRating value={rating} onChange={setRating} size="lg" interactive />
        {rating > 0 && <span className="text-xs text-[#6B6560] font-semibold">{rating}/5</span>}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value.slice(0, 1000))}
        rows={3}
        placeholder="Share your experience with this aircraft or listing…"
        className="w-full px-3 py-2 bg-white border border-black/10 rounded-lg text-sm focus:outline-none focus:border-[#0B2D5B] resize-none"
      />
      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px] text-[#AAA49C]">{comment.length}/1000 · Reviews are moderated before publishing</span>
        <button
          onClick={submit}
          disabled={submitting || !rating || !comment.trim()}
          className="flex items-center gap-1.5 bg-[#0B2D5B] hover:bg-[#143C75] disabled:opacity-40 text-white text-[11px] uppercase tracking-wider font-black px-3 py-1.5 rounded-md transition-colors"
        >
          {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          Submit
        </button>
      </div>
      {error && <p className="text-xs text-[#C0392B] mt-2">{error}</p>}
    </div>
  );
}