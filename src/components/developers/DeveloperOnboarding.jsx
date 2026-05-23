import { useState } from "react";
import { Loader2, Code2, Coins, TrendingUp, ShieldCheck } from "lucide-react";

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

  return (
    <div className="max-w-2xl mx-auto">
      {/* Perks */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {PERKS.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-2xl border border-black/8 bg-white p-4 text-center">
            <div className="w-9 h-9 rounded-xl bg-[#0B2D5B]/10 flex items-center justify-center mx-auto mb-2">
              <Icon className="w-4 h-4 text-[#0B2D5B]" />
            </div>
            <p className="font-black text-xs text-[#1A1814] mb-0.5">{title}</p>
            <p className="text-[11px] text-[#6B6560] leading-snug">{desc}</p>
          </div>
        ))}
      </div>

      {/* Registration form */}
      <div className="rounded-2xl border border-black/8 bg-white p-6">
        <div className="flex items-center gap-2 mb-5">
          <Code2 className="w-5 h-5 text-[#0B2D5B]" />
          <h2 className="font-black text-[#1A1814] text-lg">Register as a Developer</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wide text-[#6B6560] mb-1.5">Company / Developer Name *</label>
            <input
              required
              value={form.company_name}
              onChange={(e) => setForm({ ...form, company_name: e.target.value })}
              className="w-full h-10 px-3 rounded-xl border border-black/10 bg-[#F7F4EF] text-sm text-[#1A1814] focus:outline-none focus:ring-2 focus:ring-[#E8A83A]/40"
              placeholder="Acme Aviation LLC"
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-wide text-[#6B6560] mb-1.5">Business Contact Email *</label>
            <input
              required type="email"
              value={form.contact_email}
              onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
              className="w-full h-10 px-3 rounded-xl border border-black/10 bg-[#F7F4EF] text-sm text-[#1A1814] focus:outline-none focus:ring-2 focus:ring-[#E8A83A]/40"
              placeholder="dev@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-wide text-[#6B6560] mb-1.5">Website</label>
            <input
              type="url"
              value={form.website_url}
              onChange={(e) => setForm({ ...form, website_url: e.target.value })}
              className="w-full h-10 px-3 rounded-xl border border-black/10 bg-[#F7F4EF] text-sm text-[#1A1814] focus:outline-none focus:ring-2 focus:ring-[#E8A83A]/40"
              placeholder="https://example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-wide text-[#6B6560] mb-1.5">Short Bio</label>
            <textarea
              rows={3}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-black/10 bg-[#F7F4EF] text-sm text-[#1A1814] focus:outline-none focus:ring-2 focus:ring-[#E8A83A]/40 resize-none"
              placeholder="Tell us about your aviation software background…"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 rounded-xl bg-[#0B2D5B] hover:bg-[#143C75] text-white font-black uppercase tracking-wide text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : "Apply for Developer Access"}
          </button>
          <p className="text-center text-xs text-[#AAA49C]">Applications are reviewed within 1–2 business days.</p>
        </form>
      </div>
    </div>
  );
}