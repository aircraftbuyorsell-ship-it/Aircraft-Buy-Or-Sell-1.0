import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Coins, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import EarningsSummary from "@/components/developers/EarningsSummary";
import InvocationLedger from "@/components/developers/InvocationLedger";

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
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-[#6B6560]">No developer account found. Register on the <a href="/developers" className="text-[#0B2D5B] underline">Developers</a> page.</p>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-6 max-w-[1400px] mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-[#E8A83A]/15 border border-[#E8A83A]/30 flex items-center justify-center">
          <Coins className="w-4.5 h-4.5 text-[#A67C00]" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-[#1A1814] tracking-tight">Earnings & Payouts</h1>
          <p className="text-sm text-[#6B6560]">{account.company_name} · Revenue ledger</p>
        </div>
      </div>

      <EarningsSummary account={account} invocations={invocations} tools={myTools} />
      <div className="mt-6">
        <InvocationLedger invocations={invocations} isLoading={isLoading} />
      </div>
    </div>
  );
}