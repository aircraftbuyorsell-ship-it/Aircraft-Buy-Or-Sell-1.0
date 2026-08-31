import { Link } from "react-router-dom";
import { Plane, AlertTriangle, Home, Plug } from "lucide-react";

export default function OAuthConsent() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full text-center space-y-5">
        <div className="space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/25 mb-2">
            <Plane className="w-8 h-8 text-primary" strokeWidth={2.2} />
          </div>
          <p className="text-[11px] uppercase tracking-[0.2em] font-black text-primary">Aviation IntraZone</p>
          <h1 className="text-2xl font-black text-foreground uppercase tracking-tight">
            Connection Not Completed
          </h1>
          <div className="h-0.5 w-16 bg-primary mx-auto" />
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <AlertTriangle className="w-4 h-4 text-primary shrink-0" />
          Sign-in based connections aren't available on this address yet.
        </div>

        <p className="text-xs text-muted-foreground">
          To connect an AI assistant to ABOS, use the dedicated connection address:
        </p>
        <p className="text-[11px] font-mono px-3 py-2 rounded-lg bg-muted text-foreground break-all select-all">
          https://abos-widget-gateway.aircraftbuyorsell.workers.dev/mcp
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
