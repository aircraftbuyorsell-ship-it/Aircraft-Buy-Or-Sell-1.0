import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Store, Coins, Search, AlertCircle, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import ToolCard from "@/components/marketplace/ToolCard";
import ToolInvokeModal from "@/components/marketplace/ToolInvokeModal";

const CATEGORIES = ["all", "data", "analytics", "ai", "compliance", "valuation", "communication", "other"];

export default function Marketplace() {
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

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-xl bg-[#E8A83A]/15 border border-[#E8A83A]/30 flex items-center justify-center">
              <Store className="w-4.5 h-4.5 text-[#A67C00]" />
            </div>
            <h1 className="text-2xl font-black text-[#1A1814] tracking-tight">Developer Marketplace</h1>
          </div>
          <p className="text-sm text-[#6B6560] max-w-2xl">
            Third-party tools built by aviation developers. Pay-per-use with tokens — no subscriptions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8A83A]/30 bg-[#E8A83A]/10">
            <Coins className="w-4 h-4 text-[#A67C00]" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#A67C00] font-bold">Balance</p>
              <p className="text-lg font-black text-[#1A1814] leading-tight">{balance} <span className="text-xs font-bold text-[#6B6560]">tokens</span></p>
            </div>
            <Link to="/pricing" className="ml-2 text-[11px] font-black uppercase tracking-wide text-[#0B2D5B] hover:text-[#143C75] underline underline-offset-2">
              Buy
            </Link>
          </div>
          <Link to="/developers" className="h-10 px-4 rounded-xl bg-[#0B2D5B] hover:bg-[#143C75] text-white text-xs font-black uppercase tracking-wide flex items-center">
            Submit a Tool
          </Link>
        </div>
      </div>

      {/* Feedback */}
      {resultMsg && (
        <div className={`mb-5 rounded-xl border px-4 py-3 flex items-start gap-2 ${
          resultMsg.type === "success"
            ? "bg-green-50 border-green-200"
            : "bg-red-50 border-red-200"
        }`}>
          {resultMsg.type === "success"
            ? <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            : <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />}
          <p className={`text-sm ${resultMsg.type === "success" ? "text-green-800" : "text-red-700"}`}>
            {resultMsg.text}
          </p>
          <button onClick={() => setResultMsg(null)} className="ml-auto text-xs text-[#6B6560] hover:text-[#1A1814]">✕</button>
        </div>
      )}

      {/* Search + filter */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#AAA49C]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tools…"
            className="w-full pl-9 pr-4 h-10 rounded-xl border border-black/10 bg-white text-sm text-[#1A1814] placeholder-[#AAA49C] focus:outline-none focus:ring-2 focus:ring-[#E8A83A]/40"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`h-10 px-3 rounded-xl text-xs font-bold capitalize transition-colors ${
                category === c
                  ? "bg-[#0B2D5B] text-white"
                  : "bg-white border border-black/10 text-[#6B6560] hover:border-[#0B2D5B]/30"
              }`}
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
            <div key={i} className="rounded-2xl border border-black/8 bg-white p-5 h-48 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/15 bg-white p-12 text-center">
          <Store className="w-8 h-8 text-[#AAA49C] mx-auto mb-3" />
          <p className="font-black text-[#1A1814] mb-1">No tools found</p>
          <p className="text-sm text-[#6B6560]">
            {tools.length === 0
              ? "No tools have been published yet. Be the first to submit one."
              : "Try adjusting your search or category filter."}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((tool) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              balance={balance}
              onInvoke={() => setSelectedTool(tool)}
            />
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