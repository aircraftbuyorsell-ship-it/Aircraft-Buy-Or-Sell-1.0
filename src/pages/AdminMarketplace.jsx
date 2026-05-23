import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ShieldCheck, Code2, Zap, Users } from "lucide-react";
import AdminDeveloperTable from "@/components/admin/AdminDeveloperTable";
import AdminToolTable from "@/components/admin/AdminToolTable";

const TABS = [
  { key: "developers", label: "Developer Accounts", icon: Users },
  { key: "tools",      label: "Tool Submissions",   icon: Zap },
];

export default function AdminMarketplace() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("developers");

  const { data: user } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const { data: developers = [], isLoading: devLoading } = useQuery({
    queryKey: ["admin-developers"],
    enabled: user?.role === "admin",
    queryFn: () => base44.entities.DeveloperAccount.list("-created_date", 100),
  });

  const { data: tools = [], isLoading: toolsLoading } = useQuery({
    queryKey: ["admin-tools"],
    enabled: user?.role === "admin",
    queryFn: () => base44.entities.ToolIntegration.list("-created_date", 100),
  });

  const updateDevMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DeveloperAccount.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-developers"] }),
  });

  const updateToolMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ToolIntegration.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-tools"] }),
  });

  if (!user) return null;
  if (user.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[#6B6560] text-sm">Admin access required.</p>
      </div>
    );
  }

  const pendingDevs  = developers.filter(d => d.status === "pending").length;
  const pendingTools = tools.filter(t => t.status === "pending").length;

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center">
          <ShieldCheck className="w-4.5 h-4.5 text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-[#1A1814] tracking-tight">Marketplace Admin</h1>
          <p className="text-sm text-[#6B6560]">Approve developers and tool submissions</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[#F7F4EF] rounded-xl p-1 w-fit">
        {TABS.map(({ key, label, icon: Icon }) => {
          const pending = key === "developers" ? pendingDevs : pendingTools;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                tab === key ? "bg-white shadow-sm text-[#1A1814]" : "text-[#6B6560] hover:text-[#1A1814]"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {pending > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-black">{pending}</span>
              )}
            </button>
          );
        })}
      </div>

      {tab === "developers" && (
        <AdminDeveloperTable
          developers={developers}
          isLoading={devLoading}
          onApprove={(dev) => updateDevMutation.mutate({ id: dev.id, data: { status: "active", approved_at: new Date().toISOString(), approved_by: user.email } })}
          onSuspend={(dev) => updateDevMutation.mutate({ id: dev.id, data: { status: "suspended" } })}
          isUpdating={updateDevMutation.isPending}
        />
      )}

      {tab === "tools" && (
        <AdminToolTable
          tools={tools}
          isLoading={toolsLoading}
          onApprove={(tool) => updateToolMutation.mutate({ id: tool.id, data: { status: "active", is_active: true, approved_at: new Date().toISOString(), approved_by: user.email } })}
          onReject={(tool) => updateToolMutation.mutate({ id: tool.id, data: { status: "rejected", is_active: false } })}
          onSuspend={(tool) => updateToolMutation.mutate({ id: tool.id, data: { status: "suspended", is_active: false } })}
          isUpdating={updateToolMutation.isPending}
        />
      )}
    </div>
  );
}