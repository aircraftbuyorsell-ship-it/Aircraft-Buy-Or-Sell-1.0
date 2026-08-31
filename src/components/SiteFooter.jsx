import { Link } from "react-router-dom";
import RegulatoryTrustStrip from "@/components/footer/RegulatoryTrustStrip";

const FOOTER_LINKS = [
  { to: "/developers", label: "Developers" },
  { to: "/developers/core-api", label: "Core API" },
  { to: "/integration-kit", label: "Integration Kit" },
  { to: "/skills", label: "Skills Library" },
  { to: "/privacy-policy", label: "Privacy Policy" },
  { to: "/cookie-policy", label: "Cookie Policy" },
  { to: "/gdpr-compliance", label: "GDPR" },
  { to: "/terms-of-service", label: "Terms" },
  { to: "/affiliate-agreement", label: "Affiliate" },
  { to: "/escrow-agreement", label: "Escrow" },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-black/[0.06] bg-[#111113] px-4 py-6 safe-bottom">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-black tracking-tight text-[#F0EDE6]">ABOS MarketSpace</p>
          <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[#E8A83A] mt-0.5">The Global Aircraft Identity & Sales Network</p>
          <p className="mt-1.5 text-xs text-[#8A8780]">
            Powered by{" "}
            <span className="text-white/40 font-semibold">IntraZone Intelligence</span>
            {" "}· ATI scoring & deal execution.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-4 gap-y-2">
          {FOOTER_LINKS.map((link) => (
            <Link key={link.to} to={link.to} className="text-xs font-bold text-[#8A8780] transition-colors hover:text-[#E8A83A]">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mx-auto mt-5 max-w-6xl">
        <RegulatoryTrustStrip />
      </div>
    </footer>
  );
}