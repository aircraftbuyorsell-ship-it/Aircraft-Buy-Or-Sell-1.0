import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Briefcase, PenLine } from "lucide-react";
import BrokerAgreementModal from "@/components/twin/BrokerAgreementModal";

const AMBER = "#f5c242";

/**
 * "Assign as Broker" panel — visible to approved brokers on a Digital Twin.
 * Initiates the formal Broker Agreement + e-signature workflow.
 */
export default function BrokerAssignPanel({ registration }) {
  const [broker, setBroker] = useState(null);
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreement, setAgreement] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const me = await base44.auth.me();
        if (!me) { setChecked(true); return; }
        const profiles = await base44.entities.BrokerProfile.filter({ user_id: me.id }, "-created_date", 1);
        if (active) setBroker(profiles[0] || null);
      } catch (_) { /* not logged in */ }
      if (active) setChecked(true);
    })();
    return () => { active = false; };
  }, []);

  if (!checked || !broker || broker.verified_status !== "approved") return null;

  const handleInitiate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("executeBrokerAgreement", {
        action: "initiate",
        registration,
      });
      const detail = await base44.functions.invoke("executeBrokerAgreement", {
        action: "get",
        agreement_id: res.data.agreementId,
      });
      setAgreement(detail.data.agreement);
    } catch (err) {
      setError(err?.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="rounded-xl px-4 sm:px-5 py-4"
        style={{ background: "rgba(245,194,66,0.05)", border: "0.5px solid rgba(245,194,66,0.25)" }}>
        <div className="flex items-center gap-2 mb-1">
          <Briefcase className="w-4 h-4" style={{ color: AMBER }} />
          <p className="text-[11px] uppercase tracking-[0.15em] font-black" style={{ color: AMBER }}>
            Broker Assignment
          </p>
        </div>
        <p className="text-[12px] text-muted-foreground leading-relaxed mb-3">
          As a verified ABOS broker ({broker.broker_id}), you can initiate a formal Broker Agreement
          for this aircraft. Both parties sign electronically; on execution you gain managed access
          to this Digital Twin and may activate a marketplace listing.
        </p>
        {error && <p className="text-[12px] text-destructive mb-2">{error}</p>}
        <button onClick={handleInitiate} disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-black disabled:opacity-40"
          style={{ background: AMBER, color: "#0B1220" }}>
          <PenLine className="w-4 h-4" />
          {loading ? "Generating agreement…" : "Assign as Broker"}
        </button>
      </div>

      {agreement && (
        <BrokerAgreementModal
          agreement={agreement}
          onClose={() => setAgreement(null)}
          onSigned={() => {}}
        />
      )}
    </>
  );
}