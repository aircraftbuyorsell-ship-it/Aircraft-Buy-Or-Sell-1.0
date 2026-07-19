import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { FileSignature, Loader2, Link2, Unlink } from "lucide-react";
import PurchaseAgreementForm from "@/components/docusign/PurchaseAgreementForm";
import EnvelopeList from "@/components/docusign/EnvelopeList";

const CONNECTOR_ID = "6a5c22a5e51e055fad1d605f";

export default function DocusignAgreements() {
  const [user, setUser] = useState(null);
  const [envelopes, setEnvelopes] = useState([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchEnvelopes = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("docusignAgreements", { action: "list" });
      setEnvelopes(res.data.envelopes || []);
      setConnected(true);
    } catch {
      setConnected(false);
      setEnvelopes([]);
    }
  }, []);

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (authed) => {
      if (authed) {
        const me = await base44.auth.me();
        setUser(me);
        await fetchEnvelopes();
      }
      setLoading(false);
    });
  }, [fetchEnvelopes]);

  const handleConnect = async () => {
    const url = await base44.connectors.connectAppUser(CONNECTOR_ID);
    const popup = window.open(url, "_blank");
    const timer = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(timer);
        fetchEnvelopes();
      }
    }, 500);
  };

  const handleDisconnect = async () => {
    await base44.connectors.disconnectAppUser(CONNECTOR_ID);
    setConnected(false);
    setEnvelopes([]);
  };

  const handleSend = async (formData) => {
    setSending(true);
    try {
      await base44.functions.invoke("docusignAgreements", { action: "send", ...formData });
      await fetchEnvelopes();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.response?.data?.error || e.message || "Failed to send" };
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-5 h-5 animate-spin text-[#f5c242]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <FileSignature className="w-10 h-10 text-[#f5c242] mb-3" />
        <h2 className="text-lg font-bold text-white/90 mb-2">Sign in required</h2>
        <p className="text-sm text-white/50 mb-4 max-w-sm">
          Connect your DocuSign account to send aircraft purchase agreements for eSignature.
        </p>
        <button
          onClick={() => base44.auth.redirectToLogin()}
          className="px-4 py-2 rounded-lg text-sm font-bold"
          style={{ background: "#f5c242", color: "#04060a" }}
        >
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "transparent", color: "rgba(255,255,255,0.90)" }}>
      <div className="px-4 md:px-8 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(245,194,66,0.10)", border: "0.5px solid rgba(245,194,66,0.22)" }}
          >
            <FileSignature size={20} className="text-[#f5c242]" />
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#f5c242]">DocuSign Integration</p>
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-white/90">Aircraft Purchase Agreements</h1>
          </div>
        </div>
        <p className="text-[13px] text-white/50 max-w-2xl">
          Send aircraft purchase agreements for eSignature via your connected DocuSign account.
          Each signer receives an email from DocuSign to review and sign.
        </p>
      </div>

      {!connected ? (
        <div className="px-4 md:px-8 pb-10">
          <div
            className="rounded-xl p-8 text-center"
            style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.08)" }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(245,194,66,0.08)" }}
            >
              <Link2 className="w-7 h-7 text-[#f5c242]" />
            </div>
            <h2 className="text-base font-bold text-white/90 mb-1.5">Connect your DocuSign account</h2>
            <p className="text-[12px] text-white/50 max-w-md mx-auto mb-5">
              Connect your DocuSign account to generate and send aircraft purchase agreements for
              legally binding eSignature.
            </p>
            <button
              onClick={handleConnect}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-opacity hover:opacity-90"
              style={{ background: "#f5c242", color: "#04060a" }}
            >
              <Link2 className="w-4 h-4" /> Connect DocuSign
            </button>
          </div>
        </div>
      ) : (
        <div className="px-4 md:px-8 pb-10 grid lg:grid-cols-[1fr_380px] gap-6">
          <EnvelopeList envelopes={envelopes} onRefresh={fetchEnvelopes} />
          <div className="space-y-3">
            <div
              className="flex items-center justify-between px-3 py-2 rounded-lg"
              style={{ background: "rgba(93,202,165,0.06)", border: "0.5px solid rgba(93,202,165,0.20)" }}
            >
              <span className="text-[11px] font-semibold text-[#5dcaa5] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5dcaa5] animate-pulse" />
                DocuSign Connected
              </span>
              <button
                onClick={handleDisconnect}
                className="text-[10px] text-white/40 hover:text-white/70 flex items-center gap-1"
              >
                <Unlink className="w-3 h-3" /> Disconnect
              </button>
            </div>
            <PurchaseAgreementForm onSend={handleSend} sending={sending} />
          </div>
        </div>
      )}
    </div>
  );
}