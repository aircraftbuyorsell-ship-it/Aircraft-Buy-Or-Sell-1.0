import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Link } from "react-router-dom";
import { ShieldCheck, LockKeyhole, ArrowRight } from "lucide-react";

export default function ApprovedApiAccessGate({ children, title = "Approved API access required", description = "This area is reserved for approved ABOS API, developer and partner accounts." }) {
  const { user, isAuthenticated, navigateToLogin } = useAuth();

  const { data: approval, isLoading: approvalLoading } = useQuery({
    queryKey: ["api-access-approval", user?.email],
    enabled: !!user?.email,
    queryFn: async () => {
      const rows = await base44.entities.ApiAccessApproval.filter({ user_email: user.email, status: "approved" }, "-approved_at", 1);
      return rows[0] || null;
    },
    retry: false,
  });

  const { data: developer, isLoading: developerLoading } = useQuery({
    queryKey: ["active-developer-account", user?.email],
    enabled: !!user?.email,
    queryFn: async () => {
      const rows = await base44.entities.DeveloperAccount.filter({ user_email: user.email, status: "active" }, "-approved_at", 1);
      return rows[0] || null;
    },
    retry: false,
  });

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const now = Date.now();
  const approvalValid = approval && (!approval.expires_at || new Date(approval.expires_at).getTime() > now);
  const approved = isAdmin || !!approvalValid || !!developer;

  if (approvalLoading || developerLoading) {
    return <div className="min-h-[55vh] flex items-center justify-center text-white/50 text-sm">Checking approved access…</div>;
  }

  if (approved) return children;

  return (
    <div className="min-h-[65vh] px-4 sm:px-8 pt-12 pb-24 flex items-start justify-center text-white">
      <div className="max-w-[620px] w-full mt-10 rounded-3xl p-8 sm:p-10 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.09)" }}>
        <div className="w-12 h-12 mx-auto rounded-2xl flex items-center justify-center mb-5" style={{ background: "rgba(245,194,66,0.10)", border: "1px solid rgba(245,194,66,0.24)" }}>
          <LockKeyhole size={20} style={{ color: "#f5c242" }} />
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4" style={{ background: "rgba(93,202,165,0.08)", color: "#5dcaa5", border: "1px solid rgba(93,202,165,0.18)" }}>
          <ShieldCheck size={12} /> Partner / Developer / API access
        </div>
        <h1 className="text-2xl font-black mb-3">{title}</h1>
        <p className="text-sm leading-relaxed mb-7" style={{ color: "rgba(255,255,255,0.58)" }}>{description}</p>
        <div className="flex flex-wrap justify-center gap-3">
          {!isAuthenticated ? (
            <button onClick={navigateToLogin} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase" style={{ background: "#f5c242", color: "#04060a" }}>Sign in <ArrowRight size={14} /></button>
          ) : (
            <Link to="/api" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase" style={{ background: "#f5c242", color: "#04060a" }}>Request API access <ArrowRight size={14} /></Link>
          )}
          <Link to="/api" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.82)" }}>API overview</Link>
        </div>
        {isAuthenticated && <p className="mt-5 text-[11px]" style={{ color: "rgba(255,255,255,0.35)" }}>Access is granted by ABOS approval, an active developer account, or administrator role.</p>}
      </div>
    </div>
  );
}
