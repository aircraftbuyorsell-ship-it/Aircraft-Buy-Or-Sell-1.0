import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { ShieldCheck, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function WithdrawalCard() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const requestRefund = async () => {
    setConfirmOpen(false);
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("stripeRefundWithdrawal", {});
      setResult(res.data);
    } catch (e) {
      setError(e?.response?.data?.error || "Refund request failed. Please contact support.");
    }
    setLoading(false);
  };

  return (
    <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
      <div className="flex items-center gap-2 mb-2">
        <ShieldCheck className="w-4 h-4 text-[#5dcaa5]" />
        <p className="text-xs font-black text-[rgba(255,255,255,0.90)] uppercase tracking-wide">14-Day Right of Withdrawal</p>
      </div>
      <p className="text-xs text-[rgba(255,255,255,0.60)] leading-relaxed">
        EU consumers may withdraw from an online purchase within 14 days without giving any reason (Directive 2011/83/EU).
        All eligible payments from the last 14 days will be refunded in full and any active subscription cancelled immediately.
      </p>

      {result?.success ? (
        <div className="mt-3 flex items-start gap-2 text-[#5dcaa5] text-xs rounded-xl px-3 py-2.5"
          style={{ background: "rgba(93,202,165,0.06)", border: "0.5px solid rgba(93,202,165,0.20)" }}>
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Refund issued for {result.refunded_count} payment(s)
            {result.totals?.map(t => ` — ${t.amount.toLocaleString()} ${t.currency}`).join(",")}.
            Funds arrive in 5–10 business days.
          </span>
        </div>
      ) : (
        <>
          <button onClick={() => setConfirmOpen(true)} disabled={loading}
            className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-[#5dcaa5] border border-[rgba(93,202,165,0.25)] hover:bg-[rgba(93,202,165,0.06)] transition-all disabled:opacity-50">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Withdraw & Request Refund"}
          </button>
          {error && (
            <p className="mt-2 flex items-start gap-1.5 text-[11px] text-[#e24b4a]">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {error}
            </p>
          )}
        </>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="rounded-2xl bg-[rgba(13,17,23,0.98)] border border-[rgba(255,255,255,0.08)] max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-base font-black">
              <ShieldCheck className="w-5 h-5 text-[#5dcaa5]" /> Withdraw from Purchase?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-[rgba(255,255,255,0.60)]">
              All payments from the last 14 days will be refunded in full, active subscriptions cancelled immediately,
              and any credits granted by refunded purchases removed from your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl text-sm font-semibold">Keep My Purchase</AlertDialogCancel>
            <AlertDialogAction onClick={requestRefund}
              className="rounded-xl bg-[#5dcaa5] hover:bg-[#4bb894] text-[#04060a] text-sm font-bold">
              Yes, Refund Me
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}