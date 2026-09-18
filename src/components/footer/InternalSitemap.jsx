import { useState } from "react";
import { Link } from "react-router-dom";
import { LockKeyhole } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { INTERNAL_PAGES, isCompanyAccount } from "@/lib/companyAccess";

export default function InternalSitemap({ user }) {
  const [denied, setDenied] = useState(false);
  const allowed = isCompanyAccount(user?.email);

  return (
    <section className="mt-10 border-t border-white/10 pt-7" aria-label="IntraZone internal pages">
      <div className="flex items-center gap-2 text-primary"><LockKeyhole size={16} /><h2 className="text-sm font-bold">IntraZone — Internal</h2></div>
      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
        {INTERNAL_PAGES.map((item) => allowed ? (
          <Link key={item.path} to={item.path} className="footer-map-link">{item.label}</Link>
        ) : (
          <button key={item.path} type="button" className="footer-map-locked" aria-label={`${item.label}, company account required`} onClick={() => setDenied(true)}>
            <LockKeyhole size={11} aria-hidden="true" /><span>{item.label}</span>
          </button>
        ))}
      </div>
      {!allowed && denied && <div className="mt-5 rounded-lg border border-primary/25 bg-primary/10 p-4 text-xs text-[#F3F4F6]" role="alert">Company account required. Use aircraftbuyorsell@gmail.com or a verified @aircraftbuyorsell.com account. <button className="ml-2 font-bold text-primary underline" onClick={() => user ? base44.auth.logout(window.location.href) : base44.auth.redirectToLogin(window.location.href)}> {user ? "Switch account" : "Sign in"}</button></div>}
    </section>
  );
}