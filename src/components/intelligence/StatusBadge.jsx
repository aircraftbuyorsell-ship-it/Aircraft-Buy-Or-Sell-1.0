const TONES = {
  success: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
  warning: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/25",
  danger: "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/25",
  info: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/25",
  neutral: "text-slate-500 bg-slate-500/10 border-slate-500/25",
  gold: "text-gold-official bg-gold-bg border-gold-official/30",
};

/** ABOS Intelligence — status pill. tone: success|warning|danger|info|neutral|gold. */
export default function StatusBadge({ label, tone = "neutral", icon: Icon }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${TONES[tone] || TONES.neutral}`}>
      {Icon && <Icon className="w-3 h-3" />} {label}
    </span>
  );
}