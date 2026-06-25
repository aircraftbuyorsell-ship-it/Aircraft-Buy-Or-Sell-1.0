import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Code2, Plus, Coins, TrendingUp, CheckCircle2, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import DeveloperOnboarding from "@/components/developers/DeveloperOnboarding";
import DeveloperDashboard from "@/components/developers/DeveloperDashboard";
import SubmitToolModal from "@/components/developers/SubmitToolModal";

export default function Developers() {
  const queryClient = useQueryClient();
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const { data: devAccount, isLoading: devLoading } = useQuery({
    queryKey: ["developer-account", user?.email],
    enabled: !!user?.email,
    queryFn: async () => {
      const accounts = await base44.entities.DeveloperAccount.filter({ user_email: user.email }, "-created_date", 1);
      return accounts[0] || null;
    },
  });

  const { data: myTools = [] } = useQuery({
    queryKey: ["my-tools", user?.email],
    enabled: !!user?.email,
    queryFn: () => base44.entities.ToolIntegration.filter({ developer_id: user.email }, "-created_date", 50),
  });

  const registerMutation = useMutation({
    mutationFn: (data) => base44.entities.DeveloperAccount.create({ ...data, user_email: user.email, status: "pending" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["developer-account"] }),
  });

  const submitToolMutation = useMutation({
    mutationFn: (data) => base44.entities.ToolIntegration.create({ ...data, developer_id: user.email, status: "pending", is_active: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-tools"] });
      setShowSubmitModal(false);
    },
  });

  if (devLoading) {
    return (
      <div className="flex items-center justify-center h-64" style={{ background: "#F7F4EF", backgroundImage: "radial-gradient(circle, rgba(17,17,19,0.07) 1px, transparent 1px)", backgroundSize: "24px 24px", minHeight: "100vh" }}>
        <div className="w-8 h-8 border-4 border-[#D4A017]/30 border-t-[#D4A017] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-6 max-w-[1400px] mx-auto min-h-screen" style={{ background: "#F7F4EF", backgroundImage: "radial-gradient(circle, rgba(17,17,19,0.07) 1px, transparent 1px)", backgroundSize: "24px 24px", minHeight: "100vh" }}>
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-xl bg-[#2563EB]/10 border border-[#2563EB]/20 flex items-center justify-center">
              <Code2 className="w-4.5 h-4.5 text-[#2563EB]" />
            </div>
            <h1 className="text-2xl font-black text-[#1A1814] tracking-tight">Developer Portal</h1>
          </div>
          <p className="text-sm text-[#6B6560] max-w-2xl">
            Build and monetize aviation tools on the ABOS marketplace. Earn tokens on every invocation.
          </p>
        </div>
        {devAccount?.status === "active" && (
          <div className="flex items-center gap-2">
            <Link
              to="/developer-earnings"
              className="flex items-center gap-2 h-10 px-4 rounded-xl border border-[#D4A017]/40 bg-[#D4A017]/10 text-[#A67C00] text-xs font-black uppercase tracking-wide"
            >
              <Coins className="w-4 h-4" /> Earnings
            </Link>
            <button
              onClick={() => setShowSubmitModal(true)}
              className="flex items-center gap-2 h-10 px-4 rounded-xl bg-[#2563EB] hover:bg-[#143C75] text-white text-xs font-black uppercase tracking-wide"
            >
              <Plus className="w-4 h-4" /> Submit Tool
            </button>
          </div>
        )}
      </div>

      {/* No account yet → onboarding */}
      {!devAccount ? (
        <DeveloperOnboarding onRegister={(data) => registerMutation.mutate(data)} isLoading={registerMutation.isPending} />
      ) : (
        <DeveloperDashboard
          account={devAccount}
          tools={myTools}
          onSubmitTool={() => setShowSubmitModal(true)}
        />
      )}

      {showSubmitModal && (
        <SubmitToolModal
          isLoading={submitToolMutation.isPending}
          onSubmit={(data) => submitToolMutation.mutate(data)}
          onClose={() => setShowSubmitModal(false)}
        />
      )}
    </div>
  );
}