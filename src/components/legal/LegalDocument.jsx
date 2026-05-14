import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export function LegalSection({ title, children }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-black tracking-tight text-[#1A1814]">{title}</h2>
      <div className="space-y-3 text-sm leading-7 text-[#4A4845]">{children}</div>
    </section>
  );
}

export default function LegalDocument({ label, title, effectiveDate = "May 14, 2026", children }) {
  return (
    <div className="min-h-screen bg-[#F7F4EF] px-4 py-8 md:px-8">
      <div className="mx-auto max-w-4xl">
        <Link to="/" className="mb-5 inline-flex items-center gap-1.5 text-[11px] text-[#AAA49C] transition-colors hover:text-[#D4A017]">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to IntraZone
        </Link>
        <div className="space-y-8 rounded-2xl border border-black/[0.07] bg-white p-6 md:p-10">
          <div className="border-b border-black/[0.06] pb-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#0B2D5B]">
              <ShieldCheck className="h-6 w-6 text-[#E8A83A]" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#D4A017]">{label}</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-[#1A1814] md:text-4xl">{title}</h1>
            <p className="mt-2 text-sm text-[#6B6560]">Effective date: {effectiveDate}</p>
          </div>
          {children}
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-6 text-amber-900">
            This document is provided for platform transparency and should be reviewed by qualified legal counsel before production reliance.
          </div>
        </div>
      </div>
    </div>
  );
}