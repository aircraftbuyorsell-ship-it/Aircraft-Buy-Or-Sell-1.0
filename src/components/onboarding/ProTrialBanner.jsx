import { useState } from "react";
import { Gift, Copy, Check, Sparkles, X } from "lucide-react";

export default function ProTrialBanner({ trial }) {
  const [copied, setCopied] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (!trial?.ok || dismissed) return null;

  const referralUrl = trial.referralSlug
    ? `${window.location.origin}/?ref=${trial.referralSlug}`
    : null;

  const endDate = trial.trialEndDate ? new Date(trial.trialEndDate) : null;
  const daysLeft = endDate
    ? Math.max(0, Math.ceil((endDate - new Date()) / 86400000))
    : 30;

  const handleCopy = () => {
    if (!referralUrl) return;
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 sm:px-6 sm:py-5">
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-3 text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-foreground">
              {trial.alreadyGranted ? "Your Pro Trial is Active" : "Welcome — 30 Days of Pro, Free"}
            </h3>
            <p className="text-[13px] text-muted-foreground">
              {daysLeft} days remaining · {trial.bonusTokens} bonus tokens included
            </p>
          </div>
        </div>

        {referralUrl && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 max-w-[220px]">
              <Gift className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="truncate text-[11px] font-mono text-muted-foreground">{referralUrl}</span>
            </div>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-2 text-[12px] font-bold text-background transition-opacity hover:opacity-90"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}