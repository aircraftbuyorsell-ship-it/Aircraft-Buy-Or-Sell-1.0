import { useState } from "react";
import { ClipboardPaste } from "lucide-react";

export default function ListingTextPaste({ value, onChange }) {
  const [pasteError, setPasteError] = useState("");
  const paste = async () => {
    setPasteError("");
    try {
      const text = await navigator.clipboard.readText();
      if (text) onChange(text);
    } catch (_) {
      setPasteError("Clipboard access was blocked. Paste the listing directly into the field.");
    }
  };
  return (
    <section className="space-y-3" aria-labelledby="listing-text-title">
      <div className="flex items-start justify-between gap-3">
        <div><h2 id="listing-text-title" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">3. Add Listing Text</h2><p className="mt-1 text-sm text-muted-foreground">Recommended: more detail produces a more useful transparency score.</p></div>
        <button type="button" onClick={paste} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><ClipboardPaste className="h-4 w-4" />Paste</button>
      </div>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={7} placeholder="Paste the full aircraft listing, logs, maintenance, avionics and condition details here…" className="w-full rounded-lg border border-border bg-background px-4 py-3 text-base leading-6 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
      {pasteError && <p role="alert" className="text-sm text-amber-400">{pasteError}</p>}
    </section>
  );
}