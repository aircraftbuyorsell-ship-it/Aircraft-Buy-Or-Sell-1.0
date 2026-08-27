import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Coins } from "lucide-react";
import EarningsSummary from "@/components/developers/EarningsSummary";
import InvocationLedger from "@/components/developers/InvocationLedger";

const W1 = "rgba(255,255,255,0.90)";
const W2 = "rgba(255,255,255,0.60)";
const AMBER = "#f5c242";

export default function DeveloperEarnings() {
  const { data: user } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const { data: account } = useQuery({
    queryKey: ["developer-account", user?.email],
    enabled: !!user?.email,
    queryFn: async () => {
      const r = await base44.entities.DeveloperAccount.filter({ user_email: user.email }, "-created_date", 1);
      return r[0] || null;
    },
  });

  const { data: invocations = [], isLoading } = useQuery({
    queryKey: ["my-invocations", user?.email],
    enabled: !!user?.email,
    queryFn: () => base44.entities.ToolInvocation.filter({ developer_id: user.email }, "-created_date", 200),
  });

  const { data: myTools = [] } = useQuery({
    queryKey: ["my-tools", user?.email],
    enabled: !!user?.email,
    queryFn: () => base44.entities.ToolIntegration.filter({ developer_id: user.email }, "-created_date", 50),
  });

  if (!account) {
    return (
      <div className="flex items-center justify-center h-64" style={{ background: "transparent", minHeight: "100vh" }}>
        <p className="text-sm" style={{ color: W2 }}>No developer account found. Register on the <Link to="/developers" className="underline" style={{ color: AMBER }}>Developers</Link> page.</p>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-6 max-w-[1400px] mx-auto min-h-screen" style={{ background: "transparent" }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(245,194,66,0.09)", border: "0.5px solid rgba(245,194,66,0.22)" }}>
          <Coins className="w-4.5 h-4.5" style={{ color: AMBER }} />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: W1 }}>Earnings & Payouts</h1>
          <p className="text-sm" style={{ color: W2 }}>{account.company_name} · Revenue ledger</p>
        </div>
      </div>

      <EarningsSummary account={account} invocations={invocations} tools={myTools} />
      <div className="mt-6">
        <InvocationLedger invocations={invocations} isLoading={isLoading} />
      </div>
    </div>
  );
}