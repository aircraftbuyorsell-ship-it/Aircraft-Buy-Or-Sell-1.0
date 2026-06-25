import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Upload, FileText, RefreshCw, Zap, CheckCircle, FileCheck2, ExternalLink, Calendar } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { ESCROW_STATUS, STATUS_FLOW, formatMoney } from "@/lib/escrow";
import EscrowStatusBadge from "./EscrowStatusBadge";
import StatusStepper from "./StatusStepper";
import HustleContractModal from "./HustleContractModal";

const W1 = "rgba(255,255,255,0.90)";
const W2 = "rgba(255,255,255,0.60)";
const W3 = "rgba(255,255,255,0.35)";
const BORDER = "rgba(255,255,255,0.08)";
const AMBER = "#f5c242";
const TEAL = "#5dcaa5";
const RED = "#e24b4a";
const CARD = "rgba(255,255,255,0.04)";

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-start gap-2 py-2 last:border-0" style={{ borderBottom: `0.5px solid ${BORDER}` }}>
      <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: W3 }}>{label}</span>
      <span className="text-[13px] font-medium text-right" style={{ color: W1 }}>{value || "—"}</span>
    </div>
  );
}

export default function EscrowDrawer({ tx, onClose }) {
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [showContract, setShowContract] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [creatingExternal, setCreatingExternal] = useState(false);
  const [calendarSyncing, setCalendarSyncing] = useState(false);
  const [calendarMsg, setCalendarMsg] = useState(null);
  const [inspectionDate, setInspectionDate] = useState(tx.inspection_date || "");
  const [closingDeadline, setClosingDeadline] = useState(tx.closing_deadline || "");
  const [err, setErr] = useState(null);
  const fileInput = useRef(null);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.EscrowTransaction.update(tx.id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["escrow-transactions"] }),
  });

  if (!tx) return null;

  const handleUpload = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true); setErr(null);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: f });
      await updateMutation.mutateAsync({ proof_of_funds_url: file_url, proof_of_funds_name: f.name });
    } catch (e) { setErr(e.message); }
    setUploading(false);
  };

  const handleStatusChange = (newStatus) => {
    updateMutation.mutate({ status: newStatus, closed_at: newStatus === "closed" ? new Date().toISOString() : tx.closed_at });
  };

  const handleCreateOnEscrowCom = async () => {
    setCreatingExternal(true); setErr(null);
    try {
      const res = await base44.functions.invoke("escrowSync", { action: "create", transaction_id: tx.id });
      if (res?.data?.error) throw new Error(res.data.error);
      qc.invalidateQueries({ queryKey: ["escrow-transactions"] });
    } catch (e) { setErr(e.message); }
    setCreatingExternal(false);
  };

  const handleSync = async () => {
    setSyncing(true); setErr(null);
    try {
      const res = await base44.functions.invoke("escrowSync", { action: "sync", transaction_id: tx.id });
      if (res?.data?.error) throw new Error(res.data.error);
      qc.invalidateQueries({ queryKey: ["escrow-transactions"] });
    } catch (e) { setErr(e.message); }
    setSyncing(false);
  };

  const handleSaveDates = async () => {
    setErr(null);
    try {
      await updateMutation.mutateAsync({ inspection_date: inspectionDate || null, closing_deadline: closingDeadline || null });
      qc.invalidateQueries({ queryKey: ["escrow-transactions"] });
    } catch (e) { setErr(e.message); }
  };

  const handleSyncToCalendar = async () => {
    setCalendarSyncing(true); setCalendarMsg(null); setErr(null);
    try {
      if (inspectionDate !== (tx.inspection_date || "") || closingDeadline !== (tx.closing_deadline || "")) {
        await updateMutation.mutateAsync({ inspection_date: inspectionDate || null, closing_deadline: closingDeadline || null });
      }
      const res = await base44.functions.invoke("syncEscrowToCalendar", { transaction_id: tx.id });
      if (res?.data?.error) throw new Error(res.data.error);
      setCalendarMsg(res.data.message || "Synced to Google Calendar");
      qc.invalidateQueries({ queryKey: ["escrow-transactions"] });
    } catch (e) { setErr(e.message); }
    setCalendarSyncing(false);
  };

  const cardStyle = { background: CARD, border: `0.5px solid ${BORDER}` };
  const inputStyle = { background: CARD, border: `0.5px solid ${BORDER}`, color: W1 };

  return (
    <>
      <div className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose} />
      <div className="fixed top-0 right-0 bottom-0 w-full max-w-xl z-50 shadow-2xl overflow-y-auto" style={{ background: "rgba(4,6,10,0.98)" }}>
        <div className="sticky top-0 px-6 py-4 flex items-center justify-between z-10" style={{ background: "rgba(4,6,10,0.95)", borderBottom: `0.5px solid ${BORDER}`, backdropFilter: "blur(16px)" }}>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.15em] font-semibold" style={{ color: AMBER }}>Escrow · {tx.escrow_provider === "escrow_com" ? "Escrow.com" : "Internal"}</p>
            <h2 className="text-lg font-black truncate" style={{ color: W1 }}>{tx.aircraft_label || "Transaction"}</h2>
          </div>
          <button onClick={onClose} className="shrink-0" style={{ color: W3 }}><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 md:p-6 space-y-4">
          {err && (
            <div className="text-sm rounded-xl px-4 py-2.5" style={{ background: "rgba(226,75,74,0.08)", border: "0.5px solid rgba(226,75,74,0.22)", color: RED }}>
              {err}
            </div>
          )}

          <StatusStepper currentStatus={tx.status} />

          <div className="rounded-2xl p-5" style={cardStyle}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold" style={{ color: AMBER }}>Update Status</p>
              <EscrowStatusBadge status={tx.status} size="lg" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_FLOW.map(s => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  disabled={tx.status === s}
                  className="text-[10px] uppercase tracking-wider font-bold px-2.5 py-1.5 rounded-lg border transition-opacity"
                  style={tx.status === s ? { background: AMBER, color: "#04060a", border: `0.5px solid ${AMBER}` } : { background: "transparent", color: W2, borderColor: BORDER }}
                >
                  {ESCROW_STATUS[s].label}
                </button>
              ))}
              <button onClick={() => handleStatusChange("cancelled")} className="text-[10px] uppercase tracking-wider font-bold px-2.5 py-1.5 rounded-lg border" style={{ background: "rgba(226,75,74,0.06)", color: RED, borderColor: "rgba(226,75,74,0.22)" }}>Cancel</button>
              <button onClick={() => handleStatusChange("disputed")} className="text-[10px] uppercase tracking-wider font-bold px-2.5 py-1.5 rounded-lg border" style={{ background: "rgba(226,75,74,0.06)", color: RED, borderColor: "rgba(226,75,74,0.22)" }}>Dispute</button>
            </div>
          </div>

          <div className="rounded-2xl p-5" style={{ background: "rgba(78,142,247,0.06)", border: "0.5px solid rgba(78,142,247,0.20)" }}>
            <p className="text-[10px] uppercase tracking-[0.15em] font-bold mb-3" style={{ color: AMBER }}>Transparent Financials</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-[9px] uppercase font-semibold" style={{ color: "rgba(255,255,255,0.50)" }}>Sale</p>
                <p className="text-lg font-black" style={{ color: W1 }}>{formatMoney(tx.sale_amount, tx.currency)}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase font-semibold" style={{ color: "rgba(255,255,255,0.50)" }}>Fee ({tx.finders_fee_pct || 0}%)</p>
                <p className="text-lg font-black" style={{ color: AMBER }}>{formatMoney(tx.finders_fee_amount, tx.currency)}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase font-semibold" style={{ color: "rgba(255,255,255,0.50)" }}>Seller Net</p>
                <p className="text-lg font-black" style={{ color: W1 }}>{formatMoney(tx.seller_net, tx.currency)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl p-5" style={cardStyle}>
            <p className="text-[10px] uppercase tracking-[0.15em] font-semibold mb-2" style={{ color: AMBER }}>Parties</p>
            <Row label="Buyer" value={tx.buyer_name ? "●●●●● (verified)" : "—"} />
            <Row label="Seller" value={tx.seller_name ? "●●●●● (verified)" : "—"} />
            <Row label="Broker / Finder" value={tx.broker_name ? "●●●●● (verified)" : "—"} />
            <Row label="Inspection Period" value={`${tx.inspection_period_days || 3} days`} />
          </div>

          <div className="rounded-2xl p-5" style={cardStyle}>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4" style={{ color: AMBER }} />
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold" style={{ color: AMBER }}>Google Calendar Sync</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider font-semibold block mb-1" style={{ color: W3 }}>Inspection Date</label>
                <input type="date" value={inspectionDate} onChange={e => setInspectionDate(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider font-semibold block mb-1" style={{ color: W3 }}>Closing Deadline</label>
                <input type="date" value={closingDeadline} onChange={e => setClosingDeadline(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none" style={inputStyle} />
              </div>
              <div className="flex gap-2">
                <button onClick={handleSaveDates} disabled={updateMutation.isPending} className="flex-1 flex items-center justify-center gap-2 font-bold text-sm px-4 py-2.5 rounded-xl transition-opacity disabled:opacity-50" style={{ background: "transparent", border: `0.5px solid ${BORDER}`, color: W1 }}>
                  {updateMutation.isPending ? "Saving…" : "Save Dates"}
                </button>
                <button onClick={handleSyncToCalendar} disabled={calendarSyncing || (!inspectionDate && !closingDeadline)} className="flex-1 flex items-center justify-center gap-2 font-bold text-sm px-4 py-2.5 rounded-xl transition-opacity disabled:opacity-50" style={{ background: AMBER, color: "#04060a" }}>
                  <Calendar className={`w-4 h-4 ${calendarSyncing ? "animate-pulse" : ""}`} />
                  {calendarSyncing ? "Syncing…" : "Sync to Calendar"}
                </button>
              </div>
              {calendarMsg && (
                <div className="rounded-lg px-3 py-2 flex items-center gap-2" style={{ background: "rgba(93,202,165,0.06)", border: "0.5px solid rgba(93,202,165,0.20)" }}>
                  <CheckCircle className="w-3.5 h-3.5 shrink-0" style={{ color: TEAL }} />
                  <span className="text-[11px] font-semibold" style={{ color: TEAL }}>{calendarMsg}</span>
                </div>
              )}
              {tx.google_calendar_event_id && (
                <p className="text-[9px] text-center" style={{ color: W3 }}>
                  Events already on your calendar — syncing again will update them.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl p-5" style={cardStyle}>
            <p className="text-[10px] uppercase tracking-[0.15em] font-semibold mb-3" style={{ color: AMBER }}>Proof of Funds</p>
            {tx.proof_of_funds_url ? (
              <div className="flex items-center justify-between gap-2 rounded-xl px-4 py-3" style={{ background: "rgba(93,202,165,0.06)", border: "0.5px solid rgba(93,202,165,0.20)" }}>
                <div className="flex items-center gap-2 min-w-0">
                  <FileCheck2 className="w-4 h-4 shrink-0" style={{ color: TEAL }} />
                  <a href={tx.proof_of_funds_url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold hover:underline truncate" style={{ color: TEAL }}>
                    {tx.proof_of_funds_name || "View document"}
                  </a>
                </div>
                <button
                  onClick={() => updateMutation.mutate({ proof_verified: !tx.proof_verified })}
                  className="text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full border"
                  style={tx.proof_verified ? { background: TEAL, color: "#04060a", borderColor: TEAL } : { background: "transparent", color: W2, borderColor: BORDER }}
                >
                  {tx.proof_verified ? "Verified" : "Mark verified"}
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInput.current?.click()}
                disabled={uploading}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-6 text-sm font-bold transition-colors"
                style={{ border: `0.5px dashed ${BORDER}`, color: W2 }}
              >
                <Upload className={`w-4 h-4 ${uploading ? "animate-pulse" : ""}`} />
                {uploading ? "Uploading…" : "Upload proof of funds"}
              </button>
            )}
            <input ref={fileInput} type="file" className="hidden" onChange={handleUpload} accept=".pdf,.png,.jpg,.jpeg" />
          </div>

          <div className="rounded-2xl p-5 space-y-2" style={cardStyle}>
            <p className="text-[10px] uppercase tracking-[0.15em] font-semibold mb-1" style={{ color: AMBER }}>Actions</p>
            <button onClick={() => setShowContract(true)} className="w-full flex items-center justify-between gap-2 font-bold text-sm px-4 py-3 rounded-xl transition-opacity hover:opacity-90" style={{ background: "rgba(78,142,247,0.09)", border: "0.5px solid rgba(78,142,247,0.20)", color: W1 }}>
              <span className="flex items-center gap-2"><FileText className="w-4 h-4" /> View Hustle Contract</span>
              <span className="text-[10px] uppercase tracking-wider opacity-80">PDF</span>
            </button>
            {tx.escrow_provider !== "escrow_com" ? (
              <button onClick={handleCreateOnEscrowCom} disabled={creatingExternal || !tx.buyer_email || !tx.seller_email} className="w-full flex items-center justify-center gap-2 font-bold text-sm px-4 py-3 rounded-xl transition-opacity disabled:opacity-50" style={{ background: "transparent", border: "0.5px solid rgba(245,194,66,0.22)", color: AMBER }}>
                <Zap className={`w-4 h-4 ${creatingExternal ? "animate-pulse" : ""}`} />
                {creatingExternal ? "Creating on Escrow.com…" : "Push to Escrow.com (live)"}
              </button>
            ) : (
              <div className="space-y-2">
                {tx.escrow_landing_url && (
                  <a href={tx.escrow_landing_url} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 font-bold text-sm px-4 py-3 rounded-xl transition-opacity hover:opacity-90" style={{ background: AMBER, color: "#04060a" }}>
                    <ExternalLink className="w-4 h-4" />
                    Open Escrow.com deal (ID {tx.escrow_external_id})
                  </a>
                )}
                <button onClick={handleSync} disabled={syncing} className="w-full flex items-center justify-center gap-2 font-bold text-sm px-4 py-3 rounded-xl transition-colors disabled:opacity-50" style={{ background: "transparent", border: `0.5px solid ${BORDER}`, color: W1 }}>
                  <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
                  {syncing ? "Syncing…" : "Sync status from Escrow.com"}
                </button>
              </div>
            )}
          </div>

          {tx.closed_at && (
            <div className="rounded-xl px-4 py-3 flex items-center gap-2" style={{ background: "rgba(93,202,165,0.06)", border: "0.5px solid rgba(93,202,165,0.20)" }}>
              <CheckCircle className="w-4 h-4" style={{ color: TEAL }} />
              <span className="text-sm font-bold" style={{ color: TEAL }}>
                Closed {new Date(tx.closed_at).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {showContract && <HustleContractModal tx={tx} onClose={() => setShowContract(false)} />}
    </>
  );
}