import { ExternalLink, FileText } from "lucide-react";
import { FAA_FORMS, FAA_FORMS_CATALOG } from "@/lib/faaForms";

export default function FAAFormsLinks({ context = "technical", compact = false }) {
  const forms = FAA_FORMS[context] || FAA_FORMS.technical;
  return (
    <section className="rounded-xl border border-border bg-card p-4" aria-labelledby={`faa-forms-${context}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <h2 id={`faa-forms-${context}`} className="text-xs font-bold text-card-foreground">Official FAA Forms</h2>
        </div>
        <a href={FAA_FORMS_CATALOG} target="_blank" rel="noreferrer" className="text-[11px] font-semibold text-primary hover:underline">
          Full catalog
        </a>
      </div>
      <div className={compact ? "flex flex-wrap gap-2" : "grid gap-2 sm:grid-cols-2"}>
        {forms.map((form) => (
          <a key={form.number} href={form.url} target="_blank" rel="noreferrer" className="flex min-h-11 items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-card-foreground hover:border-primary/40">
            <span className="font-mono font-bold text-primary">{form.number}</span>
            <span className="flex-1">{form.title}</span>
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
          </a>
        ))}
      </div>
    </section>
  );
}