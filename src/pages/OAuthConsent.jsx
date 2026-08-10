import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plane, Loader2, CheckCircle2, Home, Plug } from "lucide-react";

export default function OAuthConsent() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDone(true), 1800);
    const r = setTimeout(() => { window.location.href = "/"; }, 4200);
    return () => { clearTimeout(t); clearTimeout(r); };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full text-center space-y-5">
        <div className="space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/25 mb-2">
            <Plane className="w-8 h-8 text-primary" strokeWidth={2.2} />
          </div>
          <p className="text-[11px] uppercase tracking-[0.2em] font-black text-primary">Aviation IntraZone</p>
          <h1 className="text-2xl font-black text-foreground uppercase tracking-tight">
            {done ? "Connection Approved" : "Connecting Your Account"}
          </h1>
          <div className="h-0.5 w-16 bg-primary mx-auto" />
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          {done ? (
            <><CheckCircle2 className="w-4 h-4 text-primary" /> Authorization complete — taking you back to ABOS.</>
          ) : (
            <><Loader2 className="w-4 h-4 animate-spin text-primary" /> Finalizing the secure handshake with your provider…</>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          This is a secure authorization step. You can safely close this screen once you're redirected.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
          <Link to="/" className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-black uppercase tracking-wider rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
            <Home className="w-4 h-4" /> Go Home
          </Link>
          <Link to="/integration-kit" className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold uppercase tracking-wider rounded-xl border border-border text-foreground hover:bg-muted transition-colors">
            <Plug className="w-4 h-4" /> Manage Connections
          </Link>
        </div>
      </div>
    </div>
  );
}