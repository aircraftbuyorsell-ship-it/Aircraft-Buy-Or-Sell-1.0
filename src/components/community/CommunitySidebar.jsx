import { Plane, Sparkles, Users, Megaphone, Facebook, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { C } from "@/theme/community";

const GROWTH_TOOLS = [
  { path: "/facebook-publish", label: "Facebook Publisher", desc: "Post aircraft listings to your pages", icon: Facebook },
  { path: "/meta-ads-optimizer", label: "Meta Ads Optimizer", desc: "Auto-adjust budgets by lead conversions", icon: Megaphone },
];

const RULES = ["Aircraft posts only", "Price, location, and registration recommended", "Respect owners, brokers, and mechanics", "Verify documents before funds move"];

export default function CommunitySidebar() {
  return (
    <aside className="space-y-4">
      <div className="rounded-[1.5rem] p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: C.blue, color: "#fff" }}>
          <Users className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-black tracking-[-0.04em]" style={{ color: C.text }}>Community Purpose</h3>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: C.textMuted }}>
          A focused space for Piper and Cessna aircraft buying, selling, ownership questions, maintenance references, and trusted introductions.
        </p>
      </div>

      <div className="rounded-[1.5rem] p-5" style={{ background: C.card, border: `1px solid ${C.gold}30` }}>
        <div className="mb-3 flex items-center gap-2" style={{ color: C.gold }}>
          <Sparkles className="h-4 w-4" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em]">Posting Rules</p>
        </div>
        <ul className="space-y-2 text-sm" style={{ color: C.textMuted }}>
          {RULES.map((rule) => (
            <li key={rule} className="flex gap-2"><Plane className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: C.gold }} /> {rule}</li>
          ))}
        </ul>
      </div>

      <div className="rounded-[1.5rem] p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <div className="mb-3 flex items-center gap-2" style={{ color: C.blue }}>
          <Megaphone className="h-4 w-4" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em]">Growth Tools</p>
        </div>
        <div className="space-y-2">
          {GROWTH_TOOLS.map((tool) => (
            <Link
              key={tool.path}
              to={tool.path}
              className="group flex items-start gap-3 rounded-xl p-3 transition-colors"
              style={{ background: C.cardHover, border: `1px solid ${C.border}` }}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: `${C.blue}18` }}>
                <tool.icon className="h-4 w-4" style={{ color: C.blue }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold" style={{ color: C.text }}>{tool.label}</p>
                <p className="text-[11px] leading-snug" style={{ color: C.textDim }}>{tool.desc}</p>
              </div>
              <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 opacity-30 transition-opacity group-hover:opacity-80" style={{ color: C.text }} />
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}