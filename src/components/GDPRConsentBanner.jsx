import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Info, X } from "lucide-react";

const CONSENT_KEY = "intrazone_gdpr_consent_v1";

export default function GDPRConsentBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(CONSENT_KEY)) setShow(true);
  }, []);

  const saveConsent = (status) => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ status, date: new Date().toISOString() }));
    if (status === "accepted") {
      window.gtag?.("consent", "update", { analytics_storage: "granted", ad_storage: "granted" });
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] border-t border-black/10 bg-white shadow-2xl safe-bottom">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3 text-sm text-[#4A4845]">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#D4A017]" />
          <div>
            <p className="font-black text-[#1A1814]">Privacy preferences</p>
            <p className="mt-1 leading-6">
              We use essential cookies to run IntraZone and optional analytics cookies to improve the platform. Review our{" "}
              <Link to="/privacy-policy" className="font-bold text-[#0B2D5B] hover:underline">Privacy Policy</Link>{" "}
              and <Link to="/cookie-policy" className="font-bold text-[#0B2D5B] hover:underline">Cookie Policy</Link>.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button onClick={() => saveConsent("rejected")} className="rounded-xl border border-black/10 px-4 py-2 text-sm font-bold text-[#4A4845] hover:bg-[#F7F4EF]">Reject</button>
          <button onClick={() => saveConsent("accepted")} className="rounded-xl bg-[#0B2D5B] px-4 py-2 text-sm font-black text-white hover:bg-[#143C75]">Accept</button>
          <button onClick={() => setShow(false)} className="rounded-xl p-2 text-[#AAA49C] hover:bg-[#F7F4EF] hover:text-[#1A1814]" aria-label="Close cookie banner">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}