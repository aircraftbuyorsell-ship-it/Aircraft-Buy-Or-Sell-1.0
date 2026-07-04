import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import WorkflowSidebar from "@/components/workflows/WorkflowSidebar";
import WorkflowCard from "@/components/workflows/WorkflowCard";

export default function Workflows() {
  const [activeSection, setActiveSection] = useState("workflows");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const { data: workflows = [], isLoading } = useQuery({
    queryKey: ["workflows"],
    queryFn: async () => {
      const res = await base44.functions.invoke("listWorkflows", {});
      return res.data?.workflows || [];
    },
    staleTime: 10000,
  });

  const filtered = useMemo(() => {
    return workflows.filter((w) => {
      const matchesSearch =
        !search ||
        w.name?.toLowerCase().includes(search.toLowerCase()) ||
        w.function_name?.toLowerCase().includes(search.toLowerCase());
      const matchesFilter =
        filter === "all" ||
        (filter === "active" && w.status === "active") ||
        (filter === "paused" && w.status === "paused") ||
        (filter === "scheduled" && w.category === "scheduled") ||
        (filter === "entity" && w.category === "entity");
      return matchesSearch && matchesFilter;
    });
  }, [workflows, search, filter]);

  const stats = useMemo(
    () => ({
      total: workflows.length,
      active: workflows.filter((w) => w.status === "active").length,
      paused: workflows.filter((w) => w.status === "paused").length,
      errors: workflows.filter((w) => w.last_run_status === "failed").length,
    }),
    [workflows]
  );

  return (
    <div className="flex min-h-screen" style={{ background: "#0b0e14", color: "#e2e8f0" }}>
      <WorkflowSidebar activeSection={activeSection} onSectionChange={setActiveSection} />

      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div
          className="sticky top-0 z-20 flex items-center gap-4 px-6 py-3.5"
          style={{
            background: "rgba(11,14,20,0.92)",
            backdropFilter: "blur(16px)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex-1 max-w-md relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search workflows..."
              className="w-full pl-10 pr-4 py-2 rounded-lg text-sm font-medium"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#fff",
              }}
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(255,255,255,0.35)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Filter pills */}
          <div className="hidden md:flex items-center gap-1.5">
            {[
              { key: "all", label: "All" },
              { key: "active", label: "Active" },
              { key: "scheduled", label: "Scheduled" },
              { key: "entity", label: "Entity-triggered" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className="px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all"
                style={
                  filter === f.key
                    ? { background: "rgba(245,194,66,0.15)", color: "#f5c242", border: "1px solid rgba(245,194,66,0.3)" }
                    : { background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.06)" }
                }
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-[1200px] mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-black tracking-tight text-white">Workflows</h1>
              <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
                Automation engine — scheduled tasks, entity triggers, and real-time pipeline orchestration
              </p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              {[
                { label: "Total", value: stats.total, color: "#4e8ef7", icon: "Layers" },
                { label: "Active", value: stats.active, color: "#22c55e", icon: "Play" },
                { label: "Paused", value: stats.paused, color: "#f5c242", icon: "Pause" },
                { label: "Errors", value: stats.errors, color: "#ef4444", icon: "AlertTriangle" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl p-4"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.40)" }}>
                      {s.label}
                    </span>
                    <span className="w-2 h-2 rounded-full" style={{ background: s.color, boxShadow: `0 0 8px ${s.color}80` }} />
                  </div>
                  <p className="text-2xl font-black tabular-nums" style={{ color: s.color }}>
                    {s.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Workflow grid */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-[#f5c242]/30 border-t-[#f5c242] rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.40)" }}>
                  No workflows match your search.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filtered.map((w) => (
                  <WorkflowCard key={w.id} workflow={w} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}