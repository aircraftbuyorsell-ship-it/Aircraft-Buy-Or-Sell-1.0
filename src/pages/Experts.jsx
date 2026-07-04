import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { BadgeCheck, Users, ShieldCheck } from "lucide-react";
import ExpertCard from "@/components/experts/ExpertCard";

const AMBER = "#f5c242";

export default function Experts() {
  const { data: experts = [], isLoading } = useQuery({
    queryKey: ["public-verified-experts"],
    queryFn: () => base44.entities.ExpertProfile.filter({ verified_status: "approved" }, "-completed_count", 100),
    staleTime: 5 * 60 * 1000,
  });

  const visible = experts.filter((e) => !e.is_blocked);
  const fbCount = visible.filter((e) => e.fb_community_verified).length;

  return (
    <div className="min-h-screen" style={{ background: "transparent" }}>
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-10">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-[10px] uppercase tracking-[0.25em] font-black mb-2" style={{ color: AMBER }}>
            The Human Moat · Expert Trust Wall
          </p>
          <h1 className="text-3xl md:text-4xl font-black text-[rgba(255,255,255,0.92)] tracking-tight">
            Verified Aviation Experts
          </h1>
          <p className="text-sm text-[rgba(255,255,255,0.50)] mt-3 max-w-2xl mx-auto leading-relaxed">
            Every expert is verified by ABOS — certificate scans reviewed by AI and confirmed by admins.
            Members of the 280,000-strong <span className="font-bold text-[#4e8ef7]">Aircraft Buy or Sell</span> community
            carry a special badge as proof of standing.
          </p>
          <div className="flex items-center justify-center gap-6 mt-6">
            <div className="flex items-center gap-2">
              <BadgeCheck size={16} className="text-[#22c55e]" />
              <span className="text-[12px] font-bold text-[rgba(255,255,255,0.70)]">{visible.length} Verified Experts</span>
            </div>
            <div className="flex items-center gap-2">
              <Users size={16} style={{ color: "#4e8ef7" }} />
              <span className="text-[12px] font-bold text-[rgba(255,255,255,0.70)]">{fbCount} Community Verified</span>
            </div>
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-52 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-2xl px-6 py-14 text-center"
            style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
            <ShieldCheck size={32} className="mx-auto mb-3 text-[rgba(255,255,255,0.20)]" />
            <p className="text-[13px] font-bold text-[rgba(255,255,255,0.60)]">No verified experts yet</p>
            <p className="text-[11px] text-[rgba(255,255,255,0.35)] mt-1">Expert profiles appear here once approved by an admin.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visible.map((e) => <ExpertCard key={e.id} expert={e} />)}
          </div>
        )}

        <div className="flex items-center gap-2 justify-center pt-10">
          <ShieldCheck className="w-3.5 h-3.5 text-[rgba(255,255,255,0.3)]" />
          <p className="text-[10px] text-[rgba(255,255,255,0.3)]">
            Independent expert verification · certifications confirmed via document review · abos.market/experts
          </p>
        </div>
      </div>
    </div>
  );
}