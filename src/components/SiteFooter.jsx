import RegulatoryTrustStrip from "@/components/footer/RegulatoryTrustStrip";
import FooterSitemap from "@/components/footer/FooterSitemap";

export default function SiteFooter() {
  return (
    <footer id="site-footer" className="site-footer-map safe-bottom border-t border-white/10 bg-[#111113] px-5 py-9">
      <div className="mx-auto max-w-6xl">
        <div className="mb-7 flex flex-col gap-2 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="footer-map-heading text-sm font-black">ABOS MarketSpace</p>
            <p className="footer-map-category mt-1 text-[10px] font-semibold uppercase">The Global Aircraft Identity & Sales Network</p>
          </div>
          <p className="text-xs text-[#7D8899]">Aircraft intelligence, verification and transactions.</p>
        </div>
        <FooterSitemap />
        <div className="mt-10">
          <RegulatoryTrustStrip />
        </div>
      </div>
    </footer>
  );
}