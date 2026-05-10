import { Wrench, AlertCircle } from "lucide-react";

export const MAINTENANCE_INTERVALS = {
  50: { label: "50 HR", desc: "Oil/filter change, visual inspections, systems check" },
  100: { label: "100 HR", desc: "Annual inspection (if not completed), compressions, fuel system" },
  150: { label: "150 HR", desc: "Spark plugs (some models), magneto check, air filter" },
  200: { label: "200 HR", desc: "Engine detailed inspection, bearings, cylinders, gaskets" },
  500: { label: "500 HR", desc: "Major overhaul window begins, engine trending analysis" },
};

export default function MaintenanceSchedule({ annualHours, engineHours, engineTBO, annualOverdue }) {
  const hoursRemaining = engineTBO - engineHours;
  const hrsPerYear = annualHours;

  // Calculate projected hours until each interval
  const projections = Object.keys(MAINTENANCE_INTERVALS)
    .map(interval => {
      const intHours = parseFloat(interval);
      const currentInterval = Math.floor(engineHours / intHours);
      const nextInterval = (currentInterval + 1) * intHours;
      const hoursUntil = nextInterval - engineHours;
      const yearsUntil = hrsPerYear > 0 ? hoursUntil / hrsPerYear : 99;

      return { interval: intHours, hoursUntil, yearsUntil, nextDue: nextInterval };
    })
    .filter(p => p.hoursUntil > 0)
    .sort((a, b) => a.hoursUntil - b.hoursUntil)
    .slice(0, 5);

  return (
    <div className="bg-white border border-black/[0.07] rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-black/[0.06]">
        <div className="w-8 h-8 rounded-lg bg-[#0B2D5B] flex items-center justify-center shrink-0">
          <Wrench className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-[13px] font-black text-[#1A1814] uppercase tracking-tight">Maintenance Schedule</p>
          <p className="text-[10px] text-[#6B6560]">Projected intervals based on current flight hours</p>
        </div>
      </div>

      {annualOverdue && (
        <div className="flex items-start gap-2 bg-[rgba(192,57,43,0.08)] border border-[rgba(192,57,43,0.2)] rounded-lg px-3 py-2.5 text-[#C0392B]">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="text-[11px] font-semibold">Annual inspection overdue — budget $1,500–$3,000</p>
        </div>
      )}

      <div className="space-y-2.5">
        {projections.map((proj, idx) => {
          const isUrgent = proj.hoursUntil < 50;
          const isWarning = proj.hoursUntil < 200;

          return (
            <div
              key={idx}
              className={`rounded-lg p-3 border flex items-start justify-between ${
                isUrgent
                  ? "bg-[rgba(192,57,43,0.08)] border-[rgba(192,57,43,0.2)]"
                  : isWarning
                  ? "bg-[rgba(232,168,58,0.08)] border-[rgba(232,168,58,0.2)]"
                  : "bg-[#F7F4EF] border-black/[0.06]"
              }`}
            >
              <div className="flex-1">
                <p className={`text-[12px] font-black uppercase tracking-tight ${isUrgent ? "text-[#C0392B]" : isWarning ? "text-[#A67C00]" : "text-[#1A1814]"}`}>
                  {MAINTENANCE_INTERVALS[proj.interval.toString()]?.label || `${proj.interval}H`}
                </p>
                <p className="text-[10px] text-[#6B6560] mt-0.5">{MAINTENANCE_INTERVALS[proj.interval.toString()]?.desc}</p>
              </div>
              <div className="text-right shrink-0 ml-3">
                <p className="text-[11px] font-black text-[#0B2D5B]">{proj.hoursUntil.toLocaleString()} hrs</p>
                <p className="text-[10px] text-[#AAA49C]">{proj.yearsUntil.toFixed(1)} yrs @ {annualHours}h/yr</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-[#F7F4EF] rounded-lg p-3 border border-black/[0.06]">
        <p className="text-[11px] font-semibold text-[#6B6560] mb-1">Engine TBO countdown</p>
        <div className="h-2 bg-white rounded-full overflow-hidden border border-black/[0.06]">
          <div
            className="h-full bg-gradient-to-r from-[#0F7A56] to-[#E8A83A] transition-all"
            style={{ width: `${Math.max(0, Math.min(100, ((engineTBO - hoursRemaining) / engineTBO) * 100))}%` }}
          />
        </div>
        <p className="text-[10px] text-[#AAA49C] mt-1.5">
          {hoursRemaining.toLocaleString()} hrs remaining until TBO {engineTBO}
        </p>
      </div>
    </div>
  );
}