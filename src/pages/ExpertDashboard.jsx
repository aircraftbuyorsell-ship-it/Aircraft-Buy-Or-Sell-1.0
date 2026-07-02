import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import {
  useExpertProfile, useOpenCrossChecks, useExpertAssignments,
  useExpertHistory, usePendingExpertProfiles
} from "@/hooks/useExpert";
import ExpertOnboardingModal from "@/components/expert/ExpertOnboardingModal";
import ExpertBidModal from "@/components/expert/ExpertBidModal";
import ExpertVerdictForm from "@/components/expert/ExpertVerdictForm";
import ExpertAdminPanel from "@/components/expert/ExpertAdminPanel";
import GCRFullReport from "@/components/gcr/GCRFullReport";
import {
  BadgeCheck, Clock, Zap, UserCheck, Loader2, ChevronDown, ChevronUp,
  Star, Euro, CheckCircle, AlertTriangle, ExternalLink, ShieldCheck
} from "lucide-react";

function ExpertCard({ crosscheck, onBid }) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "rgba(4,6,10,0.50)", border: "0.5px solid rgba(255,255,255,0.08)" }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <p className="text-[12px] font-black text-[rgba(255,255,255,0.90)]">
            {crosscheck.aircraft_info || crosscheck.registration}
          </p>
          <p className="text-[10px] font-mono text-[rgba(255,255,255,0.30)] mt-0.5">
            {crosscheck.registration}
          </p>
        </div>
        <span
          className="text-[9px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: "rgba(245,194,66,0.08)", color: "#f5c242", border: "0.5px solid rgba(245,194,66,0.15)" }}
        >
          Open
        </span>
      </div>
      <div className="flex items-center justify-between mt-3">
        <span className="text-[10px] text-[rgba(255,255,255,0.30)]">
          Posted {new Date(crosscheck.created_date).toLocaleDateString("en-GB")}
        </span>
        <button
          onClick={() => onBid(crosscheck)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-black transition-all"
          style={{ background: "#f5c242", color: "#04060a" }}
        >
          <Zap size={12} /> Submit Bid
        </button>
      </div>
    </div>
  );
}

function AssignmentCard({ crosscheck, expertProfile }) {
  const [expanded, setExpanded] = useState(false);
  const [showGCR, setShowGCR] = useState(false);

  const { data: gcrReport, isLoading: gcrLoading } = useQuery({
    queryKey: ["gcr-expert-view", crosscheck.registration],
    queryFn: async () => {
      const res = await base44.functions.invoke("computeGlobalCompliance", {
        registration: crosscheck.registration,
        force: false,
      });
      return res.data || res;
    },
    enabled: !!crosscheck.registration && showGCR,
    staleTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "rgba(4,6,10,0.50)", border: "0.5px solid rgba(245,194,66,0.15)" }}
    >
      <div className="px-4 py-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-[12px] font-black text-[rgba(255,255,255,0.90)]">
              {crosscheck.aircraft_info || crosscheck.registration}
            </p>
            <p className="text-[10px] font-mono text-[rgba(255,255,255,0.30)] mt-0.5">
              {crosscheck.registration}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[16px] font-black text-[#f5c242]">€{crosscheck.price_paid_eur}</p>
            <p className="text-[9px] text-[rgba(255,255,255,0.30)]">paid</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <Clock size={12} style={{ color: "#f5c242" }} />
          <span className="text-[10px] text-[rgba(255,255,255,0.50)]">
            Assigned to you · {new Date(crosscheck.created_date).toLocaleDateString("en-GB")}
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowGCR(!showGCR)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-bold transition-all"
            style={{ background: "rgba(245,194,66,0.08)", border: "0.5px solid rgba(245,194,66,0.20)", color: "#f5c242" }}
          >
            <ExternalLink size={11} />
            {showGCR ? "Hide GCR Report" : "View GCR Report"}
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-black transition-all"
            style={{ background: "#f5c242", color: "#04060a" }}
          >
            {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            {expanded ? "Hide Verdict Form" : "Submit Verdict"}
          </button>
        </div>
      </div>

      {/* GCR Report (read-only) */}
      {showGCR && (
        <div className="px-4 pb-4" style={{ borderTop: "0.5px solid rgba(255,255,255,0.06)" }}>
          <div className="pt-4">
            {gcrLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={18} className="animate-spin" style={{ color: "#f5c242" }} />
                <span className="text-[11px] text-[rgba(255,255,255,0.50)] ml-2">Loading GCR report…</span>
              </div>
            ) : gcrReport ? (
              <GCRFullReport report={gcrReport} registration={crosscheck.registration} />
            ) : (
              <p className="text-[11px] text-[rgba(255,255,255,0.40)] text-center py-4">
                GCR report not available.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Verdict form */}
      {expanded && (
        <div className="px-4 pb-4" style={{ borderTop: "0.5px solid rgba(255,255,255,0.06)" }}>
          <div className="pt-4">
            <ExpertVerdictForm crosscheck={crosscheck} expertProfile={expertProfile} />
          </div>
        </div>
      )}
    </div>
  );
}

function HistoryCard({ crosscheck }) {
  const isConfirmed = crosscheck.verdict === "confirmed";
  return (
    <div
      className="rounded-xl p-4 flex items-center justify-between gap-3"
      style={{ background: "rgba(4,6,10,0.40)", border: "0.5px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-center gap-3 min-w-0">
        {isConfirmed ? (
          <CheckCircle size={16} className="text-[#22c55e] shrink-0" />
        ) : (
          <AlertTriangle size={16} className="text-[#ef4444] shrink-0" />
        )}
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-[rgba(255,255,255,0.80)] truncate">
            {crosscheck.aircraft_info || crosscheck.registration}
          </p>
          <p className="text-[9px] text-[rgba(255,255,255,0.30)] font-mono">
            {crosscheck.registration} · {crosscheck.completed_at ? new Date(crosscheck.completed_at).toLocaleDateString("en-GB") : "—"}
          </p>
        </div>
      </div>
      <span
        className="text-[9px] font-black px-2 py-0.5 rounded-full shrink-0"
        style={{
          background: isConfirmed ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
          color: isConfirmed ? "#22c55e" : "#ef4444",
          border: `0.5px solid ${isConfirmed ? "rgba(34,197,94,0.20)" : "rgba(239,68,68,0.20)"}`,
        }}
      >
        {isConfirmed ? "Confirmed" : "Disputed"}
      </span>
    </div>
  );
}

export default function ExpertDashboard() {
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["expert-dashboard-user"],
    queryFn: () => base44.auth.me(),
    staleTime: 60000,
  });

  const { data: profile, isLoading: profileLoading } = useExpertProfile(user?.id);
  const { data: openCrossChecks = [], isLoading: openLoading } = useOpenCrossChecks(profile?.verified_status === "approved" ? user?.email : null);
  const { data: assignments = [], isLoading: assignLoading } = useExpertAssignments(profile?.verified_status === "approved" ? user?.id : null);
  const { data: history = [] } = useExpertHistory(profile?.verified_status === "approved" ? user?.id : null);
  const { data: pendingProfiles = [] } = usePendingExpertProfiles(user?.role === "admin" || user?.role === "super_admin");

  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [bidModal, setBidModal] = useState(null);

  const isLoading = userLoading || profileLoading;
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={24} className="animate-spin" style={{ color: "#f5c242" }} />
      </div>
    );
  }

  // No profile — prompt onboarding
  if (!profile) {
    return (
      <div className="min-h-screen px-4 md:px-8 py-8 max-w-3xl mx-auto">
        <div
          className="rounded-2xl p-8 text-center"
          style={{ background: "rgba(4,6,10,0.60)", border: "0.5px solid rgba(245,194,66,0.15)" }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(245,194,66,0.08)", border: "0.5px solid rgba(245,194,66,0.20)" }}
          >
            <BadgeCheck size={28} style={{ color: "#f5c242" }} />
          </div>
          <h1 className="text-xl font-black text-white mb-2">Become a Verified Expert</h1>
          <p className="text-[12px] text-[rgba(255,255,255,0.50)] max-w-md mx-auto mb-6 leading-relaxed">
            Join the ABOS Expert CrossCheck network. Validate GCR compliance reports for aircraft buyers worldwide and earn for your expertise.
          </p>
          <div className="grid grid-cols-3 gap-3 mb-6 max-w-md mx-auto">
            {[
              { icon: ShieldCheck, label: "Get Verified", desc: "Upload certs" },
              { icon: Zap, label: "Receive Bids", desc: "Open requests" },
              { icon: Euro, label: "Get Paid", desc: "Via Stripe" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
                <Icon size={16} className="mx-auto mb-1.5" style={{ color: "#f5c242" }} />
                <p className="text-[10px] font-black text-[rgba(255,255,255,0.80)]">{label}</p>
                <p className="text-[9px] text-[rgba(255,255,255,0.30)]">{desc}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => setOnboardingOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[13px] font-black transition-all"
            style={{ background: "#f5c242", color: "#04060a" }}
          >
            <UserCheck size={15} />
            Start Expert Onboarding
          </button>
        </div>
        <ExpertOnboardingModal
          open={onboardingOpen}
          onClose={() => setOnboardingOpen(false)}
          userId={user?.id}
          userEmail={user?.email}
          userFullName={user?.full_name}
        />
      </div>
    );
  }

  // Pending verification
  if (profile.verified_status === "pending") {
    return (
      <div className="min-h-screen px-4 md:px-8 py-8 max-w-3xl mx-auto">
        <div
          className="rounded-2xl p-8 text-center"
          style={{ background: "rgba(4,6,10,0.60)", border: "0.5px solid rgba(245,194,66,0.15)" }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(245,194,66,0.08)", border: "0.5px solid rgba(245,194,66,0.20)" }}
          >
            <Clock size={28} style={{ color: "#f5c242" }} />
          </div>
          <h1 className="text-xl font-black text-white mb-2">Verification in Progress</h1>
          <p className="text-[12px] text-[rgba(255,255,255,0.50)] max-w-md mx-auto mb-4">
            Your expert profile is being reviewed by our admin team. You'll receive an email notification once approved.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg" style={{ background: "rgba(245,194,66,0.06)", border: "0.5px solid rgba(245,194,66,0.15)" }}>
            <Clock size={13} style={{ color: "#f5c242" }} />
            <span className="text-[11px] font-bold text-[#f5c242]">Status: Pending Review</span>
          </div>
        </div>
      </div>
    );
  }

  // Rejected
  if (profile.verified_status === "rejected") {
    return (
      <div className="min-h-screen px-4 md:px-8 py-8 max-w-3xl mx-auto">
        <div
          className="rounded-2xl p-8 text-center"
          style={{ background: "rgba(4,6,10,0.60)", border: "0.5px solid rgba(239,68,68,0.20)" }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(239,68,68,0.08)", border: "0.5px solid rgba(239,68,68,0.20)" }}
          >
            <AlertTriangle size={28} className="text-[#ef4444]" />
          </div>
          <h1 className="text-xl font-black text-white mb-2">Verification Not Approved</h1>
          <p className="text-[12px] text-[rgba(255,255,255,0.50)] max-w-md mx-auto mb-2">
            Your expert profile was not approved at this time.
          </p>
          {profile.rejection_reason && (
            <p className="text-[11px] text-[#ef4444] bg-[rgba(239,68,68,0.06)] rounded-lg px-3 py-2 inline-block">
              {profile.rejection_reason}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Blocked
  if (profile.is_blocked) {
    return (
      <div className="min-h-screen px-4 md:px-8 py-8 max-w-3xl mx-auto">
        <div
          className="rounded-2xl p-8 text-center"
          style={{ background: "rgba(4,6,10,0.60)", border: "0.5px solid rgba(239,68,68,0.20)" }}
        >
          <AlertTriangle size={28} className="text-[#ef4444] mx-auto mb-4" />
          <h1 className="text-xl font-black text-white mb-2">Account Suspended</h1>
          <p className="text-[12px] text-[rgba(255,255,255,0.50)]">
            Your expert account has been suspended. Please contact support.
          </p>
        </div>
      </div>
    );
  }

  // Approved — full dashboard
  return (
    <div className="min-h-screen px-4 md:px-8 py-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div
        className="rounded-2xl px-6 py-5 flex items-center justify-between"
        style={{ background: "rgba(4,6,10,0.60)", border: "0.5px solid rgba(245,194,66,0.15)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(245,194,66,0.10)", border: "0.5px solid rgba(245,194,66,0.20)" }}
          >
            <BadgeCheck size={22} style={{ color: "#f5c242" }} />
          </div>
          <div>
            <h1 className="text-[16px] font-black text-white">{profile.full_name}</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              {profile.rating > 0 && (
                <span className="flex items-center gap-0.5 text-[10px] text-[#f5c242]">
                  <Star size={10} className="fill-current" />
                  {profile.rating.toFixed(1)}
                </span>
              )}
              {(profile.certifications || []).slice(0, 3).map(c => (
                <span
                  key={c}
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: "rgba(245,194,66,0.08)", color: "#f5c242", border: "0.5px solid rgba(245,194,66,0.15)" }}
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[20px] font-black text-[#f5c242]">{profile.completed_count || 0}</p>
          <p className="text-[9px] text-[rgba(255,255,255,0.30)] uppercase tracking-wider">Completed</p>
        </div>
      </div>

      {/* Admin oversight */}
      {isAdmin && pendingProfiles.length > 0 && (
        <ExpertAdminPanel profiles={pendingProfiles} />
      )}

      {/* Open requests */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Zap size={14} style={{ color: "#f5c242" }} />
          <h2 className="text-[13px] font-black text-white uppercase tracking-[0.08em]">
            Open Requests
          </h2>
          <span className="text-[10px] text-[rgba(255,255,255,0.30)]">({openCrossChecks.length})</span>
        </div>
        {openLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={18} className="animate-spin" style={{ color: "#f5c242" }} />
          </div>
        ) : openCrossChecks.length === 0 ? (
          <div
            className="rounded-xl py-8 text-center"
            style={{ background: "rgba(4,6,10,0.40)", border: "0.5px solid rgba(255,255,255,0.06)" }}
          >
            <Clock size={20} className="mx-auto mb-2 text-[rgba(255,255,255,0.20)]" />
            <p className="text-[11px] text-[rgba(255,255,255,0.40)]">No open requests right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {openCrossChecks.map(cc => (
              <ExpertCard key={cc.id} crosscheck={cc} onBid={setBidModal} />
            ))}
          </div>
        )}
      </div>

      {/* Active assignments */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Clock size={14} style={{ color: "#f5c242" }} />
          <h2 className="text-[13px] font-black text-white uppercase tracking-[0.08em]">
            Active Assignments
          </h2>
          <span className="text-[10px] text-[rgba(255,255,255,0.30)]">({assignments.length})</span>
        </div>
        {assignLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={18} className="animate-spin" style={{ color: "#f5c242" }} />
          </div>
        ) : assignments.length === 0 ? (
          <div
            className="rounded-xl py-8 text-center"
            style={{ background: "rgba(4,6,10,0.40)", border: "0.5px solid rgba(255,255,255,0.06)" }}
          >
            <CheckCircle size={20} className="mx-auto mb-2 text-[rgba(255,255,255,0.20)]" />
            <p className="text-[11px] text-[rgba(255,255,255,0.40)]">No active assignments.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {assignments.map(cc => (
              <AssignmentCard key={cc.id} crosscheck={cc} expertProfile={profile} />
            ))}
          </div>
        )}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={14} style={{ color: "#f5c242" }} />
            <h2 className="text-[13px] font-black text-white uppercase tracking-[0.08em]">
              Completed CrossChecks
            </h2>
            <span className="text-[10px] text-[rgba(255,255,255,0.30)]">({history.length})</span>
          </div>
          <div className="space-y-2">
            {history.map(cc => (
              <HistoryCard key={cc.id} crosscheck={cc} />
            ))}
          </div>
        </div>
      )}

      {/* Bid modal */}
      {bidModal && (
        <ExpertBidModal
          crosscheck={bidModal}
          expertProfile={profile}
          open={!!bidModal}
          onClose={() => setBidModal(null)}
        />
      )}
    </div>
  );
}