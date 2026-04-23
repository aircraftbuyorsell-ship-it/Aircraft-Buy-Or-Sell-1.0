import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Pencil, Save, X, Loader2 } from "lucide-react";
import { useCardPermissions } from "@/lib/useCardPermissions";

const EDITABLE_FIELDS = [
  { key: "subject_owner_email", label: "Beneficial Owner Email", type: "email" },
  { key: "subject_operator_email", label: "Operator Email", type: "email" },
  { key: "distribution_owner_email", label: "Distribution / Broker Email", type: "email" },
  { key: "notes", label: "Notes", type: "textarea" },
];

/**
 * Inline edit panel for privileged users to update card metadata
 * (ownership emails + notes). Visible only to users with edit rights.
 */
export default function CardInlineEditor({ card }) {
  const qc = useQueryClient();
  const { canEdit } = useCardPermissions(card);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (!canEdit) return null;

  const start = () => {
    setForm(EDITABLE_FIELDS.reduce((acc, f) => ({ ...acc, [f.key]: card[f.key] || "" }), {}));
    setEditing(true);
    setError(null);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await base44.entities.ATICard.update(card.id, form);
      qc.invalidateQueries({ queryKey: ["ati-card", card.listing] });
      qc.invalidateQueries({ queryKey: ["public-card"] });
      setEditing(false);
    } catch (err) {
      setError(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-[rgba(212,160,23,0.3)] rounded-2xl p-5 md:p-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-[#E8A83A]">Privileged Edit</p>
          <p className="text-[11px] text-[#6B6560] mt-0.5">You have edit rights on this card.</p>
        </div>
        {!editing ? (
          <button onClick={start}
            className="flex items-center gap-1.5 bg-[#E8A83A] hover:bg-[#f5bb4e] text-[#0B2D5B] text-[11px] uppercase tracking-wider font-black px-3 py-1.5 rounded-md">
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={() => setEditing(false)} disabled={saving}
              className="flex items-center gap-1 text-[11px] uppercase tracking-wider font-black text-[#6B6560] hover:text-[#1A1814] px-2 py-1.5">
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
            <button onClick={save} disabled={saving}
              className="flex items-center gap-1.5 bg-[#0B2D5B] hover:bg-[#143C75] disabled:opacity-50 text-white text-[11px] uppercase tracking-wider font-black px-3 py-1.5 rounded-md">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-[rgba(192,57,43,0.08)] border border-[rgba(192,57,43,0.2)] text-[#C0392B] text-xs rounded-lg px-3 py-2 mb-3">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-3">
        {EDITABLE_FIELDS.map((f) => (
          <div key={f.key} className={f.type === "textarea" ? "md:col-span-2" : ""}>
            <label className="block text-[10px] uppercase tracking-wider font-bold text-[#6B6560] mb-1">
              {f.label}
            </label>
            {editing ? (
              f.type === "textarea" ? (
                <textarea
                  value={form[f.key] || ""}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-white border border-black/10 rounded-lg text-sm focus:outline-none focus:border-[#0B2D5B] resize-none"
                />
              ) : (
                <input
                  type={f.type}
                  value={form[f.key] || ""}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-black/10 rounded-lg text-sm focus:outline-none focus:border-[#0B2D5B]"
                />
              )
            ) : (
              <p className="text-sm text-[#1A1814] py-2 px-3 bg-[#F7F4EF] rounded-lg truncate">
                {card[f.key] || <span className="text-[#AAA49C]">—</span>}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}