import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, PenLine, FileText, CheckCircle } from "lucide-react";

const AMBER = "#f5c242";

/**
 * DocuSign-style in-app e-signature flow for the ABOS Broker Agreement.
 * step: "review" (PDF preview + terms) → "sign" (typed signature) → "done"
 */
export default function BrokerAgreementModal({ agreement, onClose, onSigned }) {
  const [step, setStep] = useState("review");
  const [signedName, setSignedName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleSign = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("executeBrokerAgreement", {
        action: "sign",
        agreement_id: agreement.id,
        signed_name: signedName.trim(),
      });
      setResult(res.data);
      setStep("done");
      onSigned?.(res.data);
    } catch (err) {
      setError(err?.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div className="w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl animate-slide-up"
        style={{ background: "#111827", border: "0.5px solid rgba(245,194,66,0.25)" }}
        onClick={(e) => e.stopPropagation()}>

        <div className="px-5 py-4 flex items-center justify-between sticky top-0"
          style={{ background: "#111827", borderBottom: "0.5px solid rgba(255,255,255,0.08)" }}>
          <div>
            <p className="text-[9px] uppercase tracking-[0.2em] font-black" style={{ color: AMBER }}>
              ABOS Broker Agreement · {agreement.registration}
            </p>
            <h3 className="text-lg font-black text-[rgba(255,255,255,0.92)]">
              {step === "done" ? "Signature recorded" : "Review & Sign"}
            </h3>
          </div>
          <button onClick={onClose} className="text-[rgba(255,255,255,0.4)] p-2" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-5">
          {step === "review" && (
            <>
              <div className="rounded-xl px-4 py-4 space-y-2 text-[13px]"
                style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
                <Term label="Aircraft" value={agreement.aircraft_label || agreement.registration} />
                <Term label="Broker" value={`${agreement.broker_name} (${agreement.broker_license || "—"})`} />
                <Term label="Owner" value={agreement.owner_name || "—"} />
                <Term label="Exclusivity" value={`${agreement.exclusivity_days || 90} days`} />
                <Term label="Commission" value={`${agreement.commission_pct || 2}% of gross sale price`} />
              </div>

              {agreement.pdf_url && (
                <a href={agreement.pdf_url} target="_blank" rel="noreferrer"
                  className="mt-3 flex items-center gap-2 text-[12px] font-bold text-[#4e8ef7]">
                  <FileText className="w-4 h-4" /> Open full agreement PDF
                </a>
              )}

              <button onClick={() => setStep("sign")}
                className="w-full mt-5 py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2"
                style={{ background: AMBER, color: "#0B1220" }}>
                <PenLine className="w-4 h-4" /> Proceed to signature
              </button>
            </>
          )}

          {step === "sign" && (
            <>
              <p className="text-[12px] text-[rgba(255,255,255,0.55)] leading-relaxed mb-4">
                By typing your full legal name below, you agree that this constitutes your binding
                electronic signature under eIDAS (EU) 910/2014 and the U.S. ESIGN Act. Your platform
                User ID and a UTC timestamp will be recorded in the audit log.
              </p>
              <label className="text-[11px] uppercase tracking-wider font-bold text-[rgba(255,255,255,0.5)] block mb-2">
                Full legal name
              </label>
              <input value={signedName} onChange={(e) => setSignedName(e.target.value)}
                placeholder="Type your full name"
                className="w-full px-4 py-3.5 rounded-xl text-lg italic"
                style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(245,194,66,0.35)", fontFamily: "'Courier Prime', monospace" }} />
              <div className="mt-2 pb-1" style={{ borderBottom: "1px solid rgba(255,255,255,0.25)" }}>
                <p className="text-[9px] uppercase tracking-wider text-[rgba(255,255,255,0.3)]">
                  Signature line · {new Date().toLocaleDateString("en-GB")}
                </p>
              </div>

              {error && <p className="text-[12px] text-[#e24b4a] mt-3">{error}</p>}

              <button onClick={handleSign} disabled={loading || signedName.trim().length < 3}
                className="w-full mt-5 py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-40"
                style={{ background: AMBER, color: "#0B1220" }}>
                <PenLine className="w-4 h-4" />
                {loading ? "Recording signature…" : "Sign Agreement"}
              </button>
            </>
          )}

          {step === "done" && (
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 text-[#5dcaa5] mx-auto mb-3" />
              <p className="text-sm font-black text-[rgba(255,255,255,0.9)]">
                {result?.fully_signed
                  ? "Agreement fully executed — you now have broker access to this Digital Twin."
                  : "Your signature is recorded. Awaiting the other party's signature."}
              </p>
              {result?.pdf_url && (
                <a href={result.pdf_url} target="_blank" rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-[12px] font-bold text-[#4e8ef7]">
                  <FileText className="w-4 h-4" /> Download signed PDF
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Term({ label, value }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-[rgba(255,255,255,0.4)] text-[11px] uppercase tracking-wider shrink-0">{label}</span>
      <span className="text-[rgba(255,255,255,0.85)] font-semibold text-right">{value}</span>
    </div>
  );
}