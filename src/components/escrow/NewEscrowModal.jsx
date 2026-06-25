import { useState } from "react";
import { X, Handshake } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { calcFinderFee, formatMoney } from "@/lib/escrow";

const W1 = "rgba(255,255,255,0.90)";
const W2 = "rgba(255,255,255,0.60)";
const W3 = "rgba(255,255,255,0.35)";
const BORDER = "rgba(255,255,255,0.08)";
const AMBER = "#f5c242";
const CARD = "rgba(255,255,255,0.04)";

const EMPTY = {
  aircraft_label: "",
  buyer_name: "", buyer_email: "",
  seller_name: "", seller_email: "",
  broker_name: "", broker_email: "",
  sale_amount: "", finders_fee_pct: 5,
  inspection_period_days: 3,
  currency: "USD",
  escrow_provider: "internal",
};

export default function NewEscrowModal({ onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const upd = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const { fee, net } = calcFinderFee(form.sale_amount, form.finders_fee_pct);

  const handleCreate = async () => {
    setSaving(true);
    const payload = {
      ...form,
      sale_amount: Number(form.sale_amount) || 0,
      finders_fee_pct: Number(form.finders_fee_pct) || 0,
      finders_fee_amount: fee,
      seller_net: net,
      inspection_period_days: Number(form.inspection_period_days) || 3,
      status: "draft",
      escrow_provider: form.escrow_provider || "internal",
    };
    const created = await base44.entities.EscrowTransaction.create(payload);
    setSaving(false);
    onCreated(created);
  };

  const fields = [
    { k: "aircraft_label", label: "Aircraft (year make model N-number)", full: true, placeholder: "2015 Cirrus SR22 N123AB" },
    { k: "buyer_name", label: "Buyer name" },
    { k: "buyer_email", label: "Buyer email", type: "email" },
    { k: "seller_name", label: "Seller name" },
    { k: "seller_email", label: "Seller email", type: "email" },
    { k: "broker_name", label: "Broker / Finder (you)" },
    { k: "broker_email", label: "Broker email", type: "email" },
    { k: "sale_amount", label: "Sale amount (USD)", type: "number" },
    { k: "finders_fee_pct", label: "Finder's fee %", type: "number" },
    { k: "escrow_provider", label: "Escrow Provider", type: "select", options: [{ value: "internal", label: "ABOS Internal Escrow" }, { value: "escrow_com", label: "Escrow.com (Licensed & Regulated)" }] },
    { k: "inspection_period_days", label: "Inspection period (days)", type: "number" },
  ];

  const inputStyle = { background: CARD, border: `0.5px solid ${BORDER}`, color: W1 };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div className="rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" style={{ background: "rgba(13,17,23,0.98)", border: `0.5px solid ${BORDER}` }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `0.5px solid ${BORDER}` }}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(245,194,66,0.09)" }}>
              <Handshake className="w-4 h-4" style={{ color: AMBER }} />
            </div>
            <div>
              <h2 className="text-base font-black uppercase" style={{ color: W1 }}>New Escrow Transaction</h2>
              <p className="text-[11px]" style={{ color: W3 }}>Capture deal parties & finder's fee terms</p>
            </div>
          </div>
          <button onClick={onClose} style={{ color: W3 }}><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {fields.map(f => (
              <div key={f.k} className={f.full ? "md:col-span-2" : ""}>
                <label className="text-[10px] uppercase tracking-wider font-semibold block mb-1" style={{ color: W3 }}>{f.label}</label>
                {f.type === "select" ? (
                  <select
                    value={form[f.k]}
                    onChange={e => upd(f.k, e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none transition-colors"
                    style={inputStyle}
                  >
                    {(f.options || []).map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={f.type || "text"}
                    value={form[f.k]}
                    onChange={e => upd(f.k, e.target.value)}
                    placeholder={f.placeholder || "—"}
                    className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none transition-colors"
                    style={inputStyle}
                  />
                )}
              </div>
            ))}
          </div>

          {form.sale_amount && form.finders_fee_pct ? (
            <div className="rounded-xl p-4 mt-2" style={{ background: "rgba(78,142,247,0.06)", border: "0.5px solid rgba(78,142,247,0.20)" }}>
              <p className="text-[10px] uppercase tracking-[0.15em] font-bold mb-2" style={{ color: AMBER }}>Transparent Split Preview</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-[9px] uppercase font-semibold" style={{ color: "rgba(255,255,255,0.50)" }}>Sale</p>
                  <p className="text-base font-black" style={{ color: W1 }}>{formatMoney(form.sale_amount)}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase font-semibold" style={{ color: "rgba(255,255,255,0.50)" }}>Your Fee ({form.finders_fee_pct}%)</p>
                  <p className="text-base font-black" style={{ color: AMBER }}>{formatMoney(fee)}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase font-semibold" style={{ color: "rgba(255,255,255,0.50)" }}>Seller Net</p>
                  <p className="text-base font-black" style={{ color: W1 }}>{formatMoney(net)}</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="px-6 py-4 flex items-center justify-end gap-2" style={{ borderTop: `0.5px solid ${BORDER}` }}>
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-80" style={{ background: "transparent", border: `0.5px solid ${BORDER}`, color: W2 }}>
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={saving || !form.buyer_name || !form.seller_name || !form.sale_amount}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-opacity disabled:opacity-40"
            style={{ background: AMBER, color: "#04060a" }}
          >
            <Handshake className="w-4 h-4" />
            {saving ? "Creating…" : "Create Transaction"}
          </button>
        </div>
      </div>
    </div>
  );
}