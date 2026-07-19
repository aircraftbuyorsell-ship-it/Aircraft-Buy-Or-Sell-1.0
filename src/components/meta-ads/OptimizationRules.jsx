import { Target, TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react";

export default function OptimizationRules({ rules, onChange }) {
  const update = (key, value) => onChange({ ...rules, [key]: value });

  return (
    <div className="grid grid-cols-2 gap-3">
      <Field icon={Target} label="Target CPL ($)">
        <input
          type="number"
          value={rules.targetCpl}
          onChange={(e) => update("targetCpl", e.target.value)}
          className="w-full px-2.5 py-1.5 rounded-md text-xs outline-none"
          style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.10)", color: "white" }}
        />
      </Field>
      <Field icon={Calendar} label="Lookback (days)">
        <input
          type="number"
          value={rules.lookbackDays}
          onChange={(e) => update("lookbackDays", e.target.value)}
          className="w-full px-2.5 py-1.5 rounded-md text-xs outline-none"
          style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.10)", color: "white" }}
        />
      </Field>
      <Field icon={TrendingUp} label="Increase (%)">
        <input
          type="number"
          value={rules.increasePct}
          onChange={(e) => update("increasePct", e.target.value)}
          className="w-full px-2.5 py-1.5 rounded-md text-xs outline-none"
          style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.10)", color: "white" }}
        />
      </Field>
      <Field icon={TrendingDown} label="Decrease (%)">
        <input
          type="number"
          value={rules.decreasePct}
          onChange={(e) => update("decreasePct", e.target.value)}
          className="w-full px-2.5 py-1.5 rounded-md text-xs outline-none"
          style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.10)", color: "white" }}
        />
      </Field>
      <Field icon={DollarSign} label="Min Budget ($)">
        <input
          type="number"
          value={rules.minBudget}
          onChange={(e) => update("minBudget", e.target.value)}
          className="w-full px-2.5 py-1.5 rounded-md text-xs outline-none"
          style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.10)", color: "white" }}
        />
      </Field>
      <Field icon={DollarSign} label="Max Budget ($)">
        <input
          type="number"
          value={rules.maxBudget}
          onChange={(e) => update("maxBudget", e.target.value)}
          className="w-full px-2.5 py-1.5 rounded-md text-xs outline-none"
          style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.10)", color: "white" }}
        />
      </Field>
    </div>
  );
}

function Field({ icon: Icon, label, children }) {
  return (
    <div>
      <label className="flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold text-white/40 mb-1">
        <Icon className="w-2.5 h-2.5" /> {label}
      </label>
      {children}
    </div>
  );
}