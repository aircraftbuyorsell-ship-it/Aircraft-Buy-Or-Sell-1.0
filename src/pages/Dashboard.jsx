import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Globe2, Search, ShieldCheck, Sparkles, LockKeyhole, FileCheck2 } from "lucide-react";

const REGISTRATION = /\b(?:N\d{1,5}[A-Z]{0,2}|[A-Z0-9]{1,2}-[A-Z0-9]{2,5})\b/i;
const SAMPLES = ["N7692J", "OK-PES", "OM-PES"];

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

  const searchSample = (sample) => {
    setQuery(sample);
    navigate(`/finance-advisor?registration=${sample}`);
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#fbfaf7] text-[#102033]">
      <header className="relative z-20 border-b border-[#102033]/[0.08] bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-6 md:px-10">
          <button onClick={() => navigate("/")} className="flex items-center gap-3 text-left">
            <img src="https://media.base44.com/images/public/workspaces/6998b56ab3d79ca33dfcf1d0/brands/e2c3611ed_brand_upload_logo.jpg" alt="ABOS Logo" className="h-11 w-11 rounded-full object-cover shadow-lg ring-1 ring-[#c99635]" />
            <span><span className="block text-[25px] font-black leading-none tracking-tight">ABOS</span><span className="mt-1 block text-[8px] font-semibold tracking-[0.25em] text-[#a67b2c]">AIRCRAFT BUY OR SELL</span></span>
          </button>
          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            <button className="hover:text-[#b5822b]">About Us</button>
            <button className="hover:text-[#b5822b]">How It Works</button>
            <button className="hover:text-[#b5822b]">FAQ</button>
            <button onClick={() => navigate("/my-account")} className="hover:text-[#b5822b]">User Account</button>
          </nav>
          <div className="flex items-center gap-3">
            <form onSubmit={submit} className="hidden w-[260px] items-center rounded-xl border border-[#c99635]/50 bg-white px-3 shadow-sm md:flex">
              <Search className="h-4 w-4 text-[#102033]/45" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search registration..." className="min-w-0 flex-1 bg-transparent px-2 py-2.5 text-xs outline-none placeholder:text-[#102033]/35" />
            </form>
            <button onClick={() => navigate("/my-account")} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#102033]/10 bg-white shadow-sm">◯</button>
          </div>
        </div>
      </header>

      <section className="relative mx-auto max-w-[1440px] px-6 pb-8 pt-10 md:px-16 md:pt-16">
        <div className="pointer-events-none absolute right-[-120px] top-[-40px] h-[680px] w-[680px] rounded-full opacity-90 [background-image:radial-gradient(rgba(183,139,54,0.36)_0.8px,transparent_0.8px)] [background-size:8px_8px] [mask-image:radial-gradient(circle,black_35%,transparent_72%)]" />
        <div className="pointer-events-none absolute right-[4%] top-[100px] h-[560px] w-[560px] rounded-full border border-[#d6a33e]/30" />
        <div className="pointer-events-none absolute right-[11%] top-[170px] h-[420px] w-[420px] rounded-full border border-[#d6a33e]/20" />
        <div className="relative grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="max-w-[700px] pt-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#a87925]">AVIATION INTELLIGENCE PLATFORM</p>
            <h1 className="mt-5 text-5xl font-black leading-[0.98] tracking-[-0.045em] md:text-7xl">Verify before you<br />Sell or Buy.</h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#102033]/60 md:text-lg">Verified data. Real market insights. Greater confidence.</p>

            <form onSubmit={submit} className="mt-9 flex max-w-2xl items-center rounded-2xl border border-[#c99635] bg-white p-1.5 shadow-[0_18px_50px_rgba(16,32,51,0.09)] focus-within:ring-4 focus-within:ring-[#d6a33e]/10">
              <span className="ml-4 text-lg">✈</span>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search aircraft registration..." className="min-w-0 flex-1 bg-transparent px-4 py-4 text-sm outline-none placeholder:text-[#102033]/35 md:text-base" autoFocus />
              <button type="submit" disabled={!query.trim()} className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#c99635] text-white shadow-sm transition hover:brightness-105 disabled:opacity-40"><ArrowRight className="h-5 w-5" /></button>
            </form>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[#102033]/50"><span className="mr-1">Quick search:</span>{SAMPLES.map((sample) => <button key={sample} onClick={() => searchSample(sample)} className="rounded-full border border-[#102033]/10 bg-white px-4 py-2 font-semibold hover:border-[#c99635]/60 hover:text-[#a87925]">{sample}</button>)}<button onClick={() => setQuery("")} className="flex items-center gap-1 rounded-full border border-[#102033]/10 bg-white px-4 py-2 font-semibold"><Globe2 className="h-3.5 w-3.5" /> Global search</button></div>
          </div>

          <div className="relative hidden min-h-[510px] lg:block">
            <div className="absolute right-[8%] top-[40px] h-[500px] w-[500px] rounded-full [background:radial-gradient(circle_at_35%_25%,#ffffff_0%,#f1eee6_42%,#ded8ca_100%)] shadow-[0_30px_80px_rgba(16,32,51,0.08)] [background-image:radial-gradient(rgba(16,32,51,0.25)_0.9px,transparent_0.9px)] [background-size:9px_9px]" />
            <div className="absolute right-[2%] top-[120px] h-px w-[650px] rotate-[15deg] bg-[#c99635]/45" />
            <div className="absolute right-[7%] top-[310px] h-px w-[620px] -rotate-[18deg] bg-[#c99635]/35" />
            <div className="absolute right-[35%] top-[180px] h-3 w-3 rounded-full bg-[#d6a33e] shadow-[0_0_20px_rgba(214,163,62,0.7)]" />
            <div className="absolute right-[12%] top-[350px] h-2.5 w-2.5 rounded-full bg-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.5)]" />
            <div className="absolute right-[2%] top-[105px] w-[380px] rounded-3xl border border-[#102033]/10 bg-white/95 p-5 shadow-[0_25px_70px_rgba(16,32,51,0.13)] backdrop-blur-xl">
              <div className="flex items-center gap-4"><div className="h-20 w-24 rounded-xl bg-[#e8e4db] p-3 text-center text-3xl">✈</div><div><div className="text-xl font-black">N7692J 🇺🇸</div><div className="mt-1 text-sm text-[#102033]/60">Piper PA-28R-180</div><div className="mt-1 text-xs text-[#102033]/45">1983 · Aircraft profile</div></div></div>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"><ShieldCheck className="h-4 w-4" /> Registry evidence available</div>
              <button onClick={() => searchSample("N7692J")} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#c99635] px-4 py-3 text-sm font-bold text-white">Open Aircraft Advisor <ArrowRight className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1380px] px-6 pb-10 md:px-12">
        <div className="grid overflow-hidden rounded-3xl border border-[#102033]/10 bg-white shadow-[0_20px_60px_rgba(16,32,51,0.06)] md:grid-cols-4">
          {[
            [ShieldCheck, "VERIFIED DATA", "Registry, ownership, documents & more."],
            [Globe2, "GLOBAL NETWORK", "FAA, EASA and 100+ registries worldwide."],
            [FileCheck2, "INTELLIGENCE REPORTS", "ATI, valuation, market & deal analysis."],
            [LockKeyhole, "SECURE PLATFORM", "Your data. Your control."],
          ].map(([Icon, title, text]) => <div key={title} className="border-b border-[#102033]/10 p-7 last:border-0 md:border-b-0 md:border-r"><Icon className="h-8 w-8 text-[#b98427]" /><h3 className="mt-4 text-sm font-black tracking-wide">{title}</h3><p className="mt-2 text-xs leading-5 text-[#102033]/50">{text}</p></div>)}
        </div>
        <div className="mt-6 flex flex-col gap-5 rounded-3xl border border-[#102033]/10 bg-white p-7 shadow-sm md:flex-row md:items-center md:justify-between"><div><span className="inline-flex items-center gap-1 rounded-full bg-[#f4ead5] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#9b6e21]"><Sparkles className="h-3 w-3" /> New</span><h2 className="mt-3 text-2xl font-black">Aircraft Advisor</h2><p className="mt-1 text-sm text-[#102033]/55">One place for aircraft identity, registry, valuation, verification and market intelligence.</p></div><button onClick={() => searchSample("N7692J")} className="flex items-center justify-center gap-2 rounded-xl bg-[#c99635] px-6 py-3 text-sm font-bold text-white">Open Aircraft Advisor <ArrowRight className="h-4 w-4" /></button></div>
        <div className="flex items-center justify-between pt-8 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#102033]/35"><span>Trust by design</span><span>Transparency. Verification. Control.</span></div>
      </section>
    </main>
  );
}