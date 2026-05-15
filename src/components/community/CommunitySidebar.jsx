import { Plane, Sparkles, Users } from "lucide-react";

const RULES = ["Aircraft posts only", "Price, location, and registration recommended", "Respect owners, brokers, and mechanics", "Verify documents before funds move"];

export default function CommunitySidebar() {
  return (
    <aside className="space-y-4">
      <div className="rounded-[1.5rem] border border-white/70 bg-white/62 p-5 shadow-[0_18px_55px_rgba(11,45,91,0.08)] backdrop-blur-xl">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0B2D5B] text-white">
          <Users className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-black tracking-[-0.04em] text-[#1A1814]">Community Purpose</h3>
        <p className="mt-2 text-sm leading-relaxed text-[#6B6560]">
          A focused space for Piper and Cessna aircraft buying, selling, ownership questions, maintenance references, and trusted introductions.
        </p>
      </div>

      <div className="rounded-[1.5rem] border border-[#E8A83A]/30 bg-[#0B2D5B]/90 p-5 text-white shadow-xl backdrop-blur-xl">
        <div className="mb-3 flex items-center gap-2 text-[#E8A83A]">
          <Sparkles className="h-4 w-4" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em]">Posting Rules</p>
        </div>
        <ul className="space-y-2 text-sm text-white/78">
          {RULES.map((rule) => (
            <li key={rule} className="flex gap-2"><Plane className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#E8A83A]" /> {rule}</li>
          ))}
        </ul>
      </div>
    </aside>
  );
}