import { useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  ArrowLeft, Download, RefreshCw, Zap,
  ShieldCheck, AlertTriangle, CheckCircle2, Clock
} from "lucide-react";
import DocumentUploadPanel from "@/components/ati-verify/DocumentUploadPanel";
import VideoCallPlaceholder from "@/components/ati-verify/VideoCallPlaceholder";
import ScoreRing from "@/components/ati-verify/ScoreRing";
import { exportVerifyReportPDF } from "@/components/ati-verify/VerifyReportPDF";

const DOC_TYPES = [
  { key: "passport", label: "Passport / ID Card", icon: "🪪" },
  { key: "pilot_license", label: "Pilot License", icon: "✈️" },
  { key: "registration_cert", label: "Registration Certificate", icon: "📋" },
  { key: "airworthiness_cert", label: "Airworthiness Certificate", icon: "✅" },
  { key: "insurance", label: "Insurance Document", icon: "🛡️" },
  { key: "logbook", label: "Logbook Page", icon: "📖" },
  { key: "ownership_proof", label: "Ownership Proof (LOI / POA / Reg)", icon: "🏷️" },
];

function StatusBadge({ status }) {
  const config = {
    draft: "bg-white/[0.05] text-white/40 border-white/[0.08]",
    invited: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    in_progress: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    completed: "bg-green-500/10 text-green-400 border-green-500/20",
    rejected: "bg-red-500/10 text-red-400 border-red-500/20",
    expired: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  };
  const c = config[status] || config.draft;
  return <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${c}`}>{status.replace("_", " ")}</span>;
}

export default function ATIVerifySession() {
  const { sessionId } = useParams();
  const queryClient = useQueryClient();
  const [processing, setProcessing] = useState(false);
  const [exporting, setExporting] = useState(false);

  const { data: session, isLoading: loadingSession } = useQuery({
    queryKey: ["ati-verify-session", sessionId],
    queryFn: () => base44.entities.ATIVerifySession.get(sessionId),
    enabled: !!sessionId,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["ati-verify-docs", sessionId],
    queryFn: () => base44.entities.ATIVerifyDocument.filter({ session: sessionId }, "-created_date", 50),
    enabled: !!sessionId,
  });

  const { data: score, isLoading: loadingScore } = useQuery({
    queryKey: ["ati-verify-score", sessionId],
    queryFn: async () => {
      const all = await base44.entities.ATIVerifyScore.filter({ session: sessionId }, "-created_date", 1);
      return all[0] || null;
    },
    enabled: !!sessionId,
  });

  const handleProcess = async () => {
    setProcessing(true);
    try {
      await base44.functions.invoke("atiVerifyProcess", { sessionId });
      queryClient.invalidateQueries({ queryKey: ["ati-verify-docs", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["ati-verify-score", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["ati-verify-session", sessionId] });
    } finally {
      setProcessing(false);
    }
  };

  const handleExport = async () => {
    if (!session) return;
    setExporting(true);
    try {
      await exportVerifyReportPDF({ session, documents, score });
    } finally {
      setExporting(false);
    }
  };

  const docsByType = {};
  DOC_TYPES.forEach(dt => { docsByType[dt.key] = documents.filter(d => d.document_type === dt.key); });

  if (loadingSession) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#2563eb]/20 border-t-[#2563eb] rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <p className="text-white/30">Session not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-white">
      {/* Header */}
      <div className="bg-[#0f1324] border-b border-white/[0.06] sticky top-0 z-10">
        <div className="px-4 md:px-8 py-3 max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link to="/ati-verify" className="text-white/40 hover:text-white/70 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <p className="text-sm font-black text-white">{session.session_code}</p>
              <p className="text-[10px] text-white/30">{session.seller_name || "—"} · {session.aircraft_registration || "—"}</p>
            </div>
            <StatusBadge status={session.status} />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleProcess} disabled={processing}
              className="flex items-center gap-1.5 text-[11px] font-bold text-[#facc15] hover:text-[#eab308] disabled:opacity-40 bg-[#facc15]/5 border border-[#facc15]/15 px-3 py-1.5 rounded-lg transition-colors">
              <Zap className={`w-3.5 h-3.5 ${processing ? "animate-pulse" : ""}`} />
              {processing ? "Processing..." : "Run Verification"}
            </button>
            <button onClick={handleExport} disabled={exporting || !score}
              className="flex items-center gap-1.5 text-[11px] font-bold text-[#60a5fa] hover:text-[#93bbfd] disabled:opacity-30 bg-[#60a5fa]/5 border border-[#60a5fa]/15 px-3 py-1.5 rounded-lg transition-colors">
              <Download className={`w-3.5 h-3.5 ${exporting ? "animate-pulse" : ""}`} />
              {exporting ? "Exporting..." : "PDF Report"}
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto space-y-6">
        {/* Session info + Video */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Session info */}
          <div className="lg:col-span-1 bg-[#11162b] border border-white/[0.06] rounded-xl p-5">
            <p className="text-[10px] text-white/30 uppercase tracking-wider font-bold mb-4">Session Details</p>
            <div className="space-y-3">
              {[
                { l: "Session ID", v: session.session_code },
                { l: "Broker", v: session.broker_name || "—" },
                { l: "Seller", v: session.seller_name || "—" },
                { l: "Registration", v: session.aircraft_registration || "—" },
                { l: "Aircraft Type", v: session.aircraft_type || "—" },
                { l: "Serial (MSN)", v: session.aircraft_serial || "—" },
              ].map(r => (
                <div key={r.l} className="flex justify-between items-baseline">
                  <span className="text-[10px] text-white/30 uppercase tracking-wider">{r.l}</span>
                  <span className="text-[11px] font-bold text-white/80">{r.v}</span>
                </div>
              ))}
              {session.invite_link && (
                <div className="pt-3 border-t border-white/[0.06]">
                  <span className="text-[9px] text-white/20 uppercase tracking-wider">Invite Link</span>
                  <p className="text-[10px] font-mono text-[#60a5fa] break-all mt-1">{session.invite_link}</p>
                </div>
              )}
              {session.notes && (
                <div className="pt-3 border-t border-white/[0.06]">
                  <span className="text-[9px] text-white/20 uppercase tracking-wider">Notes</span>
                  <p className="text-[11px] text-white/50 mt-1">{session.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Video + Scores */}
          <div className="lg:col-span-2 space-y-4">
            <VideoCallPlaceholder session={session} />

            {/* ATI Scores */}
            {score ? (
              <div className="bg-[#11162b] border border-white/[0.06] rounded-xl p-5">
                <p className="text-[10px] text-white/30 uppercase tracking-wider font-bold mb-4">ATI Verification Scores</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <ScoreRing label="Identity" score={score.identity_score} color="#4ade80" />
                  <ScoreRing label="Ownership" score={score.ownership_score} color="#60a5fa" />
                  <ScoreRing label="Documents" score={score.document_confidence_score} color="#facc15" />
                  <ScoreRing label="Overall" score={score.overall_score} color="#c084fc" size="lg" />
                </div>
                {session.verification_status && (
                  <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center gap-2">
                    {session.verification_status === "verified" && <CheckCircle2 className="w-4 h-4 text-[#4ade80]" />}
                    {session.verification_status === "review_required" && <AlertTriangle className="w-4 h-4 text-[#facc15]" />}
                    {session.verification_status === "rejected" && <AlertTriangle className="w-4 h-4 text-[#f87171]" />}
                    <span className="text-sm font-black uppercase tracking-wider" style={{
                      color: session.verification_status === "verified" ? "#4ade80" : session.verification_status === "review_required" ? "#facc15" : "#f87171"
                    }}>{session.verification_status.replace("_", " ")}</span>
                  </div>
                )}
              </div>
            ) : loadingScore ? (
              <div className="bg-[#11162b] border border-white/[0.06] rounded-xl p-8 text-center">
                <RefreshCw className="w-6 h-6 text-[#facc15] animate-spin mx-auto mb-2" />
                <p className="text-white/30 text-[11px]">Loading scores...</p>
              </div>
            ) : (
              <div className="bg-[#11162b] border border-white/[0.06] rounded-xl p-8 text-center">
                <ShieldCheck className="w-8 h-8 text-white/10 mx-auto mb-3" />
                <p className="text-white/20 text-sm font-bold">No scores yet</p>
                <p className="text-white/15 text-[11px] mt-1">Upload documents and run verification to generate ATI scores.</p>
              </div>
            )}
          </div>
        </div>

        {/* Document upload grid */}
        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-wider font-bold mb-4">Documents</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {DOC_TYPES.map(dt => (
              <DocumentUploadPanel
                key={dt.key}
                sessionId={sessionId}
                docType={dt.key}
                label={dt.label}
                icon={dt.icon}
                existingDocs={docsByType[dt.key] || []}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}