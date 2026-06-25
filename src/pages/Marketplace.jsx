import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Store, Coins, Search, AlertCircle, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import ToolCard from "@/components/marketplace/ToolCard";
import ToolInvokeModal from "@/components/marketplace/ToolInvokeModal";

const CATEGORIES = [
  "all", "data", "analytics", "ai", "compliance", "valuation", "communication", "other",
];

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
        { user_email: user.email },
        "-created_date",
        1
      );
      return txs[0]?.balance_after ?? 0;
    },
  });

  const { data: tools = [], isLoading } = useQuery({
    queryKey: ["marketplace-tools"],
    queryFn: () =>
      base44.entities.ToolIntegration.filter({ is_active: true }, "-invocation_count", 100),
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
    const matchSearch =
      !search ||
      t.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0B1220",
        color: "#fff",
        fontFamily: "Inter, -apple-system, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "rgba(212,160,23,0.10)",
                  border: "0.5px solid rgba(212,160,23,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Store size={18} style={{ color: "#D4A017" }} />
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.03em", margin: 0 }}>
                Developer Marketplace
              </h1>
            </div>
            <p
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.45)",
                maxWidth: 560,
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              Third-party tools built by aviation developers. Pay-per-use with
              tokens — no subscriptions.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 16px",
                borderRadius: 10,
                border: "0.5px solid rgba(212,160,23,0.25)",
                background: "rgba(212,160,23,0.08)",
              }}
            >
              <Coins size={16} style={{ color: "#D4A017" }} />
              <div>
                <p
                  style={{
                    fontSize: 9,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "#D4A017",
                    fontWeight: 600,
                    margin: 0,
                  }}
                >
                  Balance
                </p>
                <p style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
                  {balance}{" "}
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>tokens</span>
                </p>
              </div>
              <Link
                to="/pricing"
                style={{
                  marginLeft: 8,
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#D4A017",
                  textDecoration: "underline",
                  textUnderlineOffset: 2,
                }}
              >
                Buy
              </Link>
            </div>
            <Link
              to="/developers"
              style={{
                height: 40,
                padding: "0 16px",
                borderRadius: 10,
                background: "#2563EB",
                color: "#fff",
                fontSize: 12,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                textDecoration: "none",
              }}
            >
              Submit a Tool
            </Link>
          </div>
        </div>

        {/* Feedback */}
        {resultMsg && (
          <div
            style={{
              marginBottom: 20,
              borderRadius: 10,
              border: `0.5px solid ${
                resultMsg.type === "success"
                  ? "rgba(93,202,165,0.3)"
                  : "rgba(226,75,74,0.3)"
              }`,
              background:
                resultMsg.type === "success"
                  ? "rgba(93,202,165,0.08)"
                  : "rgba(226,75,74,0.08)",
              padding: "12px 16px",
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
            }}
          >
            {resultMsg.type === "success" ? (
              <CheckCircle2 size={16} style={{ color: "#5dcaa5", flexShrink: 0, marginTop: 1 }} />
            ) : (
              <AlertCircle size={16} style={{ color: "#e24b4a", flexShrink: 0, marginTop: 1 }} />
            )}
            <p
              style={{
                fontSize: 13,
                color: resultMsg.type === "success" ? "#5dcaa5" : "#e24b4a",
                margin: 0,
                flex: 1,
              }}
            >
              {resultMsg.text}
            </p>
            <button
              onClick={() => setResultMsg(null)}
              style={{
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.4)",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Search + filter */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
          <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "rgba(255,255,255,0.3)",
              }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tools…"
              style={{
                width: "100%",
                paddingLeft: 36,
                paddingRight: 16,
                height: 40,
                borderRadius: 10,
                fontSize: 13,
                background: "#111827",
                border: "0.5px solid rgba(255,255,255,0.10)",
                color: "#fff",
                outline: "none",
              }}
            />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {CATEGORIES.map((c) => {
              const on = category === c;
              return (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  style={{
                    height: 40,
                    padding: "0 12px",
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: "capitalize",
                    cursor: "pointer",
                    background: on ? "#2563EB" : "#111827",
                    color: on ? "#fff" : "rgba(255,255,255,0.5)",
                    border: on ? "none" : "0.5px solid rgba(255,255,255,0.10)",
                  }}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tools grid */}
        {isLoading ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 16,
            }}
          >
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse"
                style={{
                  borderRadius: 12,
                  padding: 20,
                  height: 192,
                  background: "#111827",
                  border: "0.5px solid rgba(255,255,255,0.08)",
                }}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              borderRadius: 12,
              border: "1px dashed rgba(255,255,255,0.12)",
              padding: 48,
              textAlign: "center",
              background: "#111827",
            }}
          >
            <Store
              size={32}
              style={{ color: "rgba(255,255,255,0.25)", margin: "0 auto 12px", display: "block" }}
            />
            <p style={{ fontSize: 15, fontWeight: 600, margin: "0 0 4px" }}>No tools found</p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0 }}>
              {tools.length === 0
                ? "No tools have been published yet. Be the first to submit one."
                : "Try adjusting your search or category filter."}
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 16,
            }}
          >
            {filtered.map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                balance={balance}
                onInvoke={() => setSelectedTool(tool)}
                isDark={true}
              />
            ))}
          </div>
        )}

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
      </div>
    </div>
  );
}