import { useState } from "react";
import { ClipboardPaste, FileText, Paperclip, Sparkles, Loader2 } from "lucide-react";
import { FIELD_CLASS } from "@/lib/aircraftInput";

/**
 * Unified "paste listing text + upload file + auto-fill" block shared across
 * all aircraft-input pages so the third and fourth flow steps look identical.
 *
 * Props:
 *  - listingText / onListingTextChange
 *  - files / onFilesChange         (array of File)
 *  - onAutoFill                    () => Promise — runs shared extractAircraftSpecs + merge
 *  - autoFilling                   (bool)
 */
export default function AircraftExtraInput({
  listingText,
  onListingTextChange,
  files,
  onFilesChange,
  onAutoFill,
  autoFilling = false,
}) {
  const [pasteError, setPasteError] = useState("");
  const hasContent = !!(listingText && listingText.trim()) || (files && files.length > 0);

  const paste = async () => {
    setPasteError("");
    try {
      const text = await navigator.clipboard.readText();
      if (text) onListingTextChange?.(text);
    } catch (_) {
      setPasteError("Clipboard access was blocked. Paste the listing directly into the field.");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#D4A017]">Paste or upload</p>
        <h3 className="mt-1 text-sm font-black tracking-tight text-foreground">Listing text &amp; spec sheet</h3>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Paste the listing or attach a PDF/spec sheet — specs auto-extract into the fields above. Use any combination.
        </p>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wide text-muted-foreground inline-flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Listing text
          </span>
          <button
            type="button"
            onClick={paste}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-muted"
          >
            <ClipboardPaste className="h-3.5 w-3.5" /> Paste
          </button>
        </div>
        <textarea
          className={`${FIELD_CLASS} min-h-[120px] resize-y`}
          value={listingText || ""}
          onChange={(e) => onListingTextChange?.(e.target.value)}
          placeholder="Paste the full aircraft listing text — make, model, year, hours, engine, avionics, asking price…"
        />
        {pasteError && <p role="alert" className="text-xs text-amber-500">{pasteError}</p>}
      </div>

      <label className="space-y-1.5 block">
        <span className="text-xs font-black uppercase tracking-wide text-muted-foreground inline-flex items-center gap-1.5">
          <Paperclip className="h-3.5 w-3.5" /> Attach PDF / doc / image
        </span>
        <input
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
          onChange={(e) => onFilesChange?.(Array.from(e.target.files || []))}
          className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-[#D4A017]/10 file:px-3 file:py-2 file:text-xs file:font-black file:text-[#A67C00] hover:file:bg-[#D4A017]/20 cursor-pointer"
        />
        {files && files.length > 0 && (
          <ul className="mt-1 space-y-1">
            {files.map((f, i) => (
              <li key={i} className="text-xs text-muted-foreground truncate">
                • {f.name} <span className="text-muted-foreground/60">({(f.size / 1024).toFixed(0)} KB)</span>
              </li>
            ))}
          </ul>
        )}
      </label>

      {onAutoFill && (
        <button
          type="button"
          onClick={onAutoFill}
          disabled={!hasContent || autoFilling}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#D4A017]/30 bg-[#D4A017]/10 px-4 py-2.5 text-xs font-black text-[#A67C00] transition hover:bg-[#D4A017]/20 disabled:opacity-50"
        >
          {autoFilling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {autoFilling ? "Extracting specs…" : "Auto-fill specs from text & files"}
        </button>
      )}
    </div>
  );
}