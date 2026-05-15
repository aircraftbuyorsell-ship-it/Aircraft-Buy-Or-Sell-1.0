import { BarChart3, Clock, Eye, Globe2, MessageSquare, ShieldCheck, TrendingUp, Users } from "lucide-react";

const METRICS = [
  { label: "Total Members", value: "270,928", note: "100+ countries", icon: Users },
  { label: "12-Month Views", value: "10.65M", note: "Premium aviation reach", icon: Eye },
  { label: "Avg Daily Views", value: "29,259", note: "Consistent buyer attention", icon: TrendingUp },
  { label: "Posts / Year", value: "9,287", note: "Active marketplace flow", icon: MessageSquare },
];

const AUDIENCE = [
  { label: "United States", value: "111,689 members", pct: "41.2%" },
  { label: "Canada", value: "12,229 members", pct: "4.5%" },
  { label: "India", value: "9,386 members", pct: "3.5%" },
  { label: "South Africa", value: "9,225 members", pct: "3.4%" },
];

export default function CommunityInsights() {
  return (
    <section className="grid gap-5 lg:grid-cols-[1fr_380px]">
      <div className="rounded-[2rem] border border-white/70 bg-white/60 p-5 shadow-[0_22px_70px_rgba(11,45,91,0.09)] backdrop-blur-2xl md:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#D4A017]">Facebook Group Insights</p>
            <h2 className="mt-1 text-2xl font-black tracking-[-0.05em] text-[#1A1814] md:text-3xl">Community reach advertisers can buy into</h2>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#0B2D5B]/10 bg-[#0B2D5B]/5 px-3 py-2 text-[11px] font-bold text-[#0B2D5B]">
            <Clock className="h-3.5 w-3.5" /> Data: May 2025 – May 2026
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {METRICS.map(({ label, value, note, icon: Icon }) => (
            <div key={label} className="rounded-2xl border border-black/5 bg-white/70 p-4 shadow-sm">
              <Icon className="mb-3 h-5 w-5 text-[#0B2D5B]" />
              <p className="text-2xl font-black tracking-[-0.05em] text-[#0B2D5B]">{value}</p>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#1A1814]">{label}</p>
              <p className="mt-2 text-xs font-medium text-[#6B6560]">{note}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[2rem] border border-[#E8A83A]/30 bg-[#0B2D5B]/92 p-5 text-white shadow-xl backdrop-blur-2xl md:p-6">
        <div className="mb-4 flex items-center gap-2 text-[#E8A83A]">
          <Globe2 className="h-4 w-4" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em]">Top Audience Markets</p>
        </div>
        <div className="space-y-3">
          {AUDIENCE.map((market) => (
            <div key={market.label} className="rounded-2xl border border-white/10 bg-white/8 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black">{market.label}</p>
                  <p className="text-xs text-white/58">{market.value}</p>
                </div>
                <p className="text-lg font-black text-[#E8A83A]">{market.pct}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-start gap-2 rounded-2xl bg-[#E8A83A]/12 p-3 text-xs leading-relaxed text-white/75">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#E8A83A]" />
          Strong fit for insurance, finance, MRO, avionics, training, and aircraft listing advertisers.
        </div>
      </div>
    </section>
  );
}