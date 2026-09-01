import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Trash2, Flag, RefreshCw, CheckSquare, Square, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const FLAG_LABELS = {
  no_n_number: "No N-Number",
  round_price: "Round Price",
  no_source_url: "No Source URL",
  missing_critical: "Missing TT/ENG HRS",
};

const FLAG_COLORS = {
  no_n_number: "#f5c242",
  round_price: "#e24b4a",
  no_source_url: "#3B82F6",
  missing_critical: "#8B5CF6",
};

export default function AdminDataCleanup() {
  const [selected, setSelected] = useState(new Set());
  const [actionLoading, setActionLoading] = useState(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["identifyTestListings"],
    queryFn: async () => {
      const res = await base44.functions.invoke("identifyTestListings", { models: ["172", "150", "152"] });
      return res.data;
    },
  });

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (!data?.test_listings) return;
    if (selected.size === data.test_listings.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(data.test_listings.map(l => l.id)));
    }
  };

  const runAction = async (action) => {
    if (!selected.size) { toast.error("Select at least one listing"); return; }
    const label = action === "delete" ? "delete" : "mark as draft";
    if (!window.confirm(`Are you sure you want to ${label} ${selected.size} listing(s)?`)) return;

    setActionLoading(action);
    try {
      const res = await base44.functions.invoke("bulkActionListings", { ids: [...selected], action });
      toast.success(`Done: ${res.data.success} ${label}d, ${res.data.failed} failed`);
      setSelected(new Set());
      refetch();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Chart data
  const pieData = data ? [
    { name: "Real Listings", value: data.real_count, color: "#5dcaa5" },
    { name: "Test Candidates", value: data.test_count, color: "#e24b4a" },
  ] : [];

  const flagBarData = data ? Object.entries(data.flag_counts || {}).map(([k, v]) => ({
    name: FLAG_LABELS[k] || k,
    count: v,
    fill: FLAG_COLORS[k] || "#ccc",
  })) : [];

  const modelBarData = data ? Object.entries(data.model_counts || {}).map(([k, v]) => ({
    name: k,
    count: v,
  })) : [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[rgba(255,255,255,0.90)]">Data Cleanup — Test Listings</h1>
          <p className="text-sm text-[rgba(255,255,255,0.60)] mt-1">Cessna 172 / 150 / 152 candidates flagged by heuristics</p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isLoading} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#f5c242]" />
        </div>
      )}

      {data && (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Scanned", value: data.total_scanned, color: "text-[rgba(255,255,255,0.90)]" },
              { label: "Real Listings", value: data.real_count, color: "text-[#5dcaa5]" },
              { label: "Test Candidates", value: data.test_count, color: "text-[#e24b4a]" },
              { label: "Selected", value: selected.size, color: "text-[#f5c242]" },
            ].map(s => (
              <div key={s.label} className="bg-[rgba(255,255,255,0.04)] rounded-xl border border-[rgba(255,255,255,0.08)] p-4 text-center">
                <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-xs text-[rgba(255,255,255,0.60)] mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Pie: Real vs Test */}
            <div className="bg-[rgba(255,255,255,0.04)] rounded-xl border border-[rgba(255,255,255,0.08)] p-4">
              <p className="text-sm font-bold text-[rgba(255,255,255,0.90)] mb-3">Real vs Test</p>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" label={({ name, value }) => `${value}`}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Bar: Flag types */}
            <div className="bg-[rgba(255,255,255,0.04)] rounded-xl border border-[rgba(255,255,255,0.08)] p-4">
              <p className="text-sm font-bold text-[rgba(255,255,255,0.90)] mb-3">Red Flags Breakdown</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={flagBarData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {flagBarData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Bar: Model breakdown */}
            <div className="bg-[rgba(255,255,255,0.04)] rounded-xl border border-[rgba(255,255,255,0.08)] p-4">
              <p className="text-sm font-bold text-[rgba(255,255,255,0.90)] mb-3">By Model</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={modelBarData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#f5c242" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bulk action bar */}
          <div className="bg-[rgba(255,255,255,0.04)] rounded-xl border border-[rgba(255,255,255,0.08)] p-4 flex flex-wrap items-center gap-3">
            <button onClick={toggleAll} className="flex items-center gap-2 text-sm text-[rgba(255,255,255,0.60)] hover:text-[rgba(255,255,255,0.90)] transition-colors">
              {selected.size === data.test_listings.length ? <CheckSquare className="w-4 h-4 text-[#f5c242]" /> : <Square className="w-4 h-4" />}
              {selected.size === data.test_listings.length ? "Deselect All" : "Select All"}
            </button>
            <span className="text-[rgba(255,255,255,0.35)] text-sm">{selected.size} selected</span>
            <div className="flex gap-2 ml-auto">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-[#f5c242] text-[#f5c242] hover:bg-[rgba(245,194,66,0.09)]"
                onClick={() => runAction("mark_review")}
                disabled={!selected.size || actionLoading !== null}
              >
                {actionLoading === "mark_review" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Flag className="w-3.5 h-3.5" />}
                Mark as Draft
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-[#e24b4a] text-red-700 hover:bg-[rgba(226,75,74,0.06)]"
                onClick={() => runAction("delete")}
                disabled={!selected.size || actionLoading !== null}
              >
                {actionLoading === "delete" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Delete Selected
              </Button>
            </div>
          </div>

          {/* Listings table */}
          <div className="bg-[rgba(255,255,255,0.04)] rounded-xl border border-[rgba(255,255,255,0.08)] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[rgba(255,255,255,0.03)] border-b border-[rgba(255,255,255,0.08)]">
                  <th className="w-10 px-4 py-3"></th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-[rgba(255,255,255,0.60)] uppercase tracking-wider">Registration</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-[rgba(255,255,255,0.60)] uppercase tracking-wider">Make / Model</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-[rgba(255,255,255,0.60)] uppercase tracking-wider">Year</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-[rgba(255,255,255,0.60)] uppercase tracking-wider">Price</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-[rgba(255,255,255,0.60)] uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-[rgba(255,255,255,0.60)] uppercase tracking-wider">Red Flags</th>
                </tr>
              </thead>
              <tbody>
                {data.test_listings.map((l, i) => (
                  <tr
                    key={l.id}
                    className={`border-b border-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.03)]/60 cursor-pointer transition-colors ${selected.has(l.id) ? "bg-[rgba(245,194,66,0.09)]" : i % 2 === 0 ? "bg-[rgba(255,255,255,0.04)]" : "bg-transparent"}`}
                    onClick={() => toggleSelect(l.id)}
                  >
                    <td className="px-4 py-3">
                      {selected.has(l.id)
                        ? <CheckSquare className="w-4 h-4 text-[#f5c242]" />
                        : <Square className="w-4 h-4 text-[rgba(255,255,255,0.35)]" />}
                    </td>
                    <td className="px-4 py-3 font-mono text-[rgba(255,255,255,0.90)]">{l.registration || <span className="text-[#e24b4a] italic">—</span>}</td>
                    <td className="px-4 py-3 text-[rgba(255,255,255,0.90)]">{l.make} {l.model}</td>
                    <td className="px-4 py-3 text-[rgba(255,255,255,0.60)]">{l.year || "—"}</td>
                    <td className="px-4 py-3 text-[rgba(255,255,255,0.90)]">
                      {l.asking_price ? `$${l.asking_price.toLocaleString()}` : <span className="text-[rgba(255,255,255,0.35)]">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        l.status === "active" ? "bg-[rgba(93,202,165,0.09)] text-[#5dcaa5]" :
                        l.status === "draft" ? "bg-amber-100 text-[#f5c242]" :
                        "bg-[rgba(255,255,255,0.06)] text-gray-600"
                      }`}>{l.status || "unknown"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(l._flags || []).map(f => (
                          <span key={f} className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ background: `${FLAG_COLORS[f]}20`, color: FLAG_COLORS[f] }}>
                            {FLAG_LABELS[f] || f}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
                {data.test_listings.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-[rgba(255,255,255,0.35)]">
                      <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-[#5dcaa5]" />
                      No test listings found — data looks clean!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}