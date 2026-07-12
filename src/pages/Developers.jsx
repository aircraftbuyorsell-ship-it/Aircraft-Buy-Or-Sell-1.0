import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Code2, Plus, Coins } from "lucide-react";
import { Link } from "react-router-dom";
import DeveloperOnboarding from "@/components/developers/DeveloperOnboarding";
import DeveloperDashboard from "@/components/developers/DeveloperDashboard";
import SubmitToolModal from "@/components/developers/SubmitToolModal";

const W1 = "rgba(255,255,255,0.90)";
const W2 = "rgba(255,255,255,0.60)";
const BORDER = "rgba(255,255,255,0.08)";
const AMBER = "#f5c242";
const BLUE = "#4e8ef7";

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
      <div className="flex items-center justify-center h-64" style={{ background: "transparent", minHeight: "100vh" }}>
        <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: `rgba(245,194,66,0.3)`, borderTopColor: AMBER }} />
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-6 max-w-[1400px] mx-auto min-h-screen" style={{ background: "transparent" }}>
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(78,142,247,0.09)", border: "0.5px solid rgba(78,142,247,0.20)" }}>
              <Code2 className="w-4.5 h-4.5" style={{ color: BLUE }} />
            </div>
            <h1 className="text-2xl font-black tracking-tight" style={{ color: W1 }}>Developer Portal</h1>
          </div>
          <p className="text-sm max-w-2xl" style={{ color: W2 }}>
            Build and monetize aviation tools on the ABOS marketplace. Earn tokens on every invocation.
          </p>
        </div>
        {devAccount?.status === "active" && (
          <div className="flex items-center gap-2">
            <Link
              to="/developer-earnings"
              className="flex items-center gap-2 h-10 px-4 rounded-xl text-xs font-black uppercase tracking-wide"
              style={{ background: "rgba(245,194,66,0.09)", border: "0.5px solid rgba(245,194,66,0.22)", color: AMBER }}
            >
              <Coins className="w-4 h-4" /> Earnings
            </Link>
            <button
              onClick={() => setShowSubmitModal(true)}
              className="flex items-center gap-2 h-10 px-4 rounded-xl text-white text-xs font-black uppercase tracking-wide transition-opacity hover:opacity-90"
              style={{ background: AMBER, color: "#04060a" }}
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