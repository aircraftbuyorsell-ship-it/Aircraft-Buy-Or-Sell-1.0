import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowRight } from "lucide-react";

const REGISTRATION = /\b(?:N\d{1,5}[A-Z]{0,2}|[A-Z0-9]{1,2}-[A-Z0-9]{2,5})\b/i;

export default function Dashboard() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const submit = (event) => {
    event?.preventDefault();
    const value = query.trim();
    if (!value) return;
    const match = value.match(REGISTRATION)?.[0] || value;
    navigate(`/finance-advisor?registration=${encodeURIComponent(match.toUpperCase())}`);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070B12] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(212,160,23,0.12),transparent_28%),radial-gradient(circle_at_50%_50%,rgba(45,75,120,0.16),transparent_48%)]" />
      <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(rgba(255,255,255,0.45)_0.7px,transparent_0.7px)] [background-size:22px_22px]" />

      <header className="relative z-20 flex items-center justify-between px-6 py-6 md:px-10">
        <div className="text-xl font-black tracking-[0.18em]">ABOS</div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/40">Aircraft Intelligence</div>
      </header>

      <section className="relative z-10 flex min-h-[calc(100vh-88px)] flex-col items-center justify-center px-5 pb-16 text-center">
        <div className="relative mb-10 h-[min(62vw,430px)] w-[min(62vw,430px)] rounded-full border border-white/10 bg-[radial-gradient(circle_at_35%_28%,rgba(255,255,255,0.16),transparent_13%),radial-gradient(circle_at_38%_38%,#1d3553_0%,#0d1a2b_42%,#05080e_72%)] shadow-[0_0_100px_rgba(70,110,170,0.22)] animate-[spin_45s_linear_infinite]">
          <div className="absolute inset-[7%] rounded-full border border-white/5" />
          <div className="absolute left-[8%] top-[34%] h-px w-[84%] rotate-[13deg] bg-[#D4A017]/45 shadow-[0_0_14px_rgba(212,160,23,0.35)]" />
          <div className="absolute left-[18%] top-[58%] h-px w-[64%] -rotate-[19deg] bg-white/20" />
          <span className="absolute left-[24%] top-[29%] h-1.5 w-1.5 rounded-full bg-[#D4A017] shadow-[0_0_12px_#D4A017]" />
          <span className="absolute right-[22%] top-[48%] h-1.5 w-1.5 rounded-full bg-white/70 shadow-[0_0_10px_white]" />
          <span className="absolute left-[47%] bottom-[24%] h-1.5 w-1.5 rounded-full bg-[#D4A017] shadow-[0_0_12px_#D4A017]" />
        </div>

        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.34em] text-[#D4A017]">Aircraft Buy Or Sell</p>
        <h1 className="max-w-3xl text-4xl font-black tracking-tight md:text-6xl">Know the aircraft before you buy it.</h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-white/50 md:text-base">Search a tail number or aircraft. ABOS turns fragmented aviation data into one aircraft intelligence profile.</p>

        <form onSubmit={submit} className="mt-8 flex w-full max-w-2xl items-center rounded-2xl border border-white/15 bg-white/[0.07] p-1.5 shadow-2xl backdrop-blur-xl focus-within:border-[#D4A017]/60">
          <Search className="ml-4 h-5 w-5 shrink-0 text-white/35" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tail number, aircraft or model…" className="min-w-0 flex-1 bg-transparent px-4 py-3.5 text-sm text-white outline-none placeholder:text-white/30" autoFocus />
          <button type="submit" disabled={!query.trim()} className="flex h-11 items-center gap-2 rounded-xl bg-[#D4A017] px-5 text-sm font-bold text-[#07101B] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-35">
            Analyze <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-5 flex flex-wrap justify-center gap-2 text-[11px] text-white/30">
          {['N7692J', 'OK-PES', 'OM-PES'].map((sample) => <button key={sample} type="button" onClick={() => { setQuery(sample); navigate(`/finance-advisor?registration=${sample}`); }} className="rounded-full border border-white/10 px-3 py-1.5 hover:border-[#D4A017]/50 hover:text-white/60">{sample}</button>)}
        </div>
      </section>
    </main>
  );
}