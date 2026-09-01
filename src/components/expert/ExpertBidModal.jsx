import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { X, Euro, Clock, Loader2, Send } from "lucide-react";

export default function ExpertBidModal({ crosscheck, expertProfile, open, onClose }) {
  const [priceEur, setPriceEur] = useState(expertProfile?.price_eur || 75);
  const [estimatedHours, setEstimatedHours] = useState(24);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const qc = useQueryClient();

  if (!open || !crosscheck) return null;

  const handleSubmit = async () => {
    if (!priceEur || priceEur < 10) {
      setError("Minimum bid is €10.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const me = await base44.auth.me();
      await base44.entities.ExpertBid.create({
        crosscheck_id: crosscheck.id,
        expert_id: me.id,
        expert_email: me.email,
        expert_name: expertProfile.full_name || me.full_name || "",
        expert_certifications: expertProfile.certifications || [],
        expert_rating: expertProfile.rating || 0,
        price_eur: priceEur,
        estimated_hours: estimatedHours,
        message: message || null,
        requester_email: crosscheck.requester_email,
        registration: crosscheck.registration,
        status: "pending",
      });

      // Notify requester
      base44.functions.invoke("expertNotify", {
        type: "bid_received",
        requester_email: crosscheck.requester_email,
        expert_name: expertProfile.full_name || me.full_name || "Expert",
        price_eur: priceEur,
        registration: crosscheck.registration,
      }).catch(() => {});

      qc.invalidateQueries({ queryKey: ["expert-open-crosschecks"] });
      qc.invalidateQueries({ queryKey: ["expert-bids"] });
      onClose();
    } catch (e) {
      setError(e.message || "Failed to submit bid");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.80)" }}>
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: "#0B1220", border: "0.5px solid rgba(245,194,66,0.20)" }}
      >
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "0.5px solid rgba(245,194,66,0.12)" }}>
          <p className="text-[12px] font-black uppercase tracking-[0.12em] text-[#f5c242]">Submit Your Bid</p>
          <button onClick={onClose} className="text-[rgba(255,255,255,0.40)] hover:text-white">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          {/* Aircraft summary */}
          <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.06)" }}>
            <p className="text-[11px] font-bold text-[rgba(255,255,255,0.80)]">
              {crosscheck.aircraft_info || crosscheck.registration}
            </p>
            <p className="text-[10px] text-[rgba(255,255,255,0.30)] font-mono mt-0.5">{crosscheck.registration}</p>
          </div>

          {error && (
            <div className="text-[11px] text-[#ef4444] bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.20)] rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Price */}
          <div>
            <label className="text-[10px] uppercase tracking-wider font-bold text-[rgba(255,255,255,0.40)] mb-1.5 block">
              Your Price (EUR)
            </label>
            <div className="relative">
              <Euro size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.30)]" />
              <input
                type="number"
                min={10}
                max={5000}
                value={priceEur}
                onChange={e => setPriceEur(+e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-lg text-[13px] font-bold"
                style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.10)", color: "#fff" }}
              />
            </div>
          </div>

          {/* Estimated hours */}
          <div>
            <label className="text-[10px] uppercase tracking-wider font-bold text-[rgba(255,255,255,0.40)] mb-1.5 block">
              Estimated Turnaround (hours)
            </label>
            <div className="relative">
              <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(255,255,255,0.30)]" />
              <input
                type="number"
                min={1}
                max={168}
                value={estimatedHours}
                onChange={e => setEstimatedHours(+e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-lg text-[13px] font-bold"
                style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.10)", color: "#fff" }}
              />
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="text-[10px] uppercase tracking-wider font-bold text-[rgba(255,255,255,0.40)] mb-1.5 block">
              Message to Buyer (optional)
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Briefly describe your approach or qualifications..."
              className="w-full px-3 py-2.5 rounded-lg text-[11px] resize-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.10)", color: "#fff" }}
            />
          </div>
        </div>

        <div className="px-5 py-4 flex justify-end gap-2" style={{ borderTop: "0.5px solid rgba(255,255,255,0.06)" }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[11px] font-bold text-[rgba(255,255,255,0.40)] hover:text-white">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-[11px] font-black transition-all disabled:opacity-40"
            style={{ background: "#f5c242", color: "#04060a" }}
          >
            {submitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            Submit Bid
          </button>
        </div>
      </div>
    </div>
  );
}