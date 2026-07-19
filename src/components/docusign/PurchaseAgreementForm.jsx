import { useState } from "react";
import { Send, Loader2, PenLine, CheckCircle2, AlertTriangle } from "lucide-react";

const EMPTY = {
  registration: "",
  make: "",
  model: "",
  serialNumber: "",
  year: "",
  salePrice: "",
  currency: "USD",
  buyerName: "",
  buyerEmail: "",
  sellerName: "",
  sellerEmail: "",
};

const FIELD = "w-full px-3 py-2 rounded-lg text-[12px] outline-none";

export default function PurchaseAgreementForm({ onSend, sending }) {
  const [form, setForm] = useState(EMPTY);
  const [result, setResult] = useState(null);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.buyerName || !form.buyerEmail) return;
    setResult(null);
    const payload = {
      ...form,
      salePrice: Number(form.salePrice) || 0,
      year: form.year ? Number(form.year) : undefined,
    };
    const res = await onSend(payload);
    if (res.ok) {
      setResult({ ok: true, msg: "Agreement sent! Signers will receive an email from DocuSign." });
      setForm(EMPTY);
    } else {
      setResult({ ok: false, msg: res.error });
    }
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-xl p-4 space-y-3"
      style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.08)" }}
    >
      <div className="flex items-center gap-2 mb-1">
        <PenLine className="w-4 h-4 text-[#f5c242]" />
        <h3 className="text-sm font-bold text-white/90">New Purchase Agreement</h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <input className={FIELD} placeholder="Registration" value={form.registration} onChange={set("registration")} />
        <input className={FIELD} placeholder="Year" value={form.year} onChange={set("year")} type="number" />
        <input className={FIELD} placeholder="Make" value={form.make} onChange={set("make")} />
        <input className={FIELD} placeholder="Model" value={form.model} onChange={set("model")} />
        <input className={FIELD} placeholder="Serial Number" value={form.serialNumber} onChange={set("serialNumber")} />
        <select className={FIELD} value={form.currency} onChange={set("currency")}>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="GBP">GBP</option>
          <option value="CZK">CZK</option>
        </select>
        <input className={FIELD} placeholder="Sale Price" value={form.salePrice} onChange={set("salePrice")} type="number" />
      </div>

      <div className="pt-1 border-t border-white/6" />
      <p className="text-[9px] uppercase tracking-wider font-bold text-white/30">Buyer (Signer)</p>
      <div className="grid grid-cols-2 gap-2">
        <input className={FIELD} placeholder="Buyer name" value={form.buyerName} onChange={set("buyerName")} required />
        <input className={FIELD} placeholder="Buyer email" value={form.buyerEmail} onChange={set("buyerEmail")} type="email" required />
      </div>

      <p className="text-[9px] uppercase tracking-wider font-bold text-white/30">Seller (Optional Co-signer)</p>
      <div className="grid grid-cols-2 gap-2">
        <input className={FIELD} placeholder="Seller name" value={form.sellerName} onChange={set("sellerName")} />
        <input className={FIELD} placeholder="Seller email" value={form.sellerEmail} onChange={set("sellerEmail")} type="email" />
      </div>

      <button
        type="submit"
        disabled={sending}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-opacity hover:opacity-90 disabled:opacity-40"
        style={{ background: "#f5c242", color: "#04060a" }}
      >
        {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
        Send for Signature
      </button>

      {result && (
        <div
          className="flex items-start gap-2 px-3 py-2 rounded-lg text-[11px]"
          style={{
            background: result.ok ? "rgba(93,202,165,0.08)" : "rgba(226,75,74,0.08)",
            border: `0.5px solid ${result.ok ? "rgba(93,202,165,0.25)" : "rgba(226,75,74,0.25)"}`,
            color: result.ok ? "#5dcaa5" : "#e24b4a",
          }}
        >
          {result.ok ? <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />}
          <span>{result.msg}</span>
        </div>
      )}
    </form>
  );
}