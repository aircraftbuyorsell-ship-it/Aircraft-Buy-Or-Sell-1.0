import React from "react";
import {
  ShieldCheck, FileText, TrendingUp, DollarSign,
  CheckCircle, Scale, Flag, Sparkles, Lock,
} from "lucide-react";

const ICONS = { ShieldCheck, FileText, TrendingUp, DollarSign, CheckCircle, Scale, Flag };

const STATUS_META = {
  pending:     { color: "#6B7280", bg: "rgba(107,114,128,0.06)", label: "Pending" },
  in_progress: { color: "#f5c242", bg: "rgba(245,194,66,0.08)", label: "In Progress" },
  completed:   { color: "#5dcaa5", bg: "rgba(93,202,165,0.08)", label: "Completed" },
  skipped:     { color: "#6B7280", bg: "rgba(107,114,128,0.04)", label: "Skipped" },
  blocked:     { color: "#e24b4a", bg: "rgba(226,75,74,0.08)", label: "Blocked" },
};

function StatusIcon({ status }) {
  const meta = STATUS_META[status] || STATUS_META.pending;
  if (status === "completed") return <CheckCircle className="w-4 h-4" style={{ color: meta.color }} />;
  if (status === "in_progress") return (
    <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: `${meta.color}40`, borderTopColor: meta.color }} />
  );
  if (status === "blocked") return <Lock className="w-4 h-4" style={{ color: meta.color }} />;
  if (status === "skipped") return <span className="text-xs font-bold" style={{ color: meta.color }}>—</span>;
  return <div className="w-3 h-3 rounded-full border" style={{ borderColor: meta.color }} />;
}

export default function PipelineStep({ step, index, isLast, onAction, busy }) {
  const catIcon = ICONS[step.category.charAt(0).toUpperCase() + step.category.slice(1)] || ShieldCheck;
  const statusMeta = STATUS_META[step.status] || STATUS_META.pending;
  const canExecute = step.ai_driven && step.function_name && step.status === "pending";
  const canReview = step.ai_driven && !step.function_name && step.status === "pending";
  const canComplete = !step.ai_driven && step.status === "pending";

  return (
    <div className="relative flex gap-3">
      {/* Vertical connector */}
      {!isLast && (
        <div className="absolute left-[19px] top-10 bottom-0 w-px"
          style={{ background: step.status === "completed" ? "rgba(93,202,165,0.3)" : "rgba(255,255,255,0.08)" }} />
      )}

      {/* Step number / icon circle */}
      <div className="relative z-10 shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2"
        style={{
          borderColor: statusMeta.color,
          background: statusMeta.bg,
        }}>
        {step.status === "pending" ? (
          <span className="text-[11px] font-black" style={{ color: statusMeta.color }}>{index + 1}</span>
        ) : (
          <StatusIcon status={step.status} />
        )}
      </div>

      {/* Step content */}
      <div className="flex-1 pb-6">
        <div className="rounded-xl p-4 border transition-colors"
          style={{
            background: statusMeta.bg,
            borderColor: step.status === "pending" ? "rgba(255,255,255,0.06)" : `${statusMeta.color}25`,
          }}>
          {/* Header row */}
          <div className="flex items-start justify-between gap-3 mb-1.5">
            <div className="flex items-center gap-2 min-w-0">
              {React.createElement(catIcon, { className: "w-3.5 h-3.5 shrink-0", style: { color: statusMeta.color } })}
              <span className="text-[13px] font-bold text-[rgba(255,255,255,0.90)] truncate">{step.label}</span>
              {step.ai_driven && (
                <span className="flex items-center gap-0.5 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full shrink-0"
                  style={{ background: "rgba(245,194,66,0.1)", color: "#f5c242", border: "0.5px solid rgba(245,194,66,0.2)" }}>
                  <Sparkles className="w-2.5 h-2.5" /> AI
                </span>
              )}
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider shrink-0" style={{ color: statusMeta.color }}>
              {statusMeta.label}
            </span>
          </div>

          {/* Description */}
          <p className="text-[11px] text-[rgba(255,255,255,0.50)] leading-relaxed mb-2">{step.description}</p>

          {/* AI notes (if completed) */}
          {step.ai_notes && step.status === "completed" && (
            <div className="mt-2 rounded-lg px-3 py-2 text-[11px] leading-relaxed"
              style={{ background: "rgba(93,202,165,0.05)", border: "0.5px solid rgba(93,202,165,0.12)" }}>
              <span className="text-[rgba(93,202,165,0.8)] font-semibold">AI Review: </span>
              <span className="text-[rgba(255,255,255,0.60)]">{step.ai_notes}</span>
            </div>
          )}

          {/* Blocked reason */}
          {step.blocked_reason && step.status === "blocked" && (
            <div className="mt-2 rounded-lg px-3 py-2 text-[11px]"
              style={{ background: "rgba(226,75,74,0.06)", border: "0.5px solid rgba(226,75,74,0.15)" }}>
              <span className="text-[#e24b4a] font-semibold">Blocked: </span>
              <span className="text-[rgba(255,255,255,0.50)]">{step.blocked_reason}</span>
            </div>
          )}

          {/* Action buttons */}
          {step.status === "pending" && (
            <div className="flex gap-2 mt-3">
              {canExecute && (
                <button onClick={() => onAction(step, "execute")} disabled={busy}
                  className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
                  style={{ background: "#f5c242", color: "#04060a" }}>
                  <Sparkles className="w-3 h-3" />
                  {busy ? "Running…" : "Execute"}
                </button>
              )}
              {canReview && (
                <button onClick={() => onAction(step, "ai_review")} disabled={busy}
                  className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
                  style={{ background: "rgba(78,142,247,0.1)", color: "#4e8ef7", border: "0.5px solid rgba(78,142,247,0.25)" }}>
                  <Sparkles className="w-3 h-3" />
                  {busy ? "Reviewing…" : "AI Review Docs"}
                </button>
              )}
              {canComplete && (
                <button onClick={() => onAction(step, "complete")} disabled={busy}
                  className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
                  style={{ background: "rgba(93,202,165,0.08)", color: "#5dcaa5", border: "0.5px solid rgba(93,202,165,0.2)" }}>
                  <CheckCircle className="w-3 h-3" />
                  Mark Done
                </button>
              )}
              <button onClick={() => onAction(step, "skip")} disabled={busy}
                className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg text-[rgba(255,255,255,0.35)] hover:text-[rgba(255,255,255,0.60)] transition-colors disabled:opacity-40">
                Skip
              </button>
            </div>
          )}

          {step.status === "blocked" && (
            <button onClick={() => onAction(step, "complete")} disabled={busy}
              className="mt-3 text-[11px] font-bold px-3 py-1.5 rounded-lg text-[#5dcaa5] transition-colors disabled:opacity-40"
              style={{ background: "rgba(93,202,165,0.08)", border: "0.5px solid rgba(93,202,165,0.2)" }}>
              Retry / Override
            </button>
          )}
        </div>
      </div>
    </div>
  );
}