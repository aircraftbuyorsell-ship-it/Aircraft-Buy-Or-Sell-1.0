import { useState } from "react";
import { X, Loader2, Zap } from "lucide-react";

const W1 = "rgba(255,255,255,0.90)";
const W2 = "rgba(255,255,255,0.60)";
const W3 = "rgba(255,255,255,0.35)";
const BORDER = "rgba(255,255,255,0.08)";
const AMBER = "#f5c242";
const BLUE = "#4e8ef7";
const CARD = "rgba(255,255,255,0.04)";

const CATEGORIES = ["data", "analytics", "ai", "compliance", "valuation", "communication", "other"];

const INIT = {
  name: "", description: "", category: "other",
  webhook_url: "", openapi_spec_url: "", logo_url: "",
  token_cost: 5, revenue_share_pct: 30, tags: "",
};

const inputCls = "w-full h-10 px-3 rounded-xl text-sm focus:outline-none";
const inputStyle = { background: CARD, border: `0.5px solid ${BORDER}`, color: W1 };

export default function SubmitToolModal({ onSubmit, onClose, isLoading }) {
  const [form, setForm] = useState(INIT);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const tagsArr = form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
    onSubmit({ ...form, tags: tagsArr, token_cost: Number(form.token_cost), revenue_share_pct: Number(form.revenue_share_pct) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div className="w-full max-w-lg rounded-2xl shadow-2xl max-h-[90vh] flex flex-col" style={{ background: "rgba(13,17,23,0.98)", border: `0.5px solid ${BORDER}` }}>
        <div className="flex items-center justify-between p-5 flex-shrink-0" style={{ borderBottom: `0.5px solid ${BORDER}` }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(78,142,247,0.09)" }}>
              <Zap className="w-4 h-4" style={{ color: BLUE }} />
            </div>
            <h2 className="font-black" style={{ color: W1 }}>Submit a New Tool</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5">
            <X className="w-4 h-4" style={{ color: W3 }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          <Field label="Tool Name *">
            <input required value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} style={inputStyle} placeholder="My Aviation Tool" />
          </Field>

          <Field label="Description *">
            <textarea required rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} className={`${inputCls} resize-none`} style={inputStyle} placeholder="What does this tool do?" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <select value={form.category} onChange={(e) => set("category", e.target.value)} className={inputCls} style={inputStyle}>
                {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
            </Field>
            <Field label="Token Cost (1–500)">
              <input required type="number" min={1} max={500} value={form.token_cost} onChange={(e) => set("token_cost", e.target.value)} className={inputCls} style={inputStyle} />
            </Field>
          </div>

          <Field label="Webhook URL *">
            <input required type="url" value={form.webhook_url} onChange={(e) => set("webhook_url", e.target.value)} className={inputCls} style={inputStyle} placeholder="https://your-api.com/webhook" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="OpenAPI Spec URL">
              <input type="url" value={form.openapi_spec_url} onChange={(e) => set("openapi_spec_url", e.target.value)} className={inputCls} style={inputStyle} placeholder="https://…/openapi.json" />
            </Field>
            <Field label="Logo URL">
              <input type="url" value={form.logo_url} onChange={(e) => set("logo_url", e.target.value)} className={inputCls} style={inputStyle} placeholder="https://…/logo.png" />
            </Field>
          </div>

          <Field label="Revenue Share % (0–80)" hint={`You earn ${form.revenue_share_pct}% of ${form.token_cost} tokens = ${Math.round(form.token_cost * form.revenue_share_pct / 100 * 10) / 10} tokens/call`}>
            <input type="number" min={0} max={80} value={form.revenue_share_pct} onChange={(e) => set("revenue_share_pct", e.target.value)} className={inputCls} style={inputStyle} />
          </Field>

          <Field label="Tags (comma-separated)">
            <input value={form.tags} onChange={(e) => set("tags", e.target.value)} className={inputCls} style={inputStyle} placeholder="faa, registry, aircraft" />
          </Field>

          <p className="text-xs rounded-xl p-3" style={{ background: CARD, color: W3 }}>
            Your tool will be reviewed by an admin before going live. You'll receive a webhook signing secret after approval.
          </p>
        </form>

        <div className="flex gap-3 p-5 flex-shrink-0" style={{ borderTop: `0.5px solid ${BORDER}` }}>
          <button type="button" onClick={onClose} disabled={isLoading} className="flex-1 h-10 rounded-xl text-sm font-bold transition-opacity hover:opacity-80" style={{ background: "transparent", border: `0.5px solid ${BORDER}`, color: W2 }}>
            Cancel
          </button>
          <button form="submit-tool-form" onClick={handleSubmit} disabled={isLoading} className="flex-1 h-10 rounded-xl text-sm font-black uppercase tracking-wide disabled:opacity-60 flex items-center justify-center gap-2 transition-opacity hover:opacity-90" style={{ background: AMBER, color: "#04060a" }}>
            {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : "Submit for Review"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-black uppercase tracking-wide mb-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11px]" style={{ color: "#f5c242" }}>{hint}</p>}
    </div>
  );
}