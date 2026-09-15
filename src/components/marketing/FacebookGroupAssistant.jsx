import { useRef, useState } from "react";
import { Loader2, Search, Copy, CheckCircle2, Download, BookmarkCheck } from "lucide-react";
import useFacebookGroupAssistant from "@/hooks/useFacebookGroupAssistant";
import FacebookGroupPostCard from "@/components/marketing/FacebookGroupPostCard";

function CopyButton({ value, label = "Copy" }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-muted"
      onClick={() => {
        navigator.clipboard.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }}
    >
      {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : label}
    </button>
  );
}

export default function FacebookGroupAssistant() {
  const { text, setText, postRef, setPostRef, result, checking, logging, message, check, logHandled } = useFacebookGroupAssistant();
  const cardRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  const downloadCard = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(cardRef.current, { scale: 2, backgroundColor: null });
      const link = document.createElement("a");
      link.download = `abos-fb-group-card-${(result?.registration || "listing").toLowerCase()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setDownloading(false);
    }
  };

  const headline = result?.registration || (result?.listing?.make ? [result.listing.year, result.listing.make].filter(Boolean).join(" ") : "");
  const subline = result?.registration
    ? "Check aircraft identity, registry status and market data on ABOS."
    : "Check available aircraft intelligence for this listing on ABOS.";

  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-5">
      <div>
        <h2 className="text-base font-bold text-foreground">Facebook Group Assistant</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste a post from Aircraft Buy Or Sell. It detects a registration or a full listing, builds an ABOS link and a
          ready-to-paste comment — nothing is posted automatically.
        </p>
      </div>

      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-foreground">Post text</span>
        <textarea
          rows={4}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="For sale Piper PA-28R-180 N7692J, 1,234 TT, always hangared…"
          className="w-full rounded-md border border-border bg-background p-3 text-sm text-foreground"
        />
      </label>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={check}
          disabled={checking || !text.trim()}
          className="inline-flex items-center gap-2 rounded-md bg-gold px-4 py-2 text-sm font-bold text-charcoal disabled:opacity-50"
        >
          {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {checking ? "Checking…" : "Detect aircraft"}
        </button>
        {message && <span className={`text-sm font-medium ${message.type === "error" ? "text-red-500" : "text-emerald-500"}`}>{message.text}</span>}
      </div>

      {result && result.status === "SKIPPED" && (
        <div className="rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
          No aircraft registration or listing detected — nothing to post. {result.reason ? `(${result.reason})` : ""}
        </div>
      )}

      {result && result.status !== "SKIPPED" && (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_540px]">
          <div className="space-y-3">
            <div className="rounded-md border border-border p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">ABOS link</div>
              <div className="mt-1 flex items-center justify-between gap-2">
                <code className="truncate text-sm text-foreground">{result.destination_url}</code>
                <CopyButton value={result.destination_url} />
              </div>
            </div>

            <label className="block space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Suggested comment</span>
                <CopyButton value={result.comment} label="Copy comment" />
              </div>
              <textarea
                rows={3}
                readOnly
                value={result.comment || ""}
                className="w-full rounded-md border border-border bg-background p-3 text-sm text-foreground"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-semibold text-foreground">Post URL or ID (optional)</span>
              <input
                type="text"
                value={postRef}
                onChange={(event) => setPostRef(event.target.value)}
                placeholder="Paste the FB post link so it isn't suggested again"
                className="w-full rounded-md border border-border bg-background p-2.5 text-sm text-foreground"
              />
            </label>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={downloadCard}
                disabled={downloading}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-50"
              >
                {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Download card (PNG)
              </button>
              <button
                type="button"
                onClick={logHandled}
                disabled={logging}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-50"
              >
                {logging ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookmarkCheck className="h-4 w-4" />}
                Mark as handled
              </button>
            </div>
          </div>

          <div className="mx-auto">
            <FacebookGroupPostCard ref={cardRef} headline={headline} subline={subline} confidence={result.confidence} />
          </div>
        </div>
      )}
    </section>
  );
}
