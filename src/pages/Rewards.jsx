import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Gift, Users, Award, Copy, Check, Zap, Sparkles, ShieldCheck, TrendingUp } from "lucide-react";
import { useBehavior } from "@/lib/useBehavior";
import { MILESTONE_LIST, MILESTONES } from "@/lib/milestones";
import { toCredits } from "@/lib/pricing";

function GoldLabel({ children }) {
  return <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#E8A83A]">{children}</p>;
}

function StatTile({ icon: Icon, label, value, accent = "#0B2D5B" }) {
  return (
    <div className="bg-white border border-black/[0.07] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
        <p className="text-[10px] uppercase tracking-wider font-semibold text-[#AAA49C]">{label}</p>
      </div>
      <p className="text-2xl font-black text-[#1A1814]">{value}</p>
    </div>
  );
}

function MilestoneCard({ milestone, earnedCount }) {
  const earned = earnedCount > 0;
  return (
    <div className={`bg-white border rounded-xl p-5 transition-all ${earned ? "border-[#0F7A56] bg-[rgba(15,122,86,0.03)]" : "border-black/[0.07]"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-black text-[#1A1814] uppercase tracking-tight">{milestone.label}</h3>
            {earned && (
              <span className="text-[9px] uppercase tracking-wider font-black bg-[#0F7A56] text-white px-2 py-0.5 rounded-full">
                ✓ {earnedCount}×
              </span>
            )}
          </div>
          <p className="text-[12px] text-[#6B6560] mt-1 leading-relaxed">{milestone.description}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="flex items-center gap-1 text-[#E8A83A] font-black">
            <Zap className="w-4 h-4" />
            <span className="text-xl">{milestone.credits}</span>
          </div>
          <p className="text-[9px] uppercase tracking-wider text-[#AAA49C] font-semibold">credits</p>
        </div>
      </div>
    </div>
  );
}

export default function Rewards() {
  const { user, tokens } = useBehavior();
  const [copied, setCopied] = useState(false);

  const { data: rewards = [] } = useQuery({
    queryKey: ["my-rewards", user?.email],
    queryFn: () => base44.entities.RewardMilestone.filter({ user_email: user.email }, "-created_date", 200),
    enabled: !!user?.email,
  });

  const referralLink = user?.email
    ? `${window.location.origin}/?ref=${encodeURIComponent(user.email)}`
    : "";

  const copyLink = async () => {
    if (!referralLink) return;
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalEarned = rewards.reduce((s, r) => s + (r.credits_awarded || 0), 0);
  const countByType = rewards.reduce((acc, r) => {
    acc[r.milestone_type] = (acc[r.milestone_type] || 0) + 1;
    return acc;
  }, {});
  const referralsCount = countByType.referral_verified || 0;

  return (
    <div className="min-h-screen bg-[#F7F4EF]">
      {/* Header */}
      <div className="px-4 md:px-8 pt-6 md:pt-8 pb-5">
        <GoldLabel>Rewards · Free Credits Program</GoldLabel>
        <h1 className="text-2xl md:text-3xl font-black text-[#1A1814] tracking-tight mt-1 uppercase">
          Earn Free Credits
        </h1>
        <p className="text-[#6B6560] text-sm mt-1 max-w-2xl">
          Invite friends, build great ATI Score Cards, close deals in Escrow —
          every milestone pays you back in credits. <b>Credits never expire.</b>
        </p>
      </div>

      <div className="px-4 md:px-8 pb-8 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatTile icon={Zap} label="Your balance" value={toCredits(tokens).toLocaleString()} accent="#E8A83A" />
          <StatTile icon={Award} label="Credits earned" value={totalEarned.toLocaleString()} accent="#0F7A56" />
          <StatTile icon={Users} label="Referrals converted" value={referralsCount} accent="#0B2D5B" />
          <StatTile icon={TrendingUp} label="Milestones hit" value={rewards.length} accent="#185FA5" />
        </div>

        {/* Referral box */}
        <div className="bg-[#0B2D5B] text-white rounded-2xl p-5 md:p-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-md bg-[#E8A83A] flex items-center justify-center shrink-0">
              <Gift className="w-4 h-4 text-[#0B2D5B]" strokeWidth={2.5} />
            </div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-[#E8A83A]">Referral Program</p>
          </div>
          <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">
            Invite a dealer — earn <span className="text-[#E8A83A]">{MILESTONES.referral_verified.credits} credits</span>
          </h2>
          <p className="text-sm text-white/80 mt-2 leading-relaxed max-w-2xl">
            Share your link. When your friend signs up and completes paid verification ($9),
            you get <b>{MILESTONES.referral_verified.credits} credits</b> instantly. No cap. Invite as many as you want.
          </p>

          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <div className="flex-1 bg-white/10 border border-white/20 rounded-md px-3 py-2.5 font-mono text-[12px] text-white/90 truncate">
              {referralLink || "—"}
            </div>
            <button
              onClick={copyLink}
              disabled={!referralLink}
              className="flex items-center justify-center gap-2 bg-[#E8A83A] hover:bg-[#f5bb4e] text-[#0B2D5B] font-black uppercase tracking-wider text-sm px-5 py-2.5 rounded-md transition-colors shrink-0 disabled:opacity-40"
            >
              {copied ? <><Check className="w-4 h-4" /> Copied</> : <><Copy className="w-4 h-4" /> Copy link</>}
            </button>
          </div>
          <p className="text-[10px] text-white/50 mt-2 uppercase tracking-wider">
            Referral credited only after the invitee completes paid verification.
          </p>
        </div>

        {/* Milestones grid */}
        <div>
          <GoldLabel>All Milestones</GoldLabel>
          <div className="grid md:grid-cols-2 gap-3 mt-3">
            {MILESTONE_LIST.map(m => (
              <MilestoneCard key={m.id} milestone={m} earnedCount={countByType[m.id] || 0} />
            ))}
          </div>
        </div>

        {/* Recent awards */}
        <div>
          <GoldLabel>Recent Awards</GoldLabel>
          <div className="mt-3 bg-white border border-black/[0.07] rounded-2xl overflow-hidden">
            {rewards.length === 0 ? (
              <div className="p-8 text-center">
                <Sparkles className="w-10 h-10 text-[#E8A83A] mx-auto mb-3 opacity-60" />
                <p className="text-sm text-[#6B6560]">
                  No rewards yet — start by inviting a friend or generating an ATI Score Card.
                </p>
              </div>
            ) : (
              rewards.map(r => {
                const config = MILESTONES[r.milestone_type];
                return (
                  <div key={r.id} className="flex items-center gap-3 px-4 py-3 border-b border-black/[0.05] last:border-0">
                    <div className="w-8 h-8 rounded-full bg-[rgba(232,168,58,0.12)] flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4 text-[#E8A83A]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#1A1814]">{config?.label || r.milestone_type}</p>
                      {r.note && <p className="text-[11px] text-[#6B6560] truncate">{r.note}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-[#0F7A56]">+{r.credits_awarded} cr</p>
                      <p className="text-[10px] text-[#AAA49C]">{new Date(r.created_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}