import RegulatoryTrustStrip from "@/components/footer/RegulatoryTrustStrip";
import FooterSitemap from "@/components/footer/FooterSitemap";

export default function SiteFooter() {
  return (
    <footer className="safe-bottom border-t border-black/[0.06] bg-[#111113] px-5 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-sm font-black text-[#F0EDE6]">ABOS MarketSpace</p>
          <p className="mt-1 text-[10px] font-semibold uppercase text-primary">
            The Global Aircraft Identity & Sales Network
          </p>
        </div>
        <FooterSitemap />
        <div className="mt-10">
          <RegulatoryTrustStrip />
        </div>
      </div>
    </footer>
  );
}