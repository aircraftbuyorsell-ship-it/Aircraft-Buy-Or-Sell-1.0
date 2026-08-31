import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, AlertTriangle, Loader2, Send } from "lucide-react";

export default function ExpertVerdictForm({ crosscheck, expertProfile }) {
  const [verdict, setVerdict] = useState(null);
  const [comment, setComment] = useState("");
  const [disputedFields, setDisputedFields] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const qc = useQueryClient();

  if (!crosscheck) return null;

  const toggleField = (f) => {
    setDisputedFields(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  };

  const handleSubmit = async () => {
    if (!verdict) {
      setError("Please select a verdict.");
      return;
    }
    if (!comment.trim()) {
      setError("Please add your assessment comment.");
      return;
    }
    if (verdict === "disputed" && disputedFields.length === 0) {
      setError("Please specify which fields are discrepant.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await base44.entities.ExpertCrossCheck.update(crosscheck.id, {
        status: "completed",
        verdict,
        expert_comment: comment.trim().slice(0, 500),
        disputed_fields: verdict === "disputed" ? disputedFields : [],
        completed_at: new Date().toISOString(),
      });

      // Notify requester
      base44.functions.invoke("expertNotify", {
        type: "completed",
        requester_email: crosscheck.requester_email,
        expert_name: expertProfile?.full_name || crosscheck.expert_name || "Expert",
        verdict,
        registration: crosscheck.registration,
        expert_comment: comment.trim().slice(0, 500),
      }).catch(() => {});

      qc.invalidateQueries({ queryKey: ["expert-assignments"] });
      qc.invalidateQueries({ queryKey: ["expert-history"] });
      qc.invalidateQueries({ queryKey: ["expert-completed"] });
      qc.invalidateQueries({ queryKey: ["expert-verified"] });
    } catch (e) {
      setError(e.message || "Failed to submit verdict");
    } finally {
      setSubmitting(false);
    }
  };

  const DISPUTABLE_FIELDS = [
    "Registry Data", "Visual Evidence", "Flight Activity", "Ownership", "Airworthiness"
  ];

  return (
    <div className="space-y-4">
      {error && (
        <div className="text-[11px] text-[#ef4444] bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.20)] rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {/* Verdict selection */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setVerdict("confirmed")}
          className="flex flex-col items-center gap-2 py-4 rounded-xl transition-all"
          style={{
            background: verdict === "confirmed" ? "rgba(34,197,94,0.10)" : "rgba(255,255,255,0.03)",
            border: verdict === "confirmed" ? "1px solid rgba(34,197,94,0.30)" : "0.5px solid rgba(255,255,255,0.06)",
          }}
        >
          <ShieldCheck size={20} style={{ color: verdict === "confirmed" ? "#22c55e" : "rgba(255,255,255,0.30)" }} />
          <span className="text-[11px] font-black" style={{ color: verdict === "confirmed" ? "#22c55e" : "rgba(255,255,255,0.40)" }}>
            Confirm GCR
          </span>
          <span className="text-[9px] text-[rgba(255,255,255,0.30)] text-center px-2">
            Findings match the report
          </span>
        </button>

        <button
          onClick={() => setVerdict("disputed")}
          className="flex flex-col items-center gap-2 py-4 rounded-xl transition-all"
          style={{
            background: verdict === "disputed" ? "rgba(239,68,68,0.10)" : "rgba(255,255,255,0.03)",
            border: verdict === "disputed" ? "1px solid rgba(239,68,68,0.30)" : "0.5px solid rgba(255,255,255,0.06)",
          }}
        >
          <AlertTriangle size={20} style={{ color: verdict === "disputed" ? "#ef4444" : "rgba(255,255,255,0.30)" }} />
          <span className="text-[11px] font-black" style={{ color: verdict === "disputed" ? "#ef4444" : "rgba(255,255,255,0.40)" }}>
            Flag Discrepancy
          </span>
          <span className="text-[9px] text-[rgba(255,255,255,0.30)] text-center px-2">
            Issues found vs. report
          </span>
        </button>
      </div>

      {/* Disputed fields (if disputed) */}
      {verdict === "disputed" && (
        <div>
          <p className="text-[10px] uppercase tracking-wider font-bold text-[rgba(255,255,255,0.40)] mb-2">
            Discrepant Fields
          </p>
          <div className="flex flex-wrap gap-2">
            {DISPUTABLE_FIELDS.map(f => (
              <button
                key={f}
                onClick={() => toggleField(f)}
                className="text-[10px] font-bold px-2.5 py-1.5 rounded-full transition-all"
                style={{
                  background: disputedFields.includes(f) ? "rgba(239,68,68,0.10)" : "rgba(255,255,255,0.03)",
                  border: disputedFields.includes(f) ? "0.5px solid rgba(239,68,68,0.25)" : "0.5px solid rgba(255,255,255,0.06)",
                  color: disputedFields.includes(f) ? "#ef4444" : "rgba(255,255,255,0.50)",
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Comment */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[10px] uppercase tracking-wider font-bold text-[rgba(255,255,255,0.40)]">
            Assessment Comment
          </label>
          <span className="text-[9px] text-[rgba(255,255,255,0.25)]">{comment.length}/500</span>
        </div>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value.slice(0, 500))}
          rows={4}
          placeholder="Provide your professional assessment of the GCR report findings. This will be visible to the buyer and displayed on the report."
          className="w-full px-3 py-2.5 rounded-lg text-[11px] resize-none"
          style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.10)", color: "#fff" }}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting || !verdict}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[12px] font-black transition-all disabled:opacity-30"
        style={{ background: "#f5c242", color: "#04060a" }}
      >
        {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        Submit Verdict
      </button>
    </div>
  );
}