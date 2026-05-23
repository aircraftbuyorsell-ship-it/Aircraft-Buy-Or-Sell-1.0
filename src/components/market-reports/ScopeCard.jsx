import { Clock, Calendar, CalendarDays, CalendarRange, Loader2, Coins } from "lucide-react";

const SCOPE_META = {
  hourly:  { icon: Clock,         label: "Hourly Pulse",      desc: "Sharp pulse on the last 24h",       cost: 2 },
  daily:   { icon: Calendar,      label: "Daily Brief",       desc: "Near-term moves, 1–3 day window",   cost: 5 },
  weekly:  { icon: CalendarDays,  label: "Weekly Report",     desc: "Emerging trends, 7-day window",     cost: 10 },
  monthly: { icon: CalendarRange, label: "Monthly Outlook",   desc: "Structural outlook, 30-day window", cost: 20 },
};

export default function ScopeCard({ scope, onGenerate, isLoading, disabled, balance }) {
  const meta = SCOPE_META[scope];
  const Icon = meta.icon;
  const insufficient = balance != null && balance < meta.cost;

  return (
    <div className="rounded-2xl border border-black/8 bg-white p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-[#E8A83A]/15 border border-[#E8A83A]/30 flex items-center justify-center">
          <Icon className="w-5 h-5 text-[#A67C00]" />
        </div>
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0B2D5B] text-white text-[11px] font-black">
          <Coins className="w-3 h-3" />
          {meta.cost}
        </div>
      </div>
      <h3 className="text-[#1A1814] font-black text-base mb-1 tracking-tight">{meta.label}</h3>
      <p className="text-[#6B6560] text-xs leading-relaxed mb-4 flex-1">{meta.desc}</p>
      <button
        onClick={() => onGenerate(scope)}
        disabled={isLoading || disabled || insufficient}
        className={`
          w-full h-10 rounded-xl text-[12px] font-black uppercase tracking-wide transition-colors
          ${insufficient
            ? "bg-[#F7F4EF] text-[#AAA49C] border border-black/5 cursor-not-allowed"
            : "bg-[#0B2D5B] hover:bg-[#143C75] text-white disabled:opacity-60 disabled:cursor-not-allowed"}
        `}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…
          </span>
        ) : insufficient ? (
          "Insufficient tokens"
        ) : (
          `Generate (−${meta.cost})`
        )}
      </button>
    </div>
  );
}