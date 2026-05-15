import { ExternalLink, Plane, Search, Users } from "lucide-react";

export default function CommunityHero() {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/25 bg-[#0B2D5B] min-h-[420px] shadow-2xl">
      <img
        src="https://media.base44.com/images/public/69f665b6d05c695ac1e7b353/aad075b19_624324958_2759110867807924_1126729800774297176_n.jpg"
        alt="Piper aircraft on runway"
        className="absolute inset-0 h-full w-full object-cover opacity-70" />
      
      <div className="absolute inset-0 bg-gradient-to-r from-[#0B2D5B]/92 via-[#0B2D5B]/54 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-8 bg-[#111113]/90" />
      <div className="absolute left-[28%] top-0 bottom-0 w-3 bg-[#111113]/65 shadow-2xl" />
      <div className="absolute right-[26%] top-0 bottom-0 w-3 bg-[#111113]/65 shadow-2xl rotate-[2deg]" />
      <div className="absolute inset-0 bg-white/[0.04] backdrop-blur-[1px]" />

      <div className="relative z-10 flex min-h-[420px] flex-col justify-between p-6 md:p-9">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-[#E8A83A] backdrop-blur-xl">
          <Plane className="h-3.5 w-3.5" /> Piper · Cessna Community
        </div>

        <div className="max-w-3xl rounded-[2rem] border border-white/25 bg-white/[0.12] p-6 backdrop-blur-2xl shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.24em] text-[#E8A83A]">Aircraft Buy or Sell Network</p>
          <h1 className="text-4xl font-black leading-[0.95] tracking-[-0.06em] text-white md:text-6xl">Aircraft Market

          </h1>
          <p className="mt-4 max-w-2xl text-sm font-medium leading-relaxed text-white/78 md:text-base">
            A clean community hub for aircraft owners, buyers, brokers, mechanics, and pilots to share listings, wanted posts, advice, and verified aircraft opportunities.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href="https://www.facebook.com/groups/pipercessna"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#E8A83A] px-5 py-3 text-xs font-black uppercase tracking-wide text-[#0B2D5B] shadow-xl transition-colors hover:bg-[#f5bb4e]">
              
              <Users className="h-4 w-4" /> Open Facebook Community <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-4 py-3 text-sm text-white/80 backdrop-blur-xl">
              <Search className="h-4 w-4 text-[#E8A83A]" /> Find aircraft, parts, leads, and advice
            </div>
          </div>
        </div>
      </div>
    </section>);

}