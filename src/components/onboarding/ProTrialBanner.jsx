import { useState } from "react";
import { Gift, Copy, Check, Sparkles, X, Coins, CalendarDays, Ticket } from "lucide-react";

const GIFT_LABELS = {
  bonus_tokens: { label: "200 Bonus Tokens", icon: Coins },
  extended_trial: { label: "45-Day Extended Pro", icon: CalendarDays },
  discount_voucher: { label: "€25 Voucher", icon: Ticket },
};

export default function ProTrialBanner({ trial }) {
  const [copied, setCopied] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (!trial?.ok || dismissed) return null;

  const referralUrl = trial.referralSlug
    ? `${window.location.origin}/?ref=${trial.referralSlug}`
    : null;

  const endDate = trial.trialEndDate ? new Date(trial.trialEndDate) : null;
  const daysLeft = endDate ? Math.max(0, Math.ceil((endDate - new Date()) / 86400000)) : 30;

  const gift = GIFT_LABELS[trial.giftChoice] || GIFT_LABELS.bonus_tokens;
  const GiftIcon = gift.icon;

  const handleCopy = () => {
    if (!referralUrl) return;
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 sm:px-6 sm:py-5">
      <button onClick={() => setDismissed(true)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
        <X className="h-4 w-4" />
      </button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-foreground">Pro Trial Active</h3>
            <p className="text-[13px] text-muted-foreground">
              {daysLeft} days remaining · {trial.bonusTokens} tokens
            </p>
            <div className="mt-1 flex items-center gap-1.5">
              <GiftIcon className="h-3 w-3 text-primary" />
              <span className="text-[11px] font-medium text-muted-foreground">Gift: {gift.label}</span>
              {trial.voucherCode && (
                <code className="ml-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-foreground">{trial.voucherCode}</code>
              )}
            </div>
          </div>
        </div>

        {referralUrl && (
          <div className="flex items-center gap-2">
            <div className="flex max-w-[220px] items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
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