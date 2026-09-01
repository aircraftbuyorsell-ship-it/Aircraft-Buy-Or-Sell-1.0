import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import {
  ShieldCheck, Plus, Search, FileText, CheckCircle2, AlertTriangle, Clock, XCircle,
  ClipboardList, Database, Sparkles, BadgeCheck, Printer, Share2,
} from "lucide-react";
import NewSessionModal from "@/components/ati-verify/NewSessionModal";
import HeroHeader from "@/components/intelligence/HeroHeader";
import SectionHeader from "@/components/intelligence/SectionHeader";
import SummaryCard from "@/components/intelligence/SummaryCard";
import Timeline from "@/components/intelligence/Timeline";
import AIInsightPanel from "@/components/intelligence/AIInsightPanel";
import VerificationCard from "@/components/intelligence/VerificationCard";
import LoadingSkeleton from "@/components/intelligence/LoadingSkeleton";
import EmptyState from "@/components/intelligence/EmptyState";
import ActionBar from "@/components/intelligence/ActionBar";

const PROCESS_STEPS = [
  { label: "Registration", icon: ClipboardList },
  { label: "FAA Registry", icon: Database },
  { label: "Documentation", icon: FileText },
  { label: "AI Analysis", icon: Sparkles },
  { label: "Risk Assessment", icon: AlertTriangle },
  { label: "ATI Passport", icon: BadgeCheck },
];

export default function ATIVerify() {
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["ati-verify-sessions"],
    queryFn: () => base44.entities.ATIVerifySession.list("-created_date", 100),
  });

  const filtered = sessions.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (s.session_code || "").toLowerCase().includes(q) ||
      (s.aircraft_registration || "").toLowerCase().includes(q) ||
      (s.seller_name || "").toLowerCase().includes(q) ||
      (s.broker_name || "").toLowerCase().includes(q)
    );
  });

  const total = sessions.length;
  const verified = sessions.filter(s => s.verification_status === "verified").length;
  const pending = sessions.filter(s => s.status === "invited" || s.status === "in_progress").length;
  const review = sessions.filter(s => s.verification_status === "review_required").length;
  const rejected = sessions.filter(s => s.verification_status === "rejected" || s.status === "rejected").length;
  const rate = total > 0 ? Math.round((verified / total) * 100) : 0;

  const reviewSessions = sessions.filter(s => s.verification_status === "review_required").slice(0, 2);
  const warnings = reviewSessions.map(s =>
    `Session ${s.session_code}${s.aircraft_registration ? ` (${s.aircraft_registration})` : ""} requires manual review before verification can complete.`
  );
  const drafts = sessions.filter(s => s.status === "draft").length;
  const missing = drafts > 0 ? [`${drafts} draft session${drafts > 1 ? "s" : ""} awaiting seller invitation and document upload.`] : [];
  const recommendations = pending > 0
    ? [`${pending} session${pending > 1 ? "s" : ""} in progress — follow up with sellers to keep verification moving.`]
    : verified > 0 ? ["All active sessions are resolved. Generate ATI Passports for verified aircraft to lock in transparency scores."] : [];

  return (
    <div className="min-h-screen dot-grid bg-canvas text-foreground">
      <HeroHeader
        eyebrow="ABOS Intelligence · Verification"
        icon={ShieldCheck}
        title="Aircraft Verification"
        titleAccent="Center"
        subtitle="Verify aircraft identity, documentation, registry status and ownership using ABOS Intelligence."
        primaryAction={{ label: "Generate ATI Passport", icon: BadgeCheck, onClick: () => navigate("/n-lookup") }}
        secondaryAction={{ label: "Verify Another Aircraft", icon: Plus, onClick: () => setShowNew(true) }}
      />

      <div className="px-4 md:px-8 pb-12 max-w-6xl mx-auto space-y-8">
        {/* Summary cards */}
        {isLoading ? (
          <LoadingSkeleton variant="cards" count={6} />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <SummaryCard icon={FileText} label="Total Sessions" value={total} />
            <SummaryCard icon={CheckCircle2} label="Verified" value={verified} accent="text-emerald-600 dark:text-emerald-400" />
            <SummaryCard icon={Clock} label="Pending" value={pending} accent="text-amber-600 dark:text-amber-400" />
            <SummaryCard icon={AlertTriangle} label="Needs Review" value={review} accent="text-red-600 dark:text-red-400" />
            <SummaryCard icon={XCircle} label="Rejected" value={rejected} accent="text-muted-foreground" />
            <SummaryCard icon={ShieldCheck} label="Verification Rate" value={`${rate}%`} accent="text-gold-official" sub="Of all sessions" />
          </div>
        )}

        {/* Verification process timeline */}
        <div className="glass-card p-6">
          <SectionHeader eyebrow="Process" title="Verification Timeline" sub="Every aircraft passes through six intelligence checkpoints." />
          <Timeline steps={PROCESS_STEPS.map((s, i) => ({ ...s, state: i === 0 ? "active" : "pending" }))} />
        </div>

        {/* AI insights */}
        <AIInsightPanel
          title="Verification Intelligence"
          confidence={total > 0 ? rate : null}
          warnings={warnings}
          missing={missing}
          recommendations={recommendations}
        />

        {/* Verification history */}
        <div>
          <SectionHeader
            eyebrow="Records"
            title="Verification History"
            sub={`${filtered.length} session${filtered.length === 1 ? "" : "s"}`}
            right={
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="rounded-lg py-2.5 pl-10 pr-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-gold-official/40 w-64 max-w-full"
                  placeholder="Search sessions…"
                  aria-label="Search verification sessions"
                />
              </div>
            }
          />
          {isLoading ? (
            <LoadingSkeleton variant="rows" count={3} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="No verification sessions yet"
              sub="Start your first remote verification to build the aircraft's transparency record."
              actionLabel="Create your first session"
              onAction={() => setShowNew(true)}
            />
          ) : (
            <div className="glass-card overflow-hidden divide-y divide-border">
              {filtered.map(s => <VerificationCard key={s.id} session={s} />)}
            </div>
          )}
        </div>

        {/* Actions */}
        <ActionBar actions={[
          { label: "Export PDF", icon: Printer, onClick: () => window.print() },
          { label: "Share", icon: Share2, onClick: () => navigator.clipboard.writeText(window.location.href) },
        ]} />
      </div>

      <NewSessionModal open={showNew} onClose={() => { setShowNew(false); queryClient.invalidateQueries({ queryKey: ["ati-verify-sessions"] }); }} />
    </div>
  );
}