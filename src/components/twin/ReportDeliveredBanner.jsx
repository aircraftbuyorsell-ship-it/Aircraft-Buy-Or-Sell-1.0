import { CheckCircle, Loader2, AlertTriangle, UserPlus } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function ReportDeliveredBanner({ fulfillment }) {
  if (fulfillment.status === "processing") {
    return (
      <div className="rounded-xl px-5 py-4 mb-6 flex items-center gap-3"
        style={{ background: "rgba(245,194,66,0.06)", border: "0.5px solid rgba(245,194,66,0.25)" }}>
        <Loader2 className="w-5 h-5 animate-spin text-[#f5c242]" />
        <div>
          <p className="text-sm font-black text-[rgba(255,255,255,0.9)]">Payment confirmed — generating your report…</p>
          <p className="text-[11px] text-[rgba(255,255,255,0.5)]">The PDF for {fulfillment.registration} will arrive in your inbox shortly.</p>
        </div>
      </div>
    );
  }

  if (fulfillment.status === "delivered") {
    return (
      <div className="rounded-xl px-5 py-4 mb-6"
        style={{ background: "rgba(93,202,165,0.08)", border: "0.5px solid rgba(93,202,165,0.3)" }}>
        <div className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-[#5dcaa5]" />
          <div>
            <p className="text-sm font-black text-[rgba(255,255,255,0.9)]">
              Report delivered to {fulfillment.email}
            </p>
            <p className="text-[11px] text-[rgba(255,255,255,0.5)]">
              Check your inbox (and spam folder) for the {fulfillment.registration} ATI report PDF.
            </p>
          </div>
        </div>
        <button onClick={() => base44.auth.redirectToLogin()}
          className="mt-3 w-full py-2.5 rounded-lg text-[12px] font-bold flex items-center justify-center gap-2"
          style={{ background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.8)" }}>
          <UserPlus className="w-3.5 h-3.5" />
          Create a free account — report history, alerts & buyer tools
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl px-5 py-4 mb-6 flex items-center gap-3"
      style={{ background: "rgba(226,75,74,0.08)", border: "0.5px solid rgba(226,75,74,0.3)" }}>
      <AlertTriangle className="w-5 h-5 text-[#e24b4a]" />
      <div>
        <p className="text-sm font-black text-[rgba(255,255,255,0.9)]">Report delivery issue</p>
        <p className="text-[11px] text-[rgba(255,255,255,0.5)]">
          Your payment was received but delivery hit a snag: {fulfillment.message}. Our team will resend it manually.
        </p>
      </div>
    </div>
  );
}