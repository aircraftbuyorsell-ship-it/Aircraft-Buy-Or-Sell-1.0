import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, Loader2, UserPlus, Plane } from "lucide-react";

const BUDGETS = ["<100k", "<200k", "<500k", "<1M", ">1M"];
const STATUSES = ["new", "contacted", "qualified", "negotiating", "closed", "lost"];

export default function AddLeadModal({ open, onClose, onSaved, listing = null }) {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", aircraft_preference: "",
    budget: "", status: "new", source: "manual", notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setForm({
        name: "", email: "", phone: "",
        aircraft_preference: listing ? `${listing.year || ""} ${listing.make || ""} ${listing.model || ""}`.trim() : "",
        budget: "", status: "new", source: listing ? "listing" : "manual", notes: "",
      });
      setError(null);
    }
  }, [open, listing]);

  if (!open) return null;
  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name.trim() || !form.email.trim()) { setError("Name and email are required"); return; }
    setSaving(true); setError(null);
    try {
      const payload = { ...form };
      if (listing?.id) {
        payload.listing = listing.id;
        payload.listing_label = `${listing.year || ""} ${listing.make || ""} ${listing.model || ""} · ${listing.registration || ""}`.trim();
      }
      await base44.entities.Lead.create(payload);
      onSaved?.();
      onClose();
    } catch (e) {
      setError(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[70]" onClick={() => !saving && onClose()} />
      <div className="fixed inset-0 z-[71] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
        <div className="pointer-events-auto w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl safe-bottom overflow-hidden max-h-[92vh] flex flex-col">
          <div className="flex items-center justify-between p-5 border-b border-black/[0.06]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#0B2D5B]/10 flex items-center justify-center">
                <UserPlus className="w-4 h-4 text-[#0B2D5B]" />
              </div>
              <h3 className="text-base font-black text-[#1A1814] uppercase tracking-tight">New Lead</h3>
            </div>
            <button onClick={() => !saving && onClose()} disabled={saving} className="text-[#6B6560] hover:text-[#1A1814]">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {listing && (
              <div className="flex items-center gap-2 bg-[#0B2D5B]/5 border border-[#0B2D5B]/15 rounded-lg px-3 py-2">
                <Plane className="w-4 h-4 text-[#0B2D5B]" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-[#0B2D5B] font-black">Linked to listing</p>
                  <p className="text-sm font-bold text-[#1A1814] truncate">
                    {listing.year} {listing.make} {listing.model} · <span className="font-mono text-xs">{listing.registration || "—"}</span>
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field label="Name *"><Input v={form.name} set={v => setField("name", v)} placeholder="John Doe" /></Field>
              <Field label="Email *"><Input v={form.email} set={v => setField("email", v)} type="email" placeholder="john@company.com" /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Phone"><Input v={form.phone} set={v => setField("phone", v)} placeholder="+1 555…" /></Field>
              <Field label="Budget">
                <select value={form.budget} onChange={e => setField("budget", e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#F7F4EF] border border-black/10 rounded-xl text-sm focus:outline-none focus:border-[#0B2D5B]">
                  <option value="">—</option>
                  {BUDGETS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </Field>
            </div>

            <Field label="Aircraft preference">
              <Input v={form.aircraft_preference} set={v => setField("aircraft_preference", v)} placeholder="e.g. Cirrus SR22 G6" />
            </Field>

            <Field label="Status">
              <div className="flex flex-wrap gap-1.5">
                {STATUSES.map(s => (
                  <button key={s} type="button" onClick={() => setField("status", s)}
                    className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border transition-colors ${
                      form.status === s ? "bg-[#0B2D5B] text-white border-[#0B2D5B]" : "bg-white text-[#6B6560] border-black/10 hover:border-black/20"
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Notes">
              <textarea value={form.notes} onChange={e => setField("notes", e.target.value)} rows={3}
                placeholder="Internal notes…"
                className="w-full px-3 py-2.5 bg-[#F7F4EF] border border-black/10 rounded-xl text-sm focus:outline-none focus:border-[#0B2D5B]" />
            </Field>

            {error && <p className="text-[12px] text-[#C0392B]">{error}</p>}
          </div>

          <div className="flex gap-2 p-5 border-t border-black/[0.06]">
            <button onClick={onClose} disabled={saving}
              className="flex-1 bg-white border border-black/10 hover:bg-[#F7F4EF] text-[#1A1814] font-bold text-sm py-3 rounded-xl">
              Cancel
            </button>
            <button onClick={save} disabled={saving}
              className="flex-1 bg-[#0B2D5B] hover:bg-[#143C75] text-white font-bold text-sm py-3 rounded-xl flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              {saving ? "Saving…" : "Add lead"}
            </button>
          </div>
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
      className="w-full px-3 py-2.5 bg-[#F7F4EF] border border-black/10 rounded-xl text-sm focus:outline-none focus:border-[#0B2D5B]" />
  );
}