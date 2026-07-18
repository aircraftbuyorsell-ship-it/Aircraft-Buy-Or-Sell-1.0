import { Link } from "react-router-dom";

export default function FinalCTASection() {
  return (
    <section className="border-t border-black/[0.06] bg-white">
      <div className="mx-auto max-w-[860px] px-5 py-24 text-center sm:px-8">
        <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[#1a1a1a] sm:text-4xl">
          Make Your Next Aircraft Decision<br />With Better Information
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-[13px] leading-7 text-[#666]">
          Search the market, understand the aircraft, evaluate available evidence and connect with the right people through one aviation intelligence platform.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/listings" className="rounded-xl bg-[#D4A017] px-6 py-3 text-[13px] font-bold text-white hover:opacity-90">Search Aircraft</Link>
          <Link to="/listings" className="rounded-xl border border-black/[0.12] bg-white px-6 py-3 text-[13px] font-semibold text-[#1a1a1a] hover:bg-black/[0.03]">Create a Listing</Link>
          <Link to="/ati-center" className="rounded-xl border border-black/[0.12] bg-white px-6 py-3 text-[13px] font-semibold text-[#1a1a1a] hover:bg-black/[0.03]">Explore Intelligence</Link>
        </div>
      </div>
    </section>
  );
}