import { Link } from "react-router-dom";
import { ArrowRight, Handshake, ScanSearch, Scale, Wrench } from "lucide-react";

const SERVICES = [
  { icon: Handshake, title: "Aircraft Transactions", desc: "Acquisition, sales and deal coordination.", to: "/escrow" },
  { icon: ScanSearch, title: "Inspection & Verification", desc: "Pre-buy inspections, records and expert checks.", to: "/pre-buy-inspection" },
  { icon: Wrench, title: "Operations & Maintenance", desc: "MRO, engines, avionics and operating support.", to: "/service-intelligence" },
  { icon: Scale, title: "Finance, Legal & Cross-Border", desc: "Leasing, contracts and cross-border transfers.", to: "/cross-border-bridge" },
];

export default function ProfessionalServicesSection() {
  return (
    <section className="border-t border-black/[0.06] bg-white">
      <div className="mx-auto max-w-[1100px] px-5 py-20 sm:px-8">
        <h2 className="text-center text-[11px] font-bold uppercase tracking-[0.24em] text-[#D4A017]">Professional Services</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {SERVICES.map(({ icon: Icon, title, desc, to }) => (
            <Link key={title} to={to} className="group rounded-2xl border border-black/[0.07] bg-[#fbfaf7] p-6 transition-all hover:border-[#D4A017]/40">
              <Icon size={18} className="text-[#D4A017]" />
              <div className="mt-3 text-[14px] font-bold text-[#1a1a1a]">{title}</div>
              <div className="mt-1 text-[12px] leading-5 text-[#777]">{desc}</div>
            </Link>
          ))}
        </div>
        <div className="mt-8 text-right">
          <Link to="/service-intelligence" className="inline-flex items-center gap-2 text-[13px] font-bold text-[#D4A017] hover:gap-3">
            Browse Professional Services <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}