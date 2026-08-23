const LEVEL_STYLES = { verified: "bg-emerald-500/10 text-emerald-600", likely: "bg-amber-500/10 text-amber-600", manual_required: "bg-red-500/10 text-red-600" };
export default function FieldGroup({ group, draft, onChange }) {
  return <section className="rounded-2xl border border-border bg-card p-5">
    <h2 className="mb-4 font-bold text-card-foreground">{group.title}</h2>
    <div className="grid gap-4 md:grid-cols-2">{group.fields.map(([field, label, type = "text"]) => {
      const meta = draft.field_confidence?.[field] || { source: "Manual input", level: "manual_required" };
      return <label key={field} className="block"><span className="mb-1.5 flex items-center justify-between gap-2 text-xs font-semibold text-card-foreground"><span>{label}</span><span className={`rounded-full px-2 py-0.5 text-[10px] ${LEVEL_STYLES[meta.level]}`}>{meta.level.replace("_", " ")}</span></span>
        <input type={type} min={type === "number" ? 0 : undefined} value={draft[field] ?? ""} onChange={(e) => onChange(field, type === "number" && e.target.value !== "" ? Number(e.target.value) : e.target.value)} className="h-11 w-full rounded-xl border px-3 text-sm" />
        <span className="mt-1 block text-[10px] text-muted-foreground">Source: {meta.source}</span>
      </label>;
    })}</div>
  </section>;
}