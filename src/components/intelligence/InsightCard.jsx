const TONES = {
  positive: "border-emerald-500/25 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400",
  warning: "border-amber-500/25 bg-amber-500/5 text-amber-600 dark:text-amber-400",
  danger: "border-red-500/25 bg-red-500/5 text-red-600 dark:text-red-400",
  info: "border-gold-official/25 bg-gold-bg text-gold-official",
};

/** ABOS Intelligence — single AI insight line item. tone: positive|warning|danger|info. */
export default function InsightCard({ icon: Icon, tone = "info", title, text }) {
  return (
    <div className={`rounded-lg border p-3.5 flex gap-3 items-start ${TONES[tone] || TONES.info}`}>
      {Icon && <Icon className="w-4 h-4 shrink-0 mt-0.5" />}
      <div className="min-w-0">
        {title && <p className="text-xs font-bold mb-0.5">{title}</p>}
        <p className="text-[11px] leading-relaxed text-foreground/80">{text}</p>
      </div>
    </div>
  );
}