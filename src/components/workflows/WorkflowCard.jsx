import { Bell, Mail, ShieldCheck, Sparkles, Trash2, Database, Github, Newspaper, Radar, TrendingUp, Calculator, Brain, Clock, Zap, AlertTriangle, Pause, CheckCircle2 } from "lucide-react";

const ICON_MAP = {
  Bell, Mail, ShieldCheck, Sparkles, Trash2, Database, Github, Newspaper, Radar, TrendingUp, Calculator, Brain, Zap,
};

const CATEGORY_STYLE = {
  scheduled: { bg: "rgba(78,142,247,0.10)", color: "#4e8ef7", label: "Scheduled", icon: Clock },
  entity: { bg: "rgba(245,194,66,0.10)", color: "#f5c242", label: "Entity Trigger", icon: Zap },
  connector: { bg: "rgba(168,85,247,0.10)", color: "#a855f7", label: "Connector", icon: Plug },
  in_app_agent: { bg: "rgba(34,197,94,0.10)", color: "#22c55e", label: "Agent", icon: Brain },
};

function Plug({ className }) {
  return <Zap className={className} />;
}

export default function WorkflowCard({ workflow }) {
  const Icon = ICON_MAP[workflow.icon] || Zap;
  const catStyle = CATEGORY_STYLE[workflow.category] || CATEGORY_STYLE.entity;
  const CatIcon = catStyle.icon;
  const isActive = workflow.status === "active";
  const hasError = workflow.last_run_status === "failed";

  return (
    <div
      className="rounded-xl p-4 transition-all hover:scale-[1.01]"
      style={{
        background: "rgba(255,255,255,0.025)",
        border: hasError
          ? "1px solid rgba(239,68,68,0.25)"
          : isActive
          ? "1px solid rgba(255,255,255,0.08)"
          : "1px solid rgba(255,255,255,0.05)",
        opacity: isActive ? 1 : 0.65,
      }}
    >
      {/* Header row */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{
            background: `${workflow.color || "#f5c242"}15`,
            border: `0.5px solid ${workflow.color || "#f5c242"}30`,
          }}
        >
          <Icon className="w-5 h-5" style={{ color: workflow.color || "#f5c242" }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[13px] font-bold text-white leading-tight truncate">{workflow.name}</h3>
          <p className="text-[10px] font-mono mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.35)" }}>
            {workflow.function_name}()
          </p>
        </div>
        {/* Status dot */}
        <div className="flex items-center gap-1.5 shrink-0">
          {hasError ? (
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
          ) : isActive ? (
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" style={{ boxShadow: "0 0 6px #22c55e" }} />
          ) : (
            <Pause className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.35)" }} />
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-[11px] leading-relaxed mb-3 line-clamp-2" style={{ color: "rgba(255,255,255,0.45)" }}>
        {workflow.description}
      </p>

      {/* Meta row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="inline-flex items-center gap-1 px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider"
          style={{ background: catStyle.bg, color: catStyle.color }}
        >
          <CatIcon className="w-2.5 h-2.5" />
          {catStyle.label}
        </span>
        <span
          className="inline-flex items-center gap-1 px-2 py-1 rounded text-[9px] font-semibold"
          style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.50)" }}
        >
          <Clock className="w-2.5 h-2.5" />
          {workflow.schedule_label || "—"}
        </span>
        {workflow.last_run_status === "success" && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[9px] font-semibold text-green-400" style={{ background: "rgba(34,197,94,0.08)" }}>
            <CheckCircle2 className="w-2.5 h-2.5" />
            OK
          </span>
        )}
        {hasError && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[9px] font-semibold text-red-400" style={{ background: "rgba(239,68,68,0.08)" }}>
            <AlertTriangle className="w-2.5 h-2.5" />
            Error
          </span>
        )}
      </div>
    </div>
  );
}