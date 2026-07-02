import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import GCRScoreGauge from "./GCRScoreGauge";
import { gcrColor } from "./ComplianceBadge";
import { exportGCRPDF, exportGCRDocx } from "./GCRExport";
import {
  ShieldCheck, Camera, Plane, AlertTriangle, CheckCircle,
  Download, FileText, RefreshCw,
} from "lucide-react";
import ExpertCrossCheckResult from "@/components/expert/ExpertCrossCheckResult";

function SubScoreBar({ score, max, color }) {
  const pct = (score / max) * 100;
  return (
    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

function Panel({ icon: Icon, title, score, max, color, children }) {
  return (
    <div className="flex-1 px-5 py-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}12` }}>
          <Icon size={14} style={{ color }} />
        </div>
        <p className="text-[10px] uppercase tracking-[0.12em] font-black" style={{ color }}>{title}</p>
      </div>
      <div className="flex items-baseline gap-1.5 mb-2">
        <span className="text-2xl font-black" style={{ color }}>{score}</span>
        <span className="text-[11px] text-[rgba(255,255,255,0.30)]">/ {max}</span>
      </div>
      <SubScoreBar score={score} max={max} color={color} />
      <div className="mt-3 space-y-1.5">{children}</div>
    </div>
  );
}

function DataRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex justify-between items-baseline">
      <span className="text-[10px] text-[rgba(255,255,255,0.40)]">{label}</span>
      <span className="text-[10px] font-semibold text-[rgba(255,255,255,0.80)] text-right max-w-[60%] truncate">
        {value}
      </span>
    </div>
  );
}

export default function GCRFullReport({ report, registration, userEmail }) {
  const [exporting, setExporting] = useState(null);
  const { data: user } = useQuery({
    queryKey: ["gcr-user"],
    queryFn: () => base44.auth.me(),
    staleTime: 300000,
  });

  if (!report) return null;

  const { score, score_label, sub_scores, registry_data, photo_data, traffic_data, integrity_flags, recommendations } = report;
  const color = gcrColor(score);

  const handleExport = async (type) => {
    setExporting(type);
    try {
      const opts = { report, registration, userName: user?.full_name || user?.email || "—" };
      if (type === "pdf") exportGCRPDF(opts);
      else exportGCRDocx(opts);
    } finally {
      setExporting(null);
    }
  };

  const hasFlags = integrity_flags && integrity_flags.length > 0;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "rgba(4,6,10,0.60)",
        border: "0.5px solid rgba(245,194,66,0.18)",
      }}
    >
      {/* Header bar */}
      <div
        className="px-6 py-4 flex items-center justify-between"
        style={{ borderBottom: "0.5px solid rgba(245,194,66,0.15)" }}
      >
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} style={{ color: "#f5c242" }} />
          <p className="text-[11px] uppercase tracking-[0.15em] font-black text-[#f5c242]">
            Global Compliance Report
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport("pdf")}
            disabled={exporting !== null}
            className="inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors"
            style={{
              background: "rgba(245,194,66,0.08)",
              border: "0.5px solid rgba(245,194,66,0.20)",
              color: "#f5c242",
              opacity: exporting && exporting !== "pdf" ? 0.4 : 1,
            }}
          >
            {exporting === "pdf" ? <RefreshCw size={11} className="animate-spin" /> : <Download size={11} />}
            PDF
          </button>
          <button
            onClick={() => handleExport("docx")}
            disabled={exporting !== null}
            className="inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "0.5px solid rgba(255,255,255,0.10)",
              color: "rgba(255,255,255,0.60)",
              opacity: exporting && exporting !== "docx" ? 0.4 : 1,
            }}
          >
            {exporting === "docx" ? <RefreshCw size={11} className="animate-spin" /> : <FileText size={11} />}
            DOCX
          </button>
        </div>
      </div>

      {/* Score gauge */}
      <div className="flex flex-col items-center py-8" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
        <GCRScoreGauge score={score} />
        <p className="text-[10px] text-[rgba(255,255,255,0.30)] mt-3 font-mono">
          {registration} · {report.cached ? "Cached" : "Fresh"} · {new Date(report.computed_at || Date.now()).toLocaleDateString("en-GB")}
        </p>
      </div>

      {/* Three panels */}
      <div className="flex flex-col md:flex-row" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
        {/* Registry Panel */}
        <Panel
          icon={ShieldCheck}
          title="Registry Validity"
          score={sub_scores.registry.score}
          max={40}
          color={sub_scores.registry.score >= 30 ? "#22c55e" : sub_scores.registry.score >= 15 ? "#f5c242" : "#ef4444"}
        >
          <DataRow label="Source" value={report.registry_source} />
          <DataRow label="Make" value={registry_data?.make} />
          <DataRow label="Model" value={registry_data?.model} />
          <DataRow label="Country" value={registry_data?.country} />
          <DataRow label="Status" value={registry_data?.status_code} />
          <DataRow label="Mode S" value={registry_data?.mode_s_hex} />
        </Panel>

        {/* Divider */}
        <div className="hidden md:block w-px" style={{ background: "rgba(245,194,66,0.12)" }} />

        {/* Visual Panel */}
        <Panel
          icon={Camera}
          title="Visual Evidence"
          score={sub_scores.visual.score}
          max={25}
          color={sub_scores.visual.score >= 20 ? "#22c55e" : sub_scores.visual.score >= 10 ? "#f5c242" : "#ef4444"}
        >
          {photo_data?.url ? (
            <>
              <div className="rounded-lg overflow-hidden mb-2" style={{ aspectRatio: "16/9" }}>
                <img
                  src={photo_data.url}
                  alt={registration}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <DataRow label="Source" value={photo_data.source} />
              <DataRow label="Photographer" value={photo_data.photographer} />
            </>
          ) : (
            <p className="text-[10px] text-[rgba(255,255,255,0.30)] italic">No photo available</p>
          )}
        </Panel>

        {/* Divider */}
        <div className="hidden md:block w-px" style={{ background: "rgba(245,194,66,0.12)" }} />

        {/* Traffic Panel */}
        <Panel
          icon={Plane}
          title="Flight Activity"
          score={sub_scores.traffic.score}
          max={35}
          color={sub_scores.traffic.score >= 20 ? "#22c55e" : sub_scores.traffic.score >= 10 ? "#f5c242" : "#ef4444"}
        >
          <DataRow
            label="Flights (180d)"
            value={traffic_data?.flight_count_last_180_days != null ? String(traffic_data.flight_count_last_180_days) : "—"}
          />
          <DataRow
            label="Avg Altitude"
            value={traffic_data?.avg_altitude != null ? `${traffic_data.avg_altitude.toLocaleString()} ft` : "—"}
          />
          <DataRow
            label="Last Seen"
            value={traffic_data?.last_seen_at ? new Date(traffic_data.last_seen_at).toLocaleDateString("en-GB") : "—"}
          />
          <DataRow
            label="Ground Ratio"
            value={traffic_data?.ground_ratio != null ? `${Math.round(traffic_data.ground_ratio * 100)}%` : "—"}
          />
        </Panel>
      </div>

      {/* Integrity Flags */}
      <div className="px-6 py-5" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2 mb-3">
          {hasFlags ? (
            <AlertTriangle size={13} style={{ color: "#f5c242" }} />
          ) : (
            <CheckCircle size={13} style={{ color: "#22c55e" }} />
          )}
          <p className="text-[10px] uppercase tracking-[0.12em] font-black text-[rgba(255,255,255,0.60)]">
            Integrity Flags
          </p>
        </div>
        {hasFlags ? (
          <div className="flex flex-wrap gap-2">
            {integrity_flags.map((flag) => (
              <span
                key={flag}
                className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "0.5px solid rgba(239,68,68,0.20)",
                  color: "#ef4444",
                }}
              >
                {flag.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-[#22c55e] font-semibold">✓ No integrity issues detected</p>
        )}
      </div>

      {/* Recommendations */}
      <div className="px-6 py-5">
        <p className="text-[10px] uppercase tracking-[0.12em] font-black text-[#f5c242] mb-3">Recommendations</p>
        <ul className="space-y-2">
          {recommendations.map((rec, i) => (
            <li key={i} className="flex gap-2.5 text-[11px] text-[rgba(255,255,255,0.65)] leading-relaxed">
              <span
                className="shrink-0 w-1 h-1 rounded-full mt-1.5"
                style={{ background: "#f5c242" }}
              />
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Expert CrossCheck Result */}
      <ExpertCrossCheckResult registration={registration} />
    </div>
  );
}