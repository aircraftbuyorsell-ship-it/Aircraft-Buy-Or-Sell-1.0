import { Link } from "react-router-dom";

const pillars = [
  { status: "Available Now", title: "ATI Scoring", copy: "One decision-ready score across 8 evidence-based aircraft dimensions, protected by deterministic scoring controls." },
  { status: "Phased Roadmap", title: "APL Protocol", copy: "The provenance and trust layer designed to explain why aircraft data, ownership records, and maintenance evidence can be trusted." },
  { status: "Available Now", title: "Core API Gateway", copy: "Scoped API access to search, valuation, structured listings, and aviation intelligence for partner workflows." },
];

export default function AutomationAdvantage() {
  return (
    <section className="mx-auto w-full max-w-[1120px] px-4 py-12 md:px-8 md:py-16">
      <div className="overflow-hidden rounded-[3.5rem] border-2 border-[#3E4953] bg-[#090B10] bg-cover bg-center bg-blend-multiply px-5 py-14 text-[#D7DCE2] shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_24px_70px_rgba(0,0,0,0.36)] sm:px-10 md:rounded-[6.5rem] md:px-20 md:py-20" style={{ backgroundImage: "url('https://media.base44.com/images/public/69f665b6d05c695ac1e7b353/2b9c342c7_generated_image.png')" }}>
        <div className="mx-auto max-w-[1080px] text-center">
          <h2 className="text-[clamp(2.35rem,5vw,4.75rem)] font-black leading-[0.98] tracking-[-0.045em] text-[#D7DCE2] [text-shadow:0_2px_0_#6F7780,0_4px_12px_rgba(0,0,0,0.65)]">The Automation Advantage</h2>
          <p className="mt-4 text-[clamp(1.25rem,2.4vw,2rem)] font-medium leading-tight text-[#D4A017]">From raw aircraft data to decision-ready trust.</p>
          <p className="mx-auto mt-6 max-w-[900px] text-[clamp(1rem,1.55vw,1.4rem)] leading-[1.4] text-[#D7DCE2]">ABOS is an automated quality-assurance layer—not just a database.<br className="hidden md:block" /> ATI measures aircraft transparency, the APL roadmap establishes<br className="hidden md:block" /> provenance, and the Core Gateway distributes the result.</p>
        </div>
        <div className="mx-auto mt-9 grid max-w-[1040px] gap-4 md:grid-cols-3">
          {pillars.map(({ status, title, copy }) => (
            <article key={title} className="overflow-hidden rounded-[1.35rem] border-2 border-[#51606C] bg-[#202831]/95 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.24)]">
              <div className="flex items-center justify-between gap-3 border-b-2 border-[#52606A] bg-[#172028] px-4 py-2.5 text-sm sm:text-base"><span className="text-[#AAB2B9]">Status</span><span className="whitespace-nowrap text-[#D4A017]">{status}</span></div>
              <div className="px-4 pb-5 pt-4"><h3 className="text-[clamp(1.25rem,1.8vw,1.65rem)] font-extrabold leading-tight text-[#D7DCE2]">{title}</h3><p className="mt-2 text-[clamp(0.95rem,1.25vw,1.12rem)] leading-[1.25] text-[#F0F2F4]">{copy}</p></div>
            </article>
          ))}
        </div>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-7"><Link to="/developers/core-api" className="inline-flex min-h-11 items-center rounded-xl bg-[#D7DCE2] px-5 py-2.5 text-base font-extrabold text-[#090B10] shadow-[inset_0_1px_0_#FFFFFF]">Explore Core API</Link><Link to="/escrow" className="inline-flex min-h-11 items-center px-2 py-2.5 text-base font-bold text-[#D7DCE2]">View Settlement Roadmap</Link></div>
      </div>
    </section>
  );
}