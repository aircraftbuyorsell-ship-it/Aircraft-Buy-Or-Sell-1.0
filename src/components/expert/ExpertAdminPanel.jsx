import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle, XCircle, Loader2, BadgeCheck, FileText, Users } from "lucide-react";

export default function ExpertAdminPanel({ profiles }) {
  const [processing, setProcessing] = useState(null);
  const qc = useQueryClient();

  const handleApprove = async (profile) => {
    setProcessing(profile.id);
    try {
      await base44.entities.ExpertProfile.update(profile.id, {
        verified_status: "approved",
        verified_at: new Date().toISOString(),
        verified_by_admin: (await base44.auth.me())?.email,
      });
      qc.invalidateQueries({ queryKey: ["expert-pending-profiles"] });
    } catch (e) {
      console.error("Approve failed:", e);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (profile) => {
    setProcessing(profile.id);
    try {
      await base44.entities.ExpertProfile.update(profile.id, {
        verified_status: "rejected",
        verified_at: new Date().toISOString(),
        verified_by_admin: (await base44.auth.me())?.email,
      });
      qc.invalidateQueries({ queryKey: ["expert-pending-profiles"] });
    } catch (e) {
      console.error("Reject failed:", e);
    } finally {
      setProcessing(null);
    }
  };

  const handleFbToggle = async (profile) => {
    setProcessing(profile.id);
    try {
      const next = !profile.fb_community_verified;
      await base44.entities.ExpertProfile.update(profile.id, {
        fb_community_verified: next,
        fb_community_tag: next ? "Aircraft Buy or Sell Community Verified" : null,
      });
      qc.invalidateQueries({ queryKey: ["expert-pending-profiles"] });
    } catch (e) {
      console.error("FB toggle failed:", e);
    } finally {
      setProcessing(null);
    }
  };

  const handleBlock = async (profile) => {
    setProcessing(profile.id);
    try {
      await base44.entities.ExpertProfile.update(profile.id, { is_blocked: true });
      qc.invalidateQueries({ queryKey: ["expert-pending-profiles"] });
    } catch (e) {
      console.error("Block failed:", e);
    } finally {
      setProcessing(null);
    }
  };

  if (!profiles || profiles.length === 0) return null;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "rgba(4,6,10,0.60)", border: "0.5px solid rgba(245,194,66,0.15)" }}
    >
      <div className="px-5 py-4" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <BadgeCheck size={15} style={{ color: "#f5c242" }} />
          <p className="text-[11px] uppercase tracking-[0.12em] font-black text-[#f5c242]">
            Expert Verification Queue
          </p>
          <span className="text-[10px] text-[rgba(255,255,255,0.30)] ml-1">({profiles.length})</span>
        </div>
      </div>

      <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
        {profiles.map(p => (
          <div key={p.id} className="px-5 py-4" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-black text-[rgba(255,255,255,0.90)]">{p.full_name}</p>
                <p className="text-[10px] text-[rgba(255,255,255,0.30)]">{p.email}</p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {(p.certifications || []).map(c => (
                    <span
                      key={c}
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: "rgba(245,194,66,0.08)", color: "#f5c242", border: "0.5px solid rgba(245,194,66,0.15)" }}
                    >
                      {c}
                    </span>
                  ))}
                </div>
                {p.cert_extracted && (
                  <div className="mt-2 space-y-0.5">
                    {p.cert_extracted.cert_type && (
                      <p className="text-[10px] text-[rgba(255,255,255,0.40)]">
                        <FileText size={9} className="inline mr-1" />
                        {p.cert_extracted.cert_type} · #{p.cert_extracted.cert_number || "—"}
                      </p>
                    )}
                    {p.cert_extracted.issuer && (
                      <p className="text-[10px] text-[rgba(255,255,255,0.30)]">
                        Issued by: {p.cert_extracted.issuer}
                      </p>
                    )}
                  </div>
                )}
                {p.cert_scan_url && (
                  <a
                    href={p.cert_scan_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-[#4e8ef7] hover:underline mt-1.5 inline-block"
                  >
                    View certificate scan →
                  </a>
                )}
              </div>

              <div className="flex flex-col gap-1.5 shrink-0">
                {p.verified_status === "pending" ? (
                  <>
                    <button
                      onClick={() => handleApprove(p)}
                      disabled={processing === p.id}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-black transition-all disabled:opacity-30"
                      style={{ background: "#22c55e", color: "#04060a" }}
                    >
                      {processing === p.id ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} />}
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(p)}
                      disabled={processing === p.id}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all disabled:opacity-30"
                      style={{ background: "rgba(239,68,68,0.10)", color: "#ef4444", border: "0.5px solid rgba(239,68,68,0.20)" }}
                    >
                      <XCircle size={11} />
                      Reject
                    </button>
                  </>
                ) : (
                  <>
                  <button
                    onClick={() => handleFbToggle(p)}
                    disabled={processing === p.id}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all disabled:opacity-30"
                    style={p.fb_community_verified
                      ? { background: "rgba(78,142,247,0.15)", color: "#4e8ef7", border: "0.5px solid rgba(78,142,247,0.35)" }
                      : { background: "rgba(78,142,247,0.06)", color: "rgba(78,142,247,0.60)", border: "0.5px solid rgba(78,142,247,0.15)" }}
                    title="Toggle 'Aircraft Buy or Sell Community Verified' badge"
                  >
                    <Users size={11} />
                    {p.fb_community_verified ? "FB Verified ✓" : "FB Verify"}
                  </button>
                  <button
                    onClick={() => handleBlock(p)}
                    disabled={processing === p.id || p.is_blocked}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all disabled:opacity-30"
                    style={{ background: "rgba(239,68,68,0.10)", color: "#ef4444", border: "0.5px solid rgba(239,68,68,0.20)" }}
                  >
                    {p.is_blocked ? "Blocked" : "Block"}
                  </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}