import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { RefreshCw, ShieldCheck } from "lucide-react";
import TwinProviderBlock from "@/components/twin/TwinProviderBlock";
import BrokerAssignPanel from "@/components/twin/BrokerAssignPanel";
import ConfidenceBadge from "@/components/twin/ConfidenceBadge";
import DataConflictAlert from "@/components/twin/DataConflictAlert";

const AMBER = "#f5c242";

export default function DigitalTwin() {
  const { registration } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [passport, setPassport] = useState(null);

  useEffect(() => {
    if (!data?.passportId) { setPassport(null); return; }
    base44.entities.ATIPassport.filter({ id: data.passportId }, "", 1)
      .then((r) => setPassport(r[0] || null))
      .catch(() => setPassport(null));
  }, [data?.passportId]);

  const loadTwin = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("initDigitalTwin", { registration });
      setData(res.data);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Twin lookup failed");
    } finally {
      setLoading(false);
    }
  }, [registration]);

  useEffect(() => { loadTwin(); }, [loadTwin]);

  const p = data?.providers;

  return (
    <div className="min-h-screen" style={{ background: "transparent" }}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] font-black" style={{ color: AMBER }}>
              ATI Verify · Digital Twin
            </p>
            <h1 className="text-2xl md:text-3xl font-black text-[rgba(255,255,255,0.92)] font-mono tracking-wider">
              {registration?.toUpperCase()}
            </h1>
            {passport?.data_confidence && (
              <div className="mt-2">
                <ConfidenceBadge confidence={passport.data_confidence} sourcesMatched={passport.data_sources_matched} />
              </div>
            )}
          </div>
          <button onClick={loadTwin} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-bold disabled:opacity-40"
            style={{ background: "rgba(245,194,66,0.08)", border: "0.5px solid rgba(245,194,66,0.25)", color: AMBER }}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {loading && (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.04)" }} />
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="rounded-xl px-5 py-6 text-center"
            style={{ background: "rgba(226,75,74,0.06)", border: "0.5px solid rgba(226,75,74,0.25)" }}>
            <p className="text-[#e24b4a] font-bold text-sm">{error}</p>
          </div>
        )}

        {data && !loading && (
          <div className="space-y-4">
            {passport?.data_conflict && <DataConflictAlert fields={passport.data_conflict_fields || []} />}
            {/* Federated provider blocks — each has data OR a graceful "unavailable" state */}
            <TwinProviderBlock
              title="FAA Registry"
              status={p?.faa_registry?.status}
              rows={p?.faa_registry?.status === "ok" ? [
                ["Registered Owner", p.faa_registry.owner],
                ["Year", p.faa_registry.year],
                ["Status", p.faa_registry.status_code === "V" ? "Valid" : p.faa_registry.status_code],
              ] : []}
              emptyText="Registry record unavailable"
            />
            <TwinProviderBlock
              title="Engine Specifications"
              status={p?.engine_spec?.status}
              rows={p?.engine_spec?.status === "ok" ? [
                ["Manufacturer", p.engine_spec.manufacturer],
                ["Model", p.engine_spec.model],
                ["TBO", p.engine_spec.tbo_hours ? `${p.engine_spec.tbo_hours} hrs` : "TBO pending manufacturer data"],
              ] : []}
              emptyText="Engine spec not mapped for this aircraft's engine code"
            />
            <TwinProviderBlock
              title="Flight Activity (ADS-B)"
              status={p?.adsb_traffic?.status}
              rows={p?.adsb_traffic?.status === "ok" ? [
                ["Recorded Sightings", p.adsb_traffic.sightings],
                ["Last Seen", p.adsb_traffic.last_seen ? new Date(p.adsb_traffic.last_seen).toLocaleDateString("en-GB") : "—"],
              ] : []}
              emptyText="No ADS-B traffic records observed for this aircraft"
            />
            <TwinProviderBlock
              title="FAA Document Trail"
              status={p?.faa_documents?.status}
              rows={p?.faa_documents?.status === "ok" ? [
                ["Total Filings", p.faa_documents.total_docs],
                ["Bills of Sale", p.faa_documents.bos_count],
              ] : []}
              emptyText="No transactional documents indexed (Bill of Sale, Security Agreements)"
            />
            <TwinProviderBlock
              title="Marketplace Status"
              status={p?.marketplace?.status}
              rows={p?.marketplace?.status === "ok" ? [
                ["For Sale", p.marketplace.for_sale ? "Yes — active listing" : "Not for sale"],
              ] : []}
              emptyText="Not listed for sale — verification-only record"
            />
            <TwinProviderBlock
              title="ABOS Escrow History"
              status={p?.escrow_history?.status}
              rows={p?.escrow_history?.status === "ok" ? [
                ["Transactions", p.escrow_history.count],
              ] : []}
              emptyText="No ABOS escrow transaction history"
            />

            {/* Data gaps */}
            {data.data_gaps?.length > 0 && (
              <div className="rounded-xl px-5 py-4"
                style={{ background: "rgba(245,194,66,0.04)", border: "0.5px solid rgba(245,194,66,0.15)" }}>
                <p className="text-[10px] uppercase tracking-[0.15em] font-black mb-2" style={{ color: AMBER }}>
                  Data Gaps
                </p>
                <ul className="space-y-1">
                  {data.data_gaps.map((g) => (
                    <li key={g} className="text-[12px] text-[rgba(255,255,255,0.5)]">· {g}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Broker assignment */}
            <BrokerAssignPanel registration={data.registration} passportId={data.passportId} />

            <div className="flex items-center gap-2 justify-center pt-2">
              <ShieldCheck className="w-3.5 h-3.5 text-[rgba(255,255,255,0.3)]" />
              <p className="text-[10px] text-[rgba(255,255,255,0.3)]">
                Independent technical verification · not a pre-purchase inspection or sales recommendation
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}