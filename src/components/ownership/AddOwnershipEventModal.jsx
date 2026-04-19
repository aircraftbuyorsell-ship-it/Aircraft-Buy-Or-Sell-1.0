import { useState } from "react";
import { X, Upload, FileText, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";

const EVENT_TYPES = [
  { value: "manufacture", label: "Manufacture" },
  { value: "first_registration", label: "First Registration" },
  { value: "ownership_transfer", label: "Ownership Transfer" },
  { value: "title_deed", label: "Title Deed" },
  { value: "logbook_entry", label: "Logbook Entry" },
  { value: "lien_release", label: "Lien Release" },
  { value: "export_import", label: "Export / Import" },
  { value: "damage_repair", label: "Damage / Repair" },
  { value: "other", label: "Other" },
];

const DOC_TYPES = [
  { value: "logbook", label: "Logbook" },
  { value: "title_deed", label: "Title Deed" },
  { value: "bill_of_sale", label: "Bill of Sale" },
  { value: "registration_certificate", label: "Registration Certificate" },
  { value: "ad_compliance", label: "AD Compliance" },
  { value: "form_337", label: "FAA Form 337" },
  { value: "other", label: "Other" },
];

export default function AddOwnershipEventModal({ listingId, onClose, onSaved }) {
  const [form, setForm] = useState({
    event_type: "ownership_transfer",
    event_date: "",
    owner_name: "",
    owner_country: "",
    notes: "",
    document_type: "bill_of_sale",
  });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      let document_url = null;
      let document_name = null;
      if (file) {
        const res = await base44.integrations.Core.UploadFile({ file });
        document_url = res.file_url;
        document_name = file.name;
      }
      await base44.entities.OwnershipTrace.create({
        listing: listingId,
        ...form,
        document_url,
        document_name,
        verification_status: file ? "pending" : "pending",
      });
      onSaved?.();
      onClose();
    } catch (e) {
      setError(e?.message || "Failed to save event");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.07]">
          <div>
            <h2 className="text-base font-black text-[#1A1814] uppercase tracking-tight">Add Ownership Event</h2>
            <p className="text-[11px] text-[#AAA49C]">Upload verified documents to build the title chain</p>
          </div>
          <button onClick={onClose} className="text-[#AAA49C] hover:text-[#1A1814]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#AAA49C] font-semibold block mb-1">Event type</label>
              <select value={form.event_type} onChange={e => update("event_type", e.target.value)}
                className="w-full px-3 py-2 bg-[#F7F4EF] border border-black/10 rounded-lg text-sm focus:outline-none focus:border-[#0B2D5B]">
                {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#AAA49C] font-semibold block mb-1">Event date</label>
              <input type="date" value={form.event_date} onChange={e => update("event_date", e.target.value)}
                className="w-full px-3 py-2 bg-[#F7F4EF] border border-black/10 rounded-lg text-sm focus:outline-none focus:border-[#0B2D5B]" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#AAA49C] font-semibold block mb-1">Owner name</label>
              <input type="text" value={form.owner_name} onChange={e => update("owner_name", e.target.value)}
                placeholder="Owner or entity"
                className="w-full px-3 py-2 bg-[#F7F4EF] border border-black/10 rounded-lg text-sm focus:outline-none focus:border-[#0B2D5B]" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#AAA49C] font-semibold block mb-1">Country</label>
              <input type="text" value={form.owner_country} onChange={e => update("owner_country", e.target.value)}
                placeholder="e.g. USA"
                className="w-full px-3 py-2 bg-[#F7F4EF] border border-black/10 rounded-lg text-sm focus:outline-none focus:border-[#0B2D5B]" />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] uppercase tracking-wider text-[#AAA49C] font-semibold block mb-1">Notes</label>
              <textarea value={form.notes} onChange={e => update("notes", e.target.value)}
                rows={2} placeholder="Additional context…"
                className="w-full px-3 py-2 bg-[#F7F4EF] border border-black/10 rounded-lg text-sm focus:outline-none focus:border-[#0B2D5B] resize-none" />
            </div>
          </div>

          <div className="border-t border-black/[0.07] pt-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#AAA49C] font-semibold block mb-1">Document type</label>
              <select value={form.document_type} onChange={e => update("document_type", e.target.value)}
                className="w-full px-3 py-2 bg-[#F7F4EF] border border-black/10 rounded-lg text-sm focus:outline-none focus:border-[#0B2D5B]">
                {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            <label className="block mt-3">
              <div className="border-2 border-dashed border-black/10 hover:border-[#0B2D5B] rounded-xl p-5 text-center cursor-pointer transition-colors">
                <Upload className="w-6 h-6 text-[#AAA49C] mx-auto mb-2" />
                <p className="text-sm font-bold text-[#1A1814]">
                  {file ? file.name : "Click to upload document"}
                </p>
                <p className="text-[11px] text-[#AAA49C] mt-1">
                  PDF, JPG, PNG — logbook, title deed, bill of sale…
                </p>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={e => setFile(e.target.files?.[0] || null)} className="hidden" />
              </div>
            </label>
            {file && (
              <div className="mt-2 flex items-center justify-between bg-[#F7F4EF] rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-[#0B2D5B] shrink-0" />
                  <p className="text-[12px] truncate">{file.name}</p>
                </div>
                <button onClick={() => setFile(null)} className="text-[11px] text-[#C0392B] hover:underline">Remove</button>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-[rgba(192,57,43,0.08)] border border-[rgba(192,57,43,0.2)] text-[#C0392B] text-sm rounded-xl px-4 py-2.5">
              {error}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-black/[0.07] flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-black/10 text-sm font-medium text-[#6B6560] hover:border-[#0B2D5B] transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B2D5B] hover:bg-[#143C75] disabled:opacity-40 text-white text-sm font-bold transition-colors">
            <Sparkles className={`w-4 h-4 ${saving ? "animate-pulse" : ""}`} />
            {saving ? "Saving…" : "Add to chain"}
          </button>
        </div>
      </div>
    </div>
  );
}