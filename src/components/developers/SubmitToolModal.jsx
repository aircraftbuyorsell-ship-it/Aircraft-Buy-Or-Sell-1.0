import { useState } from "react";
import { X, Loader2, Zap } from "lucide-react";

const CATEGORIES = ["data", "analytics", "ai", "compliance", "valuation", "communication", "other"];

const INIT = {
  name: "", description: "", category: "other",
  webhook_url: "", openapi_spec_url: "", logo_url: "",
  token_cost: 5, revenue_share_pct: 30, tags: "",
};

export default function SubmitToolModal({ onSubmit, onClose, isLoading }) {
  const [form, setForm] = useState(INIT);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const tagsArr = form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
    onSubmit({ ...form, tags: tagsArr, token_cost: Number(form.token_cost), revenue_share_pct: Number(form.revenue_share_pct) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-black/8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-black/8 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0B2D5B]/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-[#0B2D5B]" />
            </div>
            <h2 className="font-black text-[#1A1814]">Submit a New Tool</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-black/5 flex items-center justify-center">
            <X className="w-4 h-4 text-[#6B6560]" />
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          <Field label="Tool Name *">
            <input required value={form.name} onChange={(e) => set("name", e.target.value)}
              className={inputCls} placeholder="My Aviation Tool" />
          </Field>

          <Field label="Description *">
            <textarea required rows={3} value={form.description} onChange={(e) => set("description", e.target.value)}
              className={`${inputCls} resize-none`} placeholder="What does this tool do?" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <select value={form.category} onChange={(e) => set("category", e.target.value)} className={inputCls}>
                {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
            </Field>
            <Field label="Token Cost (1–500)">
              <input required type="number" min={1} max={500} value={form.token_cost}
                onChange={(e) => set("token_cost", e.target.value)} className={inputCls} />
            </Field>
          </div>

          <Field label="Webhook URL *">
            <input required type="url" value={form.webhook_url} onChange={(e) => set("webhook_url", e.target.value)}
              className={inputCls} placeholder="https://your-api.com/webhook" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="OpenAPI Spec URL">
              <input type="url" value={form.openapi_spec_url} onChange={(e) => set("openapi_spec_url", e.target.value)}
                className={inputCls} placeholder="https://…/openapi.json" />
            </Field>
            <Field label="Logo URL">
              <input type="url" value={form.logo_url} onChange={(e) => set("logo_url", e.target.value)}
                className={inputCls} placeholder="https://…/logo.png" />
            </Field>
          </div>

          <Field label="Revenue Share % (0–80)" hint={`You earn ${form.revenue_share_pct}% of ${form.token_cost} tokens = ${Math.round(form.token_cost * form.revenue_share_pct / 100 * 10) / 10} tokens/call`}>
            <input type="number" min={0} max={80} value={form.revenue_share_pct}
              onChange={(e) => set("revenue_share_pct", e.target.value)} className={inputCls} />
          </Field>

          <Field label="Tags (comma-separated)">
            <input value={form.tags} onChange={(e) => set("tags", e.target.value)}
              className={inputCls} placeholder="faa, registry, aircraft" />
          </Field>

          <p className="text-xs text-[#AAA49C] bg-[#F7F4EF] rounded-xl p-3">
            Your tool will be reviewed by an admin before going live. You'll receive a webhook signing secret after approval.
          </p>
        </form>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-black/8 flex-shrink-0">
          <button type="button" onClick={onClose} disabled={isLoading}
            className="flex-1 h-10 rounded-xl border border-black/10 text-sm font-bold text-[#6B6560] hover:bg-black/5">
            Cancel
          </button>
          <button
            form="submit-tool-form"
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 h-10 rounded-xl bg-[#0B2D5B] hover:bg-[#143C75] text-white text-sm font-black uppercase tracking-wide disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : "Submit for Review"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputCls = "w-full h-10 px-3 rounded-xl border border-black/10 bg-[#F7F4EF] text-sm text-[#1A1814] focus:outline-none focus:ring-2 focus:ring-[#E8A83A]/40";

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-black uppercase tracking-wide text-[#6B6560] mb-1.5">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-[#A67C00]">{hint}</p>}
    </div>
  );
}