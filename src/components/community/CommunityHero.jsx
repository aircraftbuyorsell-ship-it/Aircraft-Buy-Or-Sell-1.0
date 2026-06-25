import { ExternalLink, Plane, Search, Users } from "lucide-react";
import { C } from "@/theme/community";

export default function CommunityHero() {
  return (
    <section className="relative overflow-hidden rounded-[2rem] min-h-[420px]" style={{ background: C.card, border: `1px solid ${C.border}` }}>
      <img
        src="https://media.base44.com/images/public/69f665b6d05c695ac1e7b353/aad075b19_624324958_2759110867807924_1126729800774297176_n.jpg"
        alt="Piper aircraft on runway"
        className="absolute inset-0 h-full w-full object-cover opacity-40" />

      <div className="absolute inset-0" style={{ background: `linear-gradient(to right, ${C.bg}f2, ${C.bg}88 60%, transparent)` }} />
      <div className="absolute inset-x-0 top-0 h-8" style={{ background: C.card }} />
      <div className="absolute left-[28%] top-0 bottom-0 w-3 opacity-50" style={{ background: C.card }} />
      <div className="absolute right-[26%] top-0 bottom-0 w-3 opacity-50 rotate-[2deg]" style={{ background: C.card }} />

      <div className="relative z-10 flex min-h-[420px] flex-col justify-between p-6 md:p-9">
        <div className="inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em]" style={{ border: `1px solid ${C.gold}40`, background: `${C.gold}12`, color: C.goldLight }}>
          <Plane className="h-3.5 w-3.5" /> Piper · Cessna Community
        </div>

        <div className="max-w-3xl rounded-[2rem] p-6" style={{ border: `1px solid ${C.borderMd}`, background: `${C.card}e6` }}>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.24em]" style={{ color: C.gold }}>Aircraft Buy or Sell Network</p>
          <h1 className="text-4xl font-black leading-[0.95] tracking-[-0.06em] md:text-6xl" style={{ color: C.text }}>Aircraft Marketplace</h1>
          <p className="mt-4 max-w-2xl text-sm font-medium leading-relaxed md:text-base" style={{ color: C.textMuted }}>
            A clean community hub for aircraft owners, buyers, brokers, mechanics, and pilots to share listings, wanted posts, advice, and verified aircraft opportunities.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href="https://www.facebook.com/groups/pipercessna"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-xs font-black uppercase tracking-wide shadow-xl transition-colors"
              style={{ background: C.gold, color: C.bg }}>
              <Users className="h-4 w-4" /> Open Facebook Community <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <div className="flex items-center gap-2 rounded-full px-4 py-3 text-sm" style={{ border: `1px solid ${C.borderMd}`, color: C.textMuted }}>
              <Search className="h-4 w-4" style={{ color: C.gold }} /> Find aircraft, parts, leads, and advice
            </div>
          </div>
        </div>
      </div>
    </section>);
}