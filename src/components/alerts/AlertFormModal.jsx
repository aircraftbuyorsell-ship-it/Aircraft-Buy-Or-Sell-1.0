import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, Loader2, Bell } from "lucide-react";

const empty = {
  name: "", make: "", model: "",
  year_min: "", year_max: "",
  max_price: "", min_ati: "",
  channel: "email", active: true,
};

export default function AlertFormModal({ open, onClose, onSaved, userEmail, initial = null }) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setForm(initial ? {
        ...empty, ...initial,
        year_min: initial.year_min ?? "",
        year_max: initial.year_max ?? "",
        max_price: initial.max_price ?? "",
        min_ati: initial.min_ati ?? "",
      } : empty);
      setError(null);
    }
  }, [open, initial]);

  if (!open) return null;

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const num = (v) => v === "" || v == null ? null : Number(v);

  const save = async () => {
    if (!form.name.trim()) { setError("Alert name is required"); return; }
    setSaving(true); setError(null);
    try {
      const payload = {
        user_email: userEmail,
        name: form.name.trim(),
        make: form.make.trim() || undefined,
        model: form.model.trim() || undefined,
        year_min: num(form.year_min),
        year_max: num(form.year_max),
        max_price: num(form.max_price),
        min_ati: num(form.min_ati),
        channel: form.channel,
        active: form.active,
      };
      if (initial?.id) {
        await base44.entities.AircraftAlert.update(initial.id, payload);
      } else {
        await base44.entities.AircraftAlert.create(payload);
      }
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
              <div className="w-8 h-8 rounded-full bg-[#E8A83A]/15 flex items-center justify-center">
                <Bell className="w-4 h-4 text-[#E8A83A]" />
              </div>
              <h3 className="text-base font-black text-[#1A1814] uppercase tracking-tight">
                {initial ? "Edit Alert" : "New Aircraft Alert"}
              </h3>
            </div>
            <button onClick={() => !saving && onClose()} disabled={saving} className="text-[#6B6560] hover:text-[#1A1814]">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <Field label="Alert name *">
              <input value={form.name} onChange={e => setField("name", e.target.value)}
                placeholder="e.g. Cirrus SR22 under 500K"
                className="w-full px-3 py-2.5 bg-[#F7F4EF] border border-black/10 rounded-xl text-sm focus:outline-none focus:border-[#0B2D5B]" />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Make"><Input v={form.make} set={v => setField("make", v)} placeholder="Cirrus" /></Field>
              <Field label="Model"><Input v={form.model} set={v => setField("model", v)} placeholder="SR22" /></Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Year min"><Input v={form.year_min} set={v => setField("year_min", v)} type="number" placeholder="2010" /></Field>
              <Field label="Year max"><Input v={form.year_max} set={v => setField("year_max", v)} type="number" placeholder="2026" /></Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Max price (USD)"><Input v={form.max_price} set={v => setField("max_price", v)} type="number" placeholder="500000" /></Field>
              <Field label="Min ATI score"><Input v={form.min_ati} set={v => setField("min_ati", v)} type="number" placeholder="85" /></Field>
            </div>

            <Field label="Notification channel">
              <div className="flex gap-2">
                {[
                  { v: "email", label: "Email (instant)" },
                  { v: "digest", label: "Daily digest" },
                ].map(o => (
                  <button key={o.v} type="button" onClick={() => setField("channel", o.v)}
                    className={`flex-1 text-[11px] font-bold px-3 py-2 rounded-lg border ${form.channel === o.v ? "border-[#0B2D5B] bg-[#0B2D5B]/5 text-[#0B2D5B]" : "border-black/10 text-[#6B6560]"}`}>
                    {o.label}
                  </button>
                ))}
              </div>
            </Field>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.active} onChange={e => setField("active", e.target.checked)} className="accent-[#0F7A56]" />
              <span className="text-sm text-[#1A1814] font-medium">Alert is active</span>
            </label>

            {error && <p className="text-[12px] text-[#C0392B]">{error}</p>}
          </div>

          <div className="flex gap-2 p-5 border-t border-black/[0.06]">
            <button onClick={onClose} disabled={saving}
              className="flex-1 bg-white border border-black/10 hover:bg-[#F7F4EF] text-[#1A1814] font-bold text-sm py-3 rounded-xl">
              Cancel
            </button>
            <button onClick={save} disabled={saving}
              className="flex-1 bg-[#0B2D5B] hover:bg-[#143C75] text-white font-bold text-sm py-3 rounded-xl flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
              {saving ? "Saving…" : initial ? "Update alert" : "Create alert"}
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