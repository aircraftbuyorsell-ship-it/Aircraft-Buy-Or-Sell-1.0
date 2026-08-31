/** ABOS Intelligence — section heading: eyebrow + title + optional sub + right slot. */
export default function SectionHeader({ eyebrow, title, sub, right }) {
  return (
    <div className="flex items-end justify-between gap-4 flex-wrap mb-4">
      <div>
        {eyebrow && (
          <p className="text-[10px] tracking-[0.2em] font-bold text-gold-official uppercase mb-1">{eyebrow}</p>
        )}
        <h2 className="text-lg md:text-xl font-bold tracking-tight">{title}</h2>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}