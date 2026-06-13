import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Upload, FileText, RefreshCw, Zap, CheckCircle, FileCheck2, ExternalLink, Calendar } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { ESCROW_STATUS, STATUS_FLOW, formatMoney } from "@/lib/escrow";
import EscrowStatusBadge from "./EscrowStatusBadge";
import StatusStepper from "./StatusStepper";
import HustleContractModal from "./HustleContractModal";

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-start gap-2 py-2 border-b border-black/[0.05] last:border-0">
      <span className="text-[10px] uppercase tracking-wider text-[#AAA49C] font-semibold">{label}</span>
      <span className="text-[13px] text-[#1A1814] font-medium text-right">{value || "—"}</span>
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
    setUploading(true);
    setErr(null);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: f });
      await updateMutation.mutateAsync({
        proof_of_funds_url: file_url,
        proof_of_funds_name: f.name,
      });
    } catch (e) { setErr(e.message); }
    setUploading(false);
  };

  const handleStatusChange = (newStatus) => {
    updateMutation.mutate({
      status: newStatus,
      closed_at: newStatus === "closed" ? new Date().toISOString() : tx.closed_at,
    });
  };

  const handleCreateOnEscrowCom = async () => {
    setCreatingExternal(true);
    setErr(null);
    try {
      const res = await base44.functions.invoke("escrowSync", { action: "create", transaction_id: tx.id });
      if (res?.data?.error) throw new Error(res.data.error);
      qc.invalidateQueries({ queryKey: ["escrow-transactions"] });
    } catch (e) { setErr(e.message); }
    setCreatingExternal(false);
  };

  const handleSync = async () => {
    setSyncing(true);
    setErr(null);
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
    setCalendarSyncing(true);
    setCalendarMsg(null);
    setErr(null);
    try {
      // Save dates first if changed
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

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 bottom-0 w-full max-w-xl bg-[#F7F4EF] z-50 shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-black/[0.07] px-6 py-4 flex items-center justify-between z-10">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#E8A83A]">Escrow · {tx.escrow_provider === "escrow_com" ? "Escrow.com" : "Internal"}</p>
            <h2 className="text-lg font-black text-[#1A1814] truncate">{tx.aircraft_label || "Transaction"}</h2>
          </div>
          <button onClick={onClose} className="text-[#AAA49C] hover:text-[#1A1814] shrink-0"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-4 md:p-6 space-y-4">
          {err && (
            <div className="bg-[rgba(192,57,43,0.08)] border border-[rgba(192,57,43,0.2)] text-[#C0392B] text-sm rounded-xl px-4 py-2.5">
              {err}
            </div>
          )}

          {/* Status stepper */}
          <StatusStepper currentStatus={tx.status} />

          {/* Status controls */}
          <div className="bg-white border border-black/[0.07] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#E8A83A]">Update Status</p>
              <EscrowStatusBadge status={tx.status} size="lg" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_FLOW.map(s => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  disabled={tx.status === s}
                  className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1.5 rounded-lg border transition-colors ${
                    tx.status === s
                      ? "bg-[#0B2D5B] text-white border-[#0B2D5B]"
                      : "bg-white text-[#6B6560] border-black/10 hover:border-[#0B2D5B] hover:text-[#0B2D5B]"
                  }`}
                >
                  {ESCROW_STATUS[s].label}
                </button>
              ))}
              <button
                onClick={() => handleStatusChange("cancelled")}
                className="text-[10px] uppercase tracking-wider font-bold px-2.5 py-1.5 rounded-lg border bg-white text-[#C0392B] border-[rgba(192,57,43,0.3)] hover:bg-[rgba(192,57,43,0.06)]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStatusChange("disputed")}
                className="text-[10px] uppercase tracking-wider font-bold px-2.5 py-1.5 rounded-lg border bg-white text-[#C0392B] border-[rgba(192,57,43,0.3)] hover:bg-[rgba(192,57,43,0.06)]"
              >
                Dispute
              </button>
            </div>
          </div>

          {/* Financials */}
          <div className="bg-[#0B2D5B] text-white rounded-2xl p-5">
            <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#E8A83A] mb-3">Transparent Financials</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-[9px] uppercase text-white/60 font-semibold">Sale</p>
                <p className="text-lg font-black">{formatMoney(tx.sale_amount, tx.currency)}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase text-white/60 font-semibold">Fee ({tx.finders_fee_pct || 0}%)</p>
                <p className="text-lg font-black text-[#E8A83A]">{formatMoney(tx.finders_fee_amount, tx.currency)}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase text-white/60 font-semibold">Seller Net</p>
                <p className="text-lg font-black">{formatMoney(tx.seller_net, tx.currency)}</p>
              </div>
            </div>
          </div>

          {/* Parties — names masked, role only */}
          <div className="bg-white border border-black/[0.07] rounded-2xl p-5">
            <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#E8A83A] mb-2">Parties</p>
            <Row label="Buyer" value={tx.buyer_name ? "●●●●● (verified)" : "—"} />
            <Row label="Seller" value={tx.seller_name ? "●●●●● (verified)" : "—"} />
            <Row label="Broker / Finder" value={tx.broker_name ? "●●●●● (verified)" : "—"} />
            <Row label="Inspection Period" value={`${tx.inspection_period_days || 3} days`} />
          </div>

          {/* Calendar Sync */}
          <div className="bg-white border border-black/[0.07] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-[#E8A83A]" />
              <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#E8A83A]">Google Calendar Sync</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#AAA49C] font-semibold block mb-1">Inspection Date</label>
                <input
                  type="date"
                  value={inspectionDate}
                  onChange={e => setInspectionDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F7F4EF] border border-black/10 rounded-lg text-sm focus:outline-none focus:border-[#E8A83A] transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#AAA49C] font-semibold block mb-1">Closing Deadline</label>
                <input
                  type="date"
                  value={closingDeadline}
                  onChange={e => setClosingDeadline(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F7F4EF] border border-black/10 rounded-lg text-sm focus:outline-none focus:border-[#E8A83A] transition-colors"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveDates}
                  disabled={updateMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 bg-white border border-black/10 hover:border-[#0B2D5B] text-[#0B2D5B] disabled:opacity-50 font-bold text-sm px-4 py-2.5 rounded-xl transition-colors"
                >
                  {updateMutation.isPending ? "Saving…" : "Save Dates"}
                </button>
                <button
                  onClick={handleSyncToCalendar}
                  disabled={calendarSyncing || (!inspectionDate && !closingDeadline)}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#E8A83A] hover:bg-[#D4911A] disabled:opacity-50 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors"
                >
                  <Calendar className={`w-4 h-4 ${calendarSyncing ? "animate-pulse" : ""}`} />
                  {calendarSyncing ? "Syncing…" : "Sync to Calendar"}
                </button>
              </div>
              {calendarMsg && (
                <div className="bg-[rgba(15,122,86,0.08)] border border-[rgba(15,122,86,0.2)] rounded-lg px-3 py-2 flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-[#0F7A56] shrink-0" />
                  <span className="text-[11px] font-semibold text-[#0F7A56]">{calendarMsg}</span>
                </div>
              )}
              {tx.google_calendar_event_id && (
                <p className="text-[9px] text-[#AAA49C] text-center">
                  Events already on your calendar — syncing again will update them.
                </p>
              )}
            </div>
          </div>

          {/* Proof of funds */}
          <div className="bg-white border border-black/[0.07] rounded-2xl p-5">
            <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#E8A83A] mb-3">Proof of Funds</p>
            {tx.proof_of_funds_url ? (
              <div className="flex items-center justify-between gap-2 bg-[rgba(15,122,86,0.06)] border border-[rgba(15,122,86,0.2)] rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 min-w-0">
                  <FileCheck2 className="w-4 h-4 text-[#0F7A56] shrink-0" />
                  <a href={tx.proof_of_funds_url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-[#0F7A56] hover:underline truncate">
                    {tx.proof_of_funds_name || "View document"}
                  </a>
                </div>
                <button
                  onClick={() => updateMutation.mutate({ proof_verified: !tx.proof_verified })}
                  className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full border ${
                    tx.proof_verified
                      ? "bg-[#0F7A56] text-white border-[#0F7A56]"
                      : "bg-white text-[#6B6560] border-black/10"
                  }`}
                >
                  {tx.proof_verified ? "Verified" : "Mark verified"}
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInput.current?.click()}
                disabled={uploading}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-black/10 hover:border-[#0B2D5B] rounded-xl py-6 text-sm font-bold text-[#6B6560] hover:text-[#0B2D5B] transition-colors"
              >
                <Upload className={`w-4 h-4 ${uploading ? "animate-pulse" : ""}`} />
                {uploading ? "Uploading…" : "Upload proof of funds"}
              </button>
            )}
            <input ref={fileInput} type="file" className="hidden" onChange={handleUpload} accept=".pdf,.png,.jpg,.jpeg" />
          </div>

          {/* Actions */}
          <div className="bg-white border border-black/[0.07] rounded-2xl p-5 space-y-2">
            <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#E8A83A] mb-1">Actions</p>

            <button
              onClick={() => setShowContract(true)}
              className="w-full flex items-center justify-between gap-2 bg-[#0B2D5B] hover:bg-[#143C75] text-white font-bold text-sm px-4 py-3 rounded-xl transition-colors"
            >
              <span className="flex items-center gap-2"><FileText className="w-4 h-4" /> View Hustle Contract</span>
              <span className="text-[10px] uppercase tracking-wider opacity-80">PDF</span>
            </button>

            {tx.escrow_provider !== "escrow_com" ? (
              <button
                onClick={handleCreateOnEscrowCom}
                disabled={creatingExternal || !tx.buyer_email || !tx.seller_email}
                className="w-full flex items-center justify-center gap-2 bg-white border-2 border-[#E8A83A] hover:bg-[#E8A83A] text-[#A67C00] hover:text-white disabled:opacity-50 font-bold text-sm px-4 py-3 rounded-xl transition-colors"
              >
                <Zap className={`w-4 h-4 ${creatingExternal ? "animate-pulse" : ""}`} />
                {creatingExternal ? "Creating on Escrow.com…" : "Push to Escrow.com (live)"}
              </button>
            ) : (
              <div className="space-y-2">
                {tx.escrow_landing_url && (
                  <a
                    href={tx.escrow_landing_url} target="_blank" rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-[#E8A83A] text-[#0B2D5B] font-bold text-sm px-4 py-3 rounded-xl hover:bg-[#f5bb4e] transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Escrow.com deal (ID {tx.escrow_external_id})
                  </a>
                )}
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="w-full flex items-center justify-center gap-2 bg-white border border-black/10 hover:border-[#0B2D5B] text-[#0B2D5B] font-bold text-sm px-4 py-3 rounded-xl transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
                  {syncing ? "Syncing…" : "Sync status from Escrow.com"}
                </button>
              </div>
            )}
          </div>

          {tx.closed_at && (
            <div className="bg-[rgba(15,122,86,0.08)] border border-[rgba(15,122,86,0.2)] rounded-xl px-4 py-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#0F7A56]" />
              <span className="text-sm font-bold text-[#0F7A56]">
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