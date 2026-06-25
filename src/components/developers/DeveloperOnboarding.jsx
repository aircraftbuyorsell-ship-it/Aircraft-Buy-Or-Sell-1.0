import { useState } from "react";
import { Loader2, Code2, Coins, TrendingUp, ShieldCheck } from "lucide-react";

const W1 = "rgba(255,255,255,0.90)";
const W2 = "rgba(255,255,255,0.60)";
const W3 = "rgba(255,255,255,0.35)";
const BORDER = "rgba(255,255,255,0.08)";
const AMBER = "#f5c242";
const BLUE = "#4e8ef7";
const CARD = "rgba(255,255,255,0.04)";

const PERKS = [
  { icon: Coins, title: "Earn on every call", desc: "Up to 80% revenue share per tool invocation." },
  { icon: TrendingUp, title: "Built-in distribution", desc: "Your tools are instantly available to all ABOS users." },
  { icon: ShieldCheck, title: "Secure & signed", desc: "HMAC-signed webhooks protect your endpoints." },
];

export default function DeveloperOnboarding({ onRegister, isLoading }) {
  const [form, setForm] = useState({ company_name: "", contact_email: "", website_url: "", bio: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    onRegister(form);
  };

  const inputStyle = { background: CARD, border: `0.5px solid ${BORDER}`, color: W1 };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="grid grid-cols-3 gap-3 mb-8">
        {PERKS.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-2xl p-4 text-center" style={{ background: CARD, border: `0.5px solid ${BORDER}` }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: "rgba(78,142,247,0.09)" }}>
              <Icon className="w-4 h-4" style={{ color: BLUE }} />
            </div>
            <p className="font-black text-xs mb-0.5" style={{ color: W1 }}>{title}</p>
            <p className="text-[11px] leading-snug" style={{ color: W2 }}>{desc}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl p-6" style={{ background: CARD, border: `0.5px solid ${BORDER}` }}>
        <div className="flex items-center gap-2 mb-5">
          <Code2 className="w-5 h-5" style={{ color: BLUE }} />
          <h2 className="font-black text-lg" style={{ color: W1 }}>Register as a Developer</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wide mb-1.5" style={{ color: W3 }}>Company / Developer Name *</label>
            <input required value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} className="w-full h-10 px-3 rounded-xl text-sm focus:outline-none" style={inputStyle} placeholder="Acme Aviation LLC" />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-wide mb-1.5" style={{ color: W3 }}>Business Contact Email *</label>
            <input required type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} className="w-full h-10 px-3 rounded-xl text-sm focus:outline-none" style={inputStyle} placeholder="dev@example.com" />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-wide mb-1.5" style={{ color: W3 }}>Website</label>
            <input type="url" value={form.website_url} onChange={(e) => setForm({ ...form, website_url: e.target.value })} className="w-full h-10 px-3 rounded-xl text-sm focus:outline-none" style={inputStyle} placeholder="https://example.com" />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-wide mb-1.5" style={{ color: W3 }}>Short Bio</label>
            <textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none resize-none" style={inputStyle} placeholder="Tell us about your aviation software background…" />
          </div>
          <button type="submit" disabled={isLoading} className="w-full h-11 rounded-xl font-black uppercase tracking-wide text-sm transition-opacity disabled:opacity-60 flex items-center justify-center gap-2" style={{ background: AMBER, color: "#04060a" }}>
            {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : "Apply for Developer Access"}
          </button>
          <p className="text-center text-xs" style={{ color: W3 }}>Applications are reviewed within 1–2 business days.</p>
        </form>
      </div>
    </div>
  );
}