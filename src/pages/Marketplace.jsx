import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Store, Coins, Search, AlertCircle, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import ToolCard from "@/components/marketplace/ToolCard";
import ToolInvokeModal from "@/components/marketplace/ToolInvokeModal";
import { useTheme } from "@/lib/useTheme";

const CATEGORIES = ["all", "data", "analytics", "ai", "compliance", "valuation", "communication", "other"];

export default function Marketplace() {
  const isDark = useTheme();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [selectedTool, setSelectedTool] = useState(null);
  const [resultMsg, setResultMsg] = useState(null);

  const { data: user } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const { data: balance = 0 } = useQuery({
    queryKey: ["token-balance", user?.email],
    enabled: !!user?.email,
    queryFn: async () => {
      const txs = await base44.entities.TokenTransaction.filter(
        { user_email: user.email }, "-created_date", 1
      );
      return txs[0]?.balance_after ?? 0;
    },
  });

  const { data: tools = [], isLoading } = useQuery({
    queryKey: ["marketplace-tools"],
    queryFn: () => base44.entities.ToolIntegration.filter({ is_active: true }, "-invocation_count", 100),
  });

  const invokeMutation = useMutation({
    mutationFn: ({ tool_integration_id, payload }) =>
      base44.functions.invoke("invokeMarketplaceTool", { tool_integration_id, payload }),
    onSuccess: (res) => {
      setResultMsg({ type: "success", text: "Tool invoked successfully!", data: res.data });
      queryClient.invalidateQueries({ queryKey: ["token-balance"] });
      queryClient.invalidateQueries({ queryKey: ["marketplace-tools"] });
      setSelectedTool(null);
    },
    onError: (err) => {
      const d = err?.response?.data;
      if (d?.error === "Insufficient tokens") {
        setResultMsg({ type: "error", text: `Need ${d.required} tokens but you have ${d.balance}.` });
      } else {
        setResultMsg({ type: "error", text: d?.error || err.message || "Invocation failed" });
      }
      setSelectedTool(null);
    },
  });

  const filtered = tools.filter((t) => {
    const matchCat = category === "all" || t.category === category;
    const matchSearch = !search ||
      t.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const textPrimary = isDark ? "#ffffff" : "#1A1814";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "#6B6560";
  const panelBg = isDark ? "rgba(255,255,255,0.05)" : "#ffffff";
  const panelBorder = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)";
  const inputBg = isDark ? "rgba(255,255,255,0.06)" : "#ffffff";
  const inputBorder = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)";

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-xl bg-[#E8A83A]/15 border border-[#E8A83A]/30 flex items-center justify-center">
              <Store className="w-5 h-5 text-[#A67C00]" />
            </div>
            <h1 className="text-2xl font-black tracking-tight" style={{ color: textPrimary }}>Developer Marketplace</h1>
          </div>
          <p className="text-sm max-w-2xl" style={{ color: textMuted }}>
            Third-party tools built by aviation developers. Pay-per-use with tokens — no subscriptions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8A83A]/30 bg-[#E8A83A]/10">
            <Coins className="w-4 h-4 text-[#A67C00]" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#A67C00] font-bold">Balance</p>
              <p className="text-lg font-black leading-tight" style={{ color: textPrimary }}>{balance} <span className="text-xs font-bold" style={{ color: textMuted }}>tokens</span></p>
            </div>
            <Link to="/pricing" className="ml-2 text-[11px] font-black uppercase tracking-wide text-[#0B2D5B] dark:text-[#00f5ff] hover:opacity-80 underline underline-offset-2">Buy</Link>
          </div>
          <Link to="/developers" className="h-10 px-4 rounded-xl bg-[#0B2D5B] hover:bg-[#143C75] text-white text-xs font-black uppercase tracking-wide flex items-center">
            Submit a Tool
          </Link>
        </div>
      </div>

      {/* Feedback */}
      {resultMsg && (
        <div className="mb-5 rounded-xl border px-4 py-3 flex items-start gap-2"
          style={resultMsg.type === "success"
            ? { background: isDark ? "rgba(34,197,94,0.12)" : "#f0fdf4", borderColor: isDark ? "rgba(34,197,94,0.30)" : "#bbf7d0" }
            : { background: isDark ? "rgba(239,68,68,0.12)" : "#fff1f2", borderColor: isDark ? "rgba(239,68,68,0.30)" : "#fecdd3" }}>
          {resultMsg.type === "success"
            ? <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            : <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />}
          <p className="text-sm" style={{ color: resultMsg.type === "success" ? (isDark ? "#4ade80" : "#166534") : (isDark ? "#f87171" : "#991b1b") }}>
            {resultMsg.text}
          </p>
          <button onClick={() => setResultMsg(null)} className="ml-auto text-xs" style={{ color: textMuted }}>✕</button>
        </div>
      )}

      {/* Search + filter */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: isDark ? "rgba(255,255,255,0.30)" : "#AAA49C" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tools…"
            className="w-full pl-9 pr-4 h-10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E8A83A]/40"
            style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: textPrimary }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className="h-10 px-3 rounded-xl text-xs font-bold capitalize transition-colors"
              style={category === c
                ? { background: "#0B2D5B", color: "#ffffff" }
                : { background: panelBg, border: `1px solid ${panelBorder}`, color: textMuted }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Tools grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl p-5 h-48 animate-pulse border" style={{ background: panelBg, borderColor: panelBorder }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center" style={{ background: panelBg, borderColor: panelBorder }}>
          <Store className="w-8 h-8 mx-auto mb-3" style={{ color: isDark ? "rgba(255,255,255,0.25)" : "#AAA49C" }} />
          <p className="font-black mb-1" style={{ color: textPrimary }}>No tools found</p>
          <p className="text-sm" style={{ color: textMuted }}>
            {tools.length === 0 ? "No tools have been published yet. Be the first to submit one." : "Try adjusting your search or category filter."}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((tool) => (
            <ToolCard key={tool.id} tool={tool} balance={balance} onInvoke={() => setSelectedTool(tool)} isDark={isDark} />
          ))}
        </div>
      )}

      {/* Invoke modal */}
      {selectedTool && (
        <ToolInvokeModal
          tool={selectedTool}
          balance={balance}
          isLoading={invokeMutation.isPending}
          onConfirm={(payload) => invokeMutation.mutate({ tool_integration_id: selectedTool.id, payload })}
          onClose={() => setSelectedTool(null)}
        />
      )}
    </div>
  );
}