import { Link } from "react-router-dom";
import { BadgeCheck, Calculator, FileText, Plane, Radar, ScrollText } from "lucide-react";

const ACTIONS = [
  { icon: BadgeCheck, title: "Verify Aircraft", desc: "Identity, sources, records and findings", to: "/ati-verify" },
  { icon: Calculator, title: "Estimate Value", desc: "Market position, comparable aircraft", to: "/valuation" },
  { icon: ScrollText, title: "Search Registry", desc: "Registration, serial, owner and operator", to: "/n-lookup" },
  { icon: Radar, title: "Track Aircraft", desc: "Activity and signal monitoring", to: "/traffic" },
  { icon: Plane, title: "Sell Aircraft", desc: "Create and manage a trusted listing", to: "/listings" },
  { icon: FileText, title: "Generate ATI Report", desc: "Build structured intelligence output", to: "/ati-full-report" },
];

export default function QuickActionsSection() {
  return (
    <section className="bg-[#fbfaf7]">
      <div className="mx-auto max-w-[1360px] px-5 py-16 sm:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ACTIONS.map(({ icon: Icon, title, desc, to }) => (
            <Link key={title} to={to} className="group rounded-2xl border border-black/[0.07] bg-white p-6 shadow-sm transition-all hover:border-[#D4A017]/40 hover:shadow-md">
              <Icon size={20} className="text-[#D4A017]" />
              <div className="mt-3 text-[14px] font-bold text-[#1a1a1a] group-hover:text-[#A67C00]">{title}</div>
              <div className="mt-1 text-[12px] leading-5 text-[#777]">{desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}