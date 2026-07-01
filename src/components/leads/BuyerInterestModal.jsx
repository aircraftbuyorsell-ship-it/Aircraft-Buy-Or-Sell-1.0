import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { X, Loader2, Send, Plane, CheckCircle2, AlertTriangle } from "lucide-react";

const BUDGETS = ["<100k", "<200k", "<500k", "<1M", ">1M", "Not sure yet"];

/**
 * Buyer-facing self-service contact flow (Phase 1.5 · Model A).
 * Replaces the internal "Capture Buyer Lead" CRM button with a form the
 * actual buyer fills in. Creates a Lead (source=buyer_interest) linked to
 * the listing; an entity automation then notifies the broker/admin team.
 */
export default function BuyerInterestModal({ open, onClose, listing = null, onSubmitted }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", budget: "", message: "", rules_agreed: false });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setForm({ name: "", email: "", phone: "", budget: "", message: "", rules_agreed: false });
      setError(null);
      setDone(false);
    }
  }, [open]);

  if (!open) return null;
  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name.trim() || !form.email.trim()) { setError("Name and email are required"); return; }
    if (!form.rules_agreed) { setError("Please agree to the platform rules to continue"); return; }
    setSaving(true); setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        aircraft_preference: listing ? `${listing.year || ""} ${listing.make || ""} ${listing.model || ""}`.trim() : "",
        budget: form.budget,
        status: "new",
        source: "buyer_interest",
        notes: form.message.trim(),
        rules_agreed: true,
      };
      if (listing?.id) {
        payload.listing = listing.id;
        payload.listing_label = `${listing.year || ""} ${listing.make || ""} ${listing.model || ""} · ${listing.registration || ""}`.trim();
      }
      await base44.entities.Lead.create(payload);
      setDone(true);
      onSubmitted?.();
    } catch (e) {
      setError(e?.message || "Submission failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[70]" onClick={() => !saving && onClose()} />
      <div className="fixed inset-0 z-[71] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
        <div className="pointer-events-auto w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl safe-bottom overflow-hidden max-h-[92dvh] flex flex-col animate-slide-up">
          <div className="sm:hidden flex justify-center pt-2 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full bg-black/15" />
          </div>
          {done ? (
            <div className="p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-[#0F7A56]/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-[#0F7A56]" />
              </div>
              <h3 className="text-lg font-black text-[#1A1814] mb-2">Interest submitted</h3>
              <p className="text-sm text-[#6B6560] leading-relaxed mb-6">
                An ABOS broker will review your inquiry and reach out within 24 hours. Your contact details have been shared securely with our team.
              </p>
              <button onClick={onClose} className="bg-[#0B2D5B] hover:bg-[#143C75] text-white font-bold text-sm px-8 py-3 min-h-[48px] rounded-xl transition-colors">
                Done
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between p-5 border-b border-black/[0.06]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#0B2D5B]/10 flex items-center justify-center">
                    <Send className="w-4 h-4 text-[#0B2D5B]" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#1A1814] uppercase tracking-tight">I'm Interested</h3>
                    <p className="text-[10px] text-[#6B6560]">Express your interest — a broker will contact you</p>
                  </div>
                </div>
                <button onClick={() => !saving && onClose()} disabled={saving} className="text-[#6B6560] hover:text-[#1A1814] min-w-[44px] min-h-[44px] flex items-center justify-center">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {listing && (
                  <div className="flex items-center gap-2 bg-[#0B2D5B]/5 border border-[#0B2D5B]/15 rounded-lg px-3 py-2">
                    <Plane className="w-4 h-4 text-[#0B2D5B] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-[#0B2D5B] font-black">Aircraft</p>
                      <p className="text-sm font-bold text-[#1A1814] truncate">
                        {listing.year} {listing.make} {listing.model} · <span className="font-mono text-xs">{listing.registration || "—"}</span>
                      </p>
                    </div>
                    {listing.asking_price != null && (
                      <p className="text-sm font-black text-[#0B2D5B] shrink-0">${listing.asking_price.toLocaleString()}</p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Name *"><Input v={form.name} set={v => setField("name", v)} placeholder="John Doe" /></Field>
                  <Field label="Email *"><Input v={form.email} set={v => setField("email", v)} type="email" placeholder="john@email.com" /></Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Phone (optional)"><Input v={form.phone} set={v => setField("phone", v)} placeholder="+1 555…" /></Field>
                  <Field label="Budget">
                    <select value={form.budget} onChange={e => setField("budget", e.target.value)}
                      className="w-full px-3 py-3 min-h-[44px] bg-[#F7F4EF] border border-black/10 rounded-xl text-sm focus:outline-none focus:border-[#0B2D5B]">
                      <option value="">—</option>
                      {BUDGETS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </Field>
                </div>

                <Field label="Message to the broker (optional)">
                  <textarea value={form.message} onChange={e => setField("message", e.target.value)} rows={3}
                    placeholder="I'm seriously looking for a well-maintained SR22 with G1000…"
                    className="w-full px-3 py-3 min-h-[44px] bg-[#F7F4EF] border border-black/10 rounded-xl text-sm focus:outline-none focus:border-[#0B2D5B] resize-none" />
                </Field>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.rules_agreed} onChange={e => setField("rules_agreed", e.target.checked)}
                    className="mt-0.5 w-5 h-5 min-w-[20px] accent-[#0B2D5B] shrink-0" />
                  <span className="text-[11px] text-[#6B6560] leading-relaxed">
                    I agree to be contacted by an ABOS broker regarding this aircraft and accept the platform's{" "}
                    <Link to="/terms-of-service" className="text-[#0B2D5B] font-semibold underline" onClick={e => e.stopPropagation()}>Terms of Service</Link>.
                  </span>
                </label>

                {error && (
                  <div className="flex items-center gap-2 bg-[#C0392B]/5 border border-[#C0392B]/20 rounded-lg px-3 py-2">
                    <AlertTriangle className="w-4 h-4 text-[#C0392B] shrink-0" />
                    <p className="text-[12px] text-[#C0392B]">{error}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-2 p-5 border-t border-black/[0.06] safe-bottom">
                <button onClick={onClose} disabled={saving}
                  className="flex-1 min-h-[48px] bg-white border border-black/10 hover:bg-[#F7F4EF] text-[#1A1814] font-bold text-sm py-3 rounded-xl">
                  Cancel
                </button>
                <button onClick={submit} disabled={saving || !form.rules_agreed}
                  className="flex-1 sm:flex-[2] min-h-[48px] bg-[#0B2D5B] hover:bg-[#143C75] disabled:opacity-40 text-white font-bold text-sm py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {saving ? "Submitting…" : "Submit Interest"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wider text-[#6B6560] font-semibold block mb-1">{label}</label>
      {children}
    </div>
  );
}
function Input({ v, set, type = "text", placeholder }) {
  return (
    <input type={type} value={v} onChange={e => set(e.target.value)} placeholder={placeholder}
      className="w-full px-3 py-3 min-h-[44px] bg-[#F7F4EF] border border-black/10 rounded-xl text-sm focus:outline-none focus:border-[#0B2D5B]" />
  );
}