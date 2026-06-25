import { Clock, Calendar, CalendarDays, CalendarRange, Loader2, Coins } from "lucide-react";

const W1 = "rgba(255,255,255,0.90)";
const W2 = "rgba(255,255,255,0.60)";
const W3 = "rgba(255,255,255,0.35)";
const BORDER = "rgba(255,255,255,0.08)";
const AMBER = "#f5c242";
const CARD = "rgba(255,255,255,0.04)";

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
    <div className="rounded-2xl p-5 flex flex-col" style={{ background: CARD, border: `0.5px solid ${BORDER}` }}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(245,194,66,0.09)", border: "0.5px solid rgba(245,194,66,0.22)" }}>
          <Icon className="w-5 h-5" style={{ color: AMBER }} />
        </div>
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black" style={{ background: "rgba(78,142,247,0.09)", color: "#4e8ef7" }}>
          <Coins className="w-3 h-3" />
          {meta.cost}
        </div>
      </div>
      <h3 className="font-black text-base mb-1 tracking-tight" style={{ color: W1 }}>{meta.label}</h3>
      <p className="text-xs leading-relaxed mb-4 flex-1" style={{ color: W2 }}>{meta.desc}</p>
      <button
        onClick={() => onGenerate(scope)}
        disabled={isLoading || disabled || insufficient}
        className="w-full h-10 rounded-xl text-[12px] font-black uppercase tracking-wide transition-opacity disabled:cursor-not-allowed"
        style={insufficient
          ? { background: "transparent", border: `0.5px solid ${BORDER}`, color: W3, cursor: "not-allowed" }
          : { background: AMBER, color: "#04060a" }}
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