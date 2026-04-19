import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, Trash2, X, Loader2, CheckCircle2 } from "lucide-react";

export default function DeleteAccountCard({ alreadyRequested, onRequested }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(alreadyRequested);
  const [error, setError] = useState(null);

  const canConfirm = confirmText.trim().toUpperCase() === "DELETE";

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      await base44.functions.invoke("requestAccountDeletion", { reason });
      setDone(true);
      onRequested?.();
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="bg-white border border-[rgba(15,122,86,0.25)] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-black/[0.06] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#0F7A56]" />
          <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#0F7A56]">Deletion Requested</p>
        </div>
        <div className="px-5 py-5">
          <p className="text-sm text-[#1A1814] leading-relaxed">
            Your account deletion request has been received. Our team will process it within <b>7 business days</b>
            and send you a confirmation email once complete.
          </p>
          <p className="text-[12px] text-[#6B6560] mt-2">
            Changed your mind? Reply to the confirmation email and we'll cancel the request.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white border border-[rgba(192,57,43,0.2)] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-black/[0.06]">
          <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#C0392B]">Danger Zone</p>
        </div>
        <div className="px-5 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div>
              <p className="text-sm font-bold text-[#1A1814]">Delete your account</p>
              <p className="text-[12px] text-[#6B6560] mt-0.5 max-w-md">
                Permanently request deletion of your ABOS account and associated data. This cannot be undone.
              </p>
            </div>
            <button
              onClick={() => setShowConfirm(true)}
              className="flex items-center gap-2 bg-white hover:bg-[#C0392B] hover:text-white border border-[#C0392B] text-[#C0392B] font-bold px-5 py-2.5 rounded-xl text-sm transition-colors shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation modal */}
      {showConfirm && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[70]" onClick={() => !loading && setShowConfirm(false)} />
          <div className="fixed inset-0 z-[71] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
            <div className="pointer-events-auto w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl safe-bottom overflow-hidden">
              <div className="flex items-start justify-between p-5 border-b border-black/[0.06]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[rgba(192,57,43,0.1)] flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-[#C0392B]" />
                  </div>
                  <h3 className="text-base font-black text-[#1A1814] uppercase tracking-tight">Delete account?</h3>
                </div>
                <button
                  onClick={() => !loading && setShowConfirm(false)}
                  disabled={loading}
                  className="text-[#6B6560] hover:text-[#1A1814] touch-target-compact"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <p className="text-sm text-[#1A1814] leading-relaxed">
                  This will request permanent deletion of your account. You'll lose access to all your listings,
                  ATI passports, credits, and transaction history.
                </p>

                <div>
                  <label className="text-[10px] uppercase tracking-wider text-[#6B6560] font-semibold block mb-1">
                    Why are you leaving? (optional)
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={2}
                    placeholder="Help us improve…"
                    className="w-full px-3 py-2 bg-[#F7F4EF] border border-black/10 rounded-xl text-sm focus:outline-none focus:border-[#C0392B]"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider text-[#6B6560] font-semibold block mb-1">
                    Type <span className="font-black text-[#C0392B]">DELETE</span> to confirm
                  </label>
                  <input
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="DELETE"
                    className="w-full px-3 py-2.5 bg-white border border-black/10 rounded-xl text-sm font-mono focus:outline-none focus:border-[#C0392B]"
                  />
                </div>

                {error && (
                  <p className="text-[12px] text-[#C0392B]">{error}</p>
                )}

                <div className="flex flex-col-reverse sm:flex-row gap-2 pt-1">
                  <button
                    onClick={() => setShowConfirm(false)}
                    disabled={loading}
                    className="flex-1 bg-white border border-black/10 hover:bg-[#F7F4EF] text-[#1A1814] font-bold text-sm py-3 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submit}
                    disabled={!canConfirm || loading}
                    className="flex-1 bg-[#C0392B] hover:bg-[#A5342A] disabled:opacity-40 text-white font-bold text-sm py-3 rounded-xl flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    {loading ? "Requesting…" : "Request deletion"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}