import { LockKeyhole } from "lucide-react";
import { useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

export default function CompanyAccessRequired() {
  const location = useLocation();
  const { user } = useAuth();
  const returnTo = location.state?.from || "/";
  const handleAccess = () => user ? base44.auth.logout(window.location.href) : base44.auth.redirectToLogin(returnTo);

  return (
    <main className="output-shell flex min-h-[70vh] items-center justify-center px-5 py-16">
      <section className="output-panel w-full max-w-lg p-8 text-center" aria-labelledby="access-title">
        <LockKeyhole className="mx-auto h-10 w-10 text-primary" aria-hidden="true" />
        <p className="mt-5 text-xs font-bold uppercase text-primary">IntraZone — Internal</p>
        <h1 id="access-title" className="mt-3 text-3xl font-bold">Company account required</h1>
        <p className="output-muted mt-4 text-sm leading-6">This area is available only to aircraftbuyorsell@gmail.com and verified @aircraftbuyorsell.com accounts.</p>
        <button className="output-primary-button mt-7" onClick={handleAccess}>
          {user ? "Switch account" : "Sign in with company account"}
        </button>
      </section>
    </main>
  );
}