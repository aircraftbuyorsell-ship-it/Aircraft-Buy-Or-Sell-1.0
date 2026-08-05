import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Loader2, MessageSquare, Send } from "lucide-react";
import StarRating from "@/components/cards/StarRating";

export default function ListingReviewsPanel({ listing }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { base44.auth.me().then(setUser).catch(() => setUser(null)); }, []);
  const { data: reviews = [] } = useQuery({ queryKey: ["listing-reviews", listing?.id], queryFn: () => base44.entities.AircraftListingReview.filter({ listing: listing.id }, "-created_date", 50), enabled: !!listing?.id });
  const submit = async () => {
    if (!rating || !comment.trim()) { setError("Choose a star rating and add a short review."); return; }
    setSaving(true); setError("");
    try { await base44.entities.AircraftListingReview.create({ listing: listing.id, reviewer_name: user?.full_name || "ABOS member", rating, comment: comment.trim(), status: "approved" }); setRating(0); setComment(""); await queryClient.invalidateQueries({ queryKey: ["listing-reviews", listing.id] }); } catch (err) { setError(err.message || "Review could not be submitted."); } finally { setSaving(false); }
  };
  const approved = reviews.filter(review => review.status === "approved");
  const average = approved.length ? approved.reduce((sum, review) => sum + review.rating, 0) / approved.length : 0;
  return <section className="border-t border-black/[0.05] px-5 py-4"><div className="mb-3 flex items-center justify-between"><div><p className="text-[9px] font-bold uppercase tracking-wider text-[#4a4550]">Community reviews</p><div className="mt-1 flex items-center gap-2"><StarRating value={average} size="sm" /><span className="text-xs font-bold text-[#1A1814]">{average ? average.toFixed(1) : "No ratings"}</span></div></div><MessageSquare className="h-4 w-4 text-[#D4A017]" /></div>{user && <div className="rounded-xl bg-[#F7F4EF] p-3"><StarRating value={rating} onChange={setRating} size="md" interactive /><textarea value={comment} onChange={event => setComment(event.target.value.slice(0, 1000))} rows={2} placeholder="Share your opinion about this aircraft…" className="mt-2 w-full resize-none rounded-lg border border-black/10 bg-white px-3 py-2 text-sm" /><button onClick={submit} disabled={saving} className="mt-2 flex items-center gap-1.5 rounded-lg bg-[#0B2D5B] px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}Submit review</button>{error && <p className="mt-2 text-xs text-destructive">{error}</p>}</div>}{approved.map(review => <article key={review.id} className="mt-3 rounded-lg border border-black/[0.06] p-3"><div className="flex items-center justify-between"><StarRating value={review.rating} size="sm" /><span className="text-[10px] text-[#AAA49C]">{new Date(review.created_date).toLocaleDateString()}</span></div><p className="mt-2 text-sm text-[#4A4845]">{review.comment}</p></article>)}</section>;
}