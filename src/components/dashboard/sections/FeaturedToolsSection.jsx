import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Store, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import FeaturedToolRow from "@/components/dashboard/sections/FeaturedToolRow";
import ToolInvokeModal from "@/components/marketplace/ToolInvokeModal";

export default function FeaturedToolsSection() {
  const queryClient = useQueryClient();
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
    queryKey: ["featured-tools"],
    queryFn: () => base44.entities.ToolIntegration.filter({ is_active: true }, "-invocation_count", 6),
  });

  const invokeMutation = useMutation({
    mutationFn: ({ tool_integration_id, payload }) =>
      base44.functions.invoke("invokeMarketplaceTool", { tool_integration_id, payload }),
    onSuccess: () => {
      setResultMsg({ type: "success", text: "Tool invoked successfully!" });
      queryClient.invalidateQueries({ queryKey: ["token-balance"] });
      setSelectedTool(null);
    },
    onError: (err) => {
      const d = err?.response?.data;
      setResultMsg({
        type: "error",
        text: d?.error === "Insufficient tokens"
          ? `Need ${d.required} tokens but you have ${d.balance}.`
          : d?.error || err.message || "Invocation failed",
      });
      setSelectedTool(null);
    },
  });

  if (!isLoading && tools.length === 0) return null;

  return (
    <section className="px-4 md:px-8 py-14 dot-grid bg-canvas text-foreground">
      <div className="max-w-5xl mx-auto">
        {/* Official header seal */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-lg flex items-center justify-center border border-gold-official/30 bg-gold-bg shrink-0">
            <Store className="w-5 h-5 text-gold-official" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] tracking-[0.2em] font-bold text-gold-official uppercase">Developer Marketplace™</p>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight leading-tight">Featured Tools</h2>
          </div>
          <Link to="/marketplace"
            className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold text-gold-official hover:opacity-80 transition-opacity">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Feedback */}
        {resultMsg && (
          <div className={`mb-4 rounded-lg border px-4 py-3 flex items-start gap-2 text-[12px] ${
            resultMsg.type === "success"
              ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "border-red-500/25 bg-red-500/10 text-red-600 dark:text-red-400"
          }`}>
            {resultMsg.type === "success"
              ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
            <span className="flex-1">{resultMsg.text}</span>
            <button onClick={() => setResultMsg(null)} className="opacity-60 hover:opacity-100 cursor-pointer touch-target-compact">✕</button>
          </div>
        )}

        {/* Register-style tool list */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center px-4 md:px-5 py-2.5 border-b border-border bg-muted/60">
            <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Registered Tools — {tools.length} active
            </span>
          </div>
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            tools.map((tool, i) => (
              <FeaturedToolRow key={tool.id} tool={tool} index={i} onRun={setSelectedTool} />
            ))
          )}
        </div>

        <div className="sm:hidden mt-4 text-center">
          <Link to="/marketplace" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-gold-official">
            View all tools <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {selectedTool && (
        <ToolInvokeModal
          tool={selectedTool}
          balance={balance}
          isLoading={invokeMutation.isPending}
          onConfirm={(payload) =>
            invokeMutation.mutate({ tool_integration_id: selectedTool.id, payload })
          }
          onClose={() => setSelectedTool(null)}
        />
      )}
    </section>
  );
}