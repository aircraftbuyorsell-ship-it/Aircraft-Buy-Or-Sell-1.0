import { useState } from "react";
import { Coins, CalendarDays, Ticket, Check, Loader2, Sparkles, X } from "lucide-react";

const GIFT_ICONS = {
  bonus_tokens: Coins,
  extended_trial: CalendarDays,
  discount_voucher: Ticket,
};

export default function WelcomeGiftModal({ giftOptions, slotsLeft, onSelect, onClose }) {
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null);

  const handleConfirm = async () => {
    if (!selected || loading) return;
    setLoading(true);
    try {
      const result = await onSelect(selected);
      setDone(result);
      setTimeout(() => onClose(), 2500);
    } catch (e) {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15">
            <Check className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Pro Trial Activated!</h2>
          <p className="max-w-xs text-sm text-muted-foreground">
            Your Pro access is live. {done.voucherCode ? `Voucher: ${done.voucherCode}` : "Enjoy your investment gift!"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Choose Your Investment Gift</h2>
            </div>
            <p className="text-[13px] text-muted-foreground">
              You're one of the first 50 members — pick your welcome bonus:
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2.5">
          {giftOptions?.map((gift) => {
            const Icon = GIFT_ICONS[gift.id] || Sparkles;
            const isSelected = selected === gift.id;
            return (
              <button
                key={gift.id}
                onClick={() => !loading && setSelected(gift.id)}
                className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
                  isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                }`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                  isSelected ? "bg-primary/15" : "bg-muted"
                }`}>
                  <Icon className={`h-5 w-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-bold text-foreground">{gift.title}</p>
                  <p className="text-[12px] text-muted-foreground">{gift.description}</p>
                </div>
                {isSelected && <Check className="mt-1 h-4 w-4 text-primary" />}
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-lg border border-border px-4 py-2.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-muted"
          >
            Maybe later
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selected || loading}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-foreground px-4 py-2.5 text-[13px] font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Activate Pro Trial
          </button>
        </div>
      </div>
    </div>
  );
}