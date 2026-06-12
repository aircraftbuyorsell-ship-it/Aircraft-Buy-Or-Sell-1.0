import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ShieldCheck, Code2, Zap, Users } from "lucide-react";
import AdminDeveloperTable from "@/components/admin/AdminDeveloperTable";
import AdminToolTable from "@/components/admin/AdminToolTable";
import { useTheme } from "@/lib/useTheme";

const TABS = [
  { key: "developers", label: "Developer Accounts", icon: Users },
  { key: "tools",      label: "Tool Submissions",   icon: Zap },
];

export default function AdminMarketplace() {
  const isDark = useTheme();
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

  const textPrimary = isDark ? "#ffffff" : "#1A1814";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "#6B6560";
  const tabBg = isDark ? "rgba(255,255,255,0.06)" : "#F7F4EF";
  const tabActive = isDark ? "rgba(255,255,255,0.12)" : "#ffffff";

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={isDark ? { background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.30)" } : { background: "#fef2f2", border: "1px solid #fecaca" }}>
          <ShieldCheck className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: textPrimary }}>Marketplace Admin</h1>
          <p className="text-sm" style={{ color: textMuted }}>Approve developers and tool submissions</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 rounded-xl p-1 w-fit" style={{ background: tabBg }}>
        {TABS.map(({ key, label, icon: Icon }) => {
          const pending = key === "developers" ? pendingDevs : pendingTools;
          const active = tab === key;
          return (
            <button key={key} onClick={() => setTab(key)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
              style={{ background: active ? tabActive : "transparent", color: active ? textPrimary : textMuted,
                boxShadow: active && !isDark ? "0 1px 4px rgba(0,0,0,0.08)" : "none" }}>
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
          isDark={isDark}
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
          isDark={isDark}
        />
      )}
    </div>
  );
}