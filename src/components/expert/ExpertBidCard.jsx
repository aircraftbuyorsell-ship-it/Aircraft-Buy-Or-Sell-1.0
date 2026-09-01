import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Star, BadgeCheck, Euro, Clock, MessageSquare, Loader2 } from "lucide-react";

export default function ExpertBidCard({ bid, onAccept, accepting }) {
  const [expanded, setExpanded] = useState(false);
  const qc = useQueryClient();

  return (
    <div
      className="rounded-xl p-4 transition-all"
      style={{
        background: "rgba(4,6,10,0.50)",
        border: "0.5px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "rgba(245,194,66,0.10)", border: "0.5px solid rgba(245,194,66,0.20)" }}
          >
            <BadgeCheck size={16} style={{ color: "#f5c242" }} />
          </div>
          <div>
            <p className="text-[12px] font-black text-[rgba(255,255,255,0.90)]">{bid.expert_name || "Expert"}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {bid.expert_rating > 0 && (
                <span className="flex items-center gap-0.5 text-[10px] text-[#f5c242]">
                  <Star size={9} className="fill-current" />
                  {bid.expert_rating.toFixed(1)}
                </span>
              )}
              {(bid.expert_certifications || []).slice(0, 2).map(c => (
                <span
                  key={c}
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: "rgba(245,194,66,0.08)", color: "#f5c242", border: "0.5px solid rgba(245,194,66,0.15)" }}
                >
                  {c}
                </span>
              ))}
              {(bid.expert_certifications || []).length > 2 && (
                <span className="text-[9px] text-[rgba(255,255,255,0.30)]">+{bid.expert_certifications.length - 2}</span>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[18px] font-black text-[#f5c242]">€{bid.price_eur}</p>
          {bid.estimated_hours != null && (
            <p className="text-[9px] text-[rgba(255,255,255,0.30)] flex items-center gap-0.5 justify-end">
              <Clock size={8} /> ~{bid.estimated_hours}h
            </p>
          )}
        </div>
      </div>

      {bid.message && (
        <div className="mb-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-[10px] text-[rgba(255,255,255,0.40)] hover:text-white"
          >
            <MessageSquare size={11} />
            {expanded ? "Hide message" : "Read message"}
          </button>
          {expanded && (
            <p className="text-[11px] text-[rgba(255,255,255,0.60)] mt-1.5 leading-relaxed italic">
              "{bid.message}"
            </p>
          )}
        </div>
      )}

      <button
        onClick={() => onAccept(bid)}
        disabled={accepting}
        className="w-full py-2 rounded-lg text-[11px] font-black transition-all disabled:opacity-40"
        style={{ background: "#f5c242", color: "#04060a" }}
      >
        {accepting ? (
          <span className="flex items-center justify-center gap-1.5">
            <Loader2 size={12} className="animate-spin" /> Processing…
          </span>
        ) : (
          <span className="flex items-center justify-center gap-1.5">
            <Euro size={12} /> Select & Pay €{bid.price_eur}
          </span>
        )}
      </button>
    </div>
  );
}