import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { NAV_TREE } from "@/components/layout/navConfig";
import InternalSitemap from "@/components/footer/InternalSitemap";
import "@/components/footer/footer-sitemap.css";

const INFO_PAGES = [
  ["About Us", "/about"], ["How It Works", "/how-it-works"], ["FAQ", "/faq"],
  ["User Account", "/my-account"], ["Privacy Policy", "/privacy-policy"],
  ["Cookie Policy", "/cookie-policy"], ["GDPR", "/gdpr-compliance"],
  ["EU AI Act", "/legal/ai-transparency"], ["Digital Services Act", "/legal/dsa"],
  ["IP & Trademarks", "/legal/ip-notice"], ["Terms", "/terms-of-service"],
  ["Affiliate", "/affiliate-agreement"], ["Escrow", "/escrow-agreement"],
];

export default function FooterSitemap() {
  const { user } = useAuth();
  const hubs = NAV_TREE.filter((section) => !section.direct);
  const direct = NAV_TREE.filter((section) => section.direct);

  return (
    <nav aria-label="Site map">
      <div className="flex flex-wrap gap-x-6 gap-y-3 border-b border-white/10 pb-6">
        {direct.map((item) => <Link key={item.path} to={item.path} className="footer-map-link">{item.label}</Link>)}
      </div>
      <div className="mt-7 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {hubs.map((hub) => (
          <section key={hub.label} aria-labelledby={`footer-${hub.label.toLowerCase()}`}>
            <Link id={`footer-${hub.label.toLowerCase()}`} to={hub.path} className="text-sm font-bold text-[#F3F4F6] hover:text-primary">{hub.label}</Link>
            <div className="mt-4 space-y-5">{hub.categories.map((category) => <div key={category.label}><h3 className="mb-2 text-[10px] font-bold uppercase text-primary/80">{category.label}</h3><div className="space-y-2.5">{category.items.map((item) => <Link key={`${item.path}-${item.label}`} to={item.path} className="footer-map-link">{item.label}</Link>)}</div></div>)}</div>
          </section>
        ))}
      </div>
      <section className="mt-10 border-t border-white/10 pt-7" aria-labelledby="footer-information">
        <h2 id="footer-information" className="text-sm font-bold text-[#F3F4F6]">Company & Legal</h2>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
          {INFO_PAGES.map(([label, path]) => <Link key={path} to={path} className="footer-map-link">{label}</Link>)}
          <button type="button" className="footer-map-link" onClick={() => window.ABOS_openCookieSettings?.()}>Cookie Settings</button>
        </div>
      </section>
      <InternalSitemap user={user} />
    </nav>
  );
}