import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Mail } from "lucide-react";

const AMBER = "#f5c242";

export default function ReportEmailModal({ registration, onClose }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("reportCheckout", {
        registration,
        email: email.trim(),
        returnUrl: window.location.origin + window.location.pathname,
      });
      if (res.data?.checkoutUrl) {
        window.location.href = res.data.checkoutUrl;
      } else {
        setError("Could not start checkout. Please try again.");
        setLoading(false);
      }
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={onClose}>
      <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden animate-slide-up"
        style={{ background: "#111827", border: "0.5px solid rgba(245,194,66,0.25)" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 flex items-center justify-between"
          style={{ borderBottom: "0.5px solid rgba(255,255,255,0.08)" }}>
          <div>
            <p className="text-[9px] uppercase tracking-[0.2em] font-black" style={{ color: AMBER }}>
              Full ATI Report · {registration}
            </p>
            <h3 className="text-lg font-black text-[rgba(255,255,255,0.92)]">Where should we send it?</h3>
          </div>
          <button onClick={onClose} className="text-[rgba(255,255,255,0.4)] p-2" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5">
          <label className="text-[11px] uppercase tracking-wider font-bold text-[rgba(255,255,255,0.5)] block mb-2">
            Your email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-4 py-3.5 rounded-xl text-base"
            style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.15)" }}
          />

          {error && <p className="text-[12px] text-[#e24b4a] mt-3">{error}</p>}

          <button type="submit" disabled={loading || !email.trim()}
            className="w-full mt-4 py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-40"
            style={{ background: AMBER, color: "#0B1220" }}>
            <Mail className="w-4 h-4" />
            {loading ? "Preparing checkout…" : "Continue to payment — €29"}
          </button>

          <p className="text-[10px] text-[rgba(255,255,255,0.35)] mt-3 leading-relaxed text-center">
            The PDF report is delivered to this email after payment. Secure checkout by Stripe.
            You can optionally create a free ABOS account afterwards for report history and alerts.
          </p>
        </form>
      </div>
    </div>
  );
}