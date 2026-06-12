import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Info } from "lucide-react";

const CONSENT_KEY = "intrazone_gdpr_consent_v1";

export default function GDPRConsentBanner() {
  const [show, setShow] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(CONSENT_KEY)) setShow(true);
  }, []);

  const saveConsent = (status) => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ status, date: new Date().toISOString() }));
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag("consent", "update", {
        analytics_storage: status === "accepted" || status === "functional" ? "granted" : "denied",
        ad_storage: status === "accepted" ? "granted" : "denied",
        functionality_storage: status !== "essential" ? "granted" : "granted",
        personalization_storage: status === "accepted" ? "granted" : "denied",
        security_storage: "granted",
      });
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] border-t border-black/10 bg-white shadow-2xl safe-bottom">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex gap-3 text-sm text-[#4A4845]">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#D4A017]" />
          <div>
            <p className="font-black text-[#1A1814]">This website uses cookies</p>
            <p className="mt-1 max-w-3xl leading-6">
              We use cookies to personalise content, ads and to analyse our traffic. We also share information about your use of our site with our advertising and analytics partners who may combine it with other information that you’ve provided to them or that they’ve collected from your use of their services. <Link to="/cookie-policy" className="font-bold text-[#0B2D5B] hover:underline">Read more</Link>
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {["Essential", "Functional", "Marketing"].map((item) => (
                <span key={item} className="rounded-full border border-black/10 bg-[#F7F4EF] px-3 py-1 text-xs font-bold text-[#1A1814]">
                  {item}
                </span>
              ))}
              <button onClick={() => setDetailsOpen((value) => !value)} className="text-xs font-bold text-[#0B2D5B] hover:underline">
                {detailsOpen ? "Hide details" : "Show details"}
              </button>
            </div>
            {detailsOpen && (
              <div className="mt-3 rounded-xl border border-black/[0.07] bg-[#FBF9F5] p-3 text-xs leading-6 text-[#6B6560]">
                Essential cookies keep the site secure and functional. Functional cookies remember preferences. Marketing cookies help personalise ads and measure campaigns.
              </div>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button onClick={() => saveConsent("accepted")} className="rounded-xl bg-[#0B2D5B] px-4 py-2 text-sm font-black text-white hover:bg-[#143C75]">Accept all</button>
          <button onClick={() => saveConsent("functional")} className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-bold text-[#0B2D5B] hover:bg-[#F7F4EF]">Functional only</button>
          <button onClick={() => saveConsent("essential")} className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-bold text-[#4A4845] hover:bg-[#F7F4EF]">Essential only</button>
        </div>
      </div>
    </div>
  );
}