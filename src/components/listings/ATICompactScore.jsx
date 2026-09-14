const scoreTone = (score) => {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 65) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
};

export default function ATICompactScore({ score }) {
  if (score == null) return null;
  const normalized = Math.max(0, Math.min(120, Number(score) || 0));
  const progress = (normalized / 120) * 100;

  return (
    <div className={`relative h-14 w-14 shrink-0 ${scoreTone(normalized)}`} aria-label={`ATI score ${normalized} out of 120`}>
      <svg viewBox="0 0 44 44" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="22" cy="22" r="18" fill="none" stroke="currentColor" strokeOpacity="0.14" strokeWidth="3" />
        <circle cx="22" cy="22" r="18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" pathLength="100" strokeDasharray={`${progress} 100`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold leading-none text-foreground">{normalized}</span>
        <span className="mt-0.5 text-[8px] font-bold leading-none text-muted-foreground">/120</span>
      </div>
    </div>
  );
}