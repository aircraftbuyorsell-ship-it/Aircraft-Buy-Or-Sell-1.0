import { Clock, Eye, Globe2, MessageSquare, ShieldCheck, TrendingUp, Users } from "lucide-react";
import { C } from "@/theme/community";

const METRICS = [
  { label: "Total Members", value: "274,021", note: "100+ countries", icon: Users },
  { label: "12-Month Views", value: "11.33M", note: "Premium aviation reach", icon: Eye },
  { label: "Avg Daily Views", value: "31,119", note: "Consistent buyer attention", icon: TrendingUp },
  { label: "Posts / Year", value: "9,840", note: "Active marketplace flow", icon: MessageSquare },
];

const AUDIENCE = [
  { label: "United States", value: "114,395 members", pct: "41.7%" },
  { label: "Canada", value: "12,519 members", pct: "4.6%" },
  { label: "India", value: "9,370 members", pct: "3.4%" },
  { label: "South Africa", value: "9,235 members", pct: "3.4%" },
];

export default function CommunityInsights() {
  return (
    <section className="grid gap-5 lg:grid-cols-[1fr_380px]">
      <div className="rounded-[2rem] p-5 md:p-6" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em]" style={{ color: C.gold }}>Facebook Group Insights</p>
            <h2 className="mt-1 text-2xl font-black tracking-[-0.05em] md:text-3xl" style={{ color: C.text }}>Community reach advertisers can buy into</h2>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-[11px] font-bold" style={{ border: `1px solid ${C.borderMd}`, color: C.goldLight }}>
            <Clock className="h-3.5 w-3.5" /> Data: Jul 2025 – Jul 2026
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {METRICS.map(({ label, value, note, icon: Icon }) => (
            <div key={label} className="rounded-2xl p-4" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
              <Icon className="mb-3 h-5 w-5" style={{ color: C.gold }} />
              <p className="text-2xl font-black tracking-[-0.05em]" style={{ color: C.text }}>{value}</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: C.textMuted }}>{label}</p>
              <p className="mt-2 text-xs font-medium" style={{ color: C.textDim }}>{note}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[2rem] p-5 md:p-6" style={{ background: C.card, border: `1px solid ${C.gold}30` }}>
        <div className="mb-4 flex items-center gap-2" style={{ color: C.gold }}>
          <Globe2 className="h-4 w-4" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em]">Top Audience Markets</p>
        </div>
        <div className="space-y-3">
          {AUDIENCE.map((market) => (
            <div key={market.label} className="rounded-2xl p-3" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black" style={{ color: C.text }}>{market.label}</p>
                  <p className="text-xs" style={{ color: C.textDim }}>{market.value}</p>
                </div>
                <p className="text-lg font-black" style={{ color: C.goldLight }}>{market.pct}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-start gap-2 rounded-2xl p-3 text-xs leading-relaxed" style={{ background: `${C.gold}12`, color: C.textMuted }}>
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" style={{ color: C.gold }} />
          Strong fit for insurance, finance, MRO, avionics, training, and aircraft listing advertisers.
        </div>
      </div>
    </section>
  );
}