import { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  RefreshCw, Server, CheckCircle2, PauseCircle, AlertTriangle,
  Clock, Globe, MapPin, ExternalLink
} from "lucide-react";

const HEALTH_STYLES = {
  active: { icon: CheckCircle2, color: "#5dcaa5", bg: "rgba(93,202,165,0.08)", border: "rgba(93,202,165,0.25)", label: "Active" },
  paused: { icon: PauseCircle, color: "#f5c242", bg: "rgba(245,194,66,0.08)", border: "rgba(245,194,66,0.25)", label: "Paused" },
  timeout: { icon: Clock, color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)", label: "Timeout" },
  unreachable: { icon: AlertTriangle, color: "#e24b4a", bg: "rgba(226,75,74,0.08)", border: "rgba(226,75,74,0.25)", label: "Unreachable" },
};

export default function SupabaseProjectsPanel() {
  const [projects, setProjects] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fetchedAt, setFetchedAt] = useState(null);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("listSupabaseProjects", {});
      setProjects(res.data?.projects || []);
      setSummary(res.data?.summary || null);
      setFetchedAt(res.data?.fetchedAt || null);
    } catch (err) {
      setError(err.message || "Failed to fetch projects");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[rgba(255,255,255,0.04)] rounded-2xl border border-[rgba(255,255,255,0.08)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(255,255,255,0.08)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#3ecf8e]/10 flex items-center justify-center border border-[#3ecf8e]/20">
            <Server className="w-4.5 h-4.5 text-[#3ecf8e]" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-tight">Supabase Projects</h3>
            <p className="text-[10px] text-[rgba(255,255,255,0.40)]">
              {fetchedAt ? `Updated ${new Date(fetchedAt).toLocaleString()}` : "Management API · live health check"}
            </p>
          </div>
        </div>
        <button
          onClick={fetchProjects}
          disabled={loading}
          className="text-[11px] font-bold bg-[#3ecf8e] text-[#0a0a0a] px-4 py-2 rounded-lg flex items-center gap-1.5 hover:bg-[#3ecf8e]/90 transition-all disabled:opacity-40"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Checking..." : "Refresh"}
        </button>
      </div>

      {/* Summary pills */}
      {summary && (
        <div className="flex items-center gap-3 px-5 py-3 bg-[rgba(255,255,255,0.02)] border-b border-[rgba(255,255,255,0.06)]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[rgba(255,255,255,0.40)]">
            {summary.total} projects
          </span>
          {summary.active > 0 && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[rgba(93,202,165,0.08)] text-[#5dcaa5] border border-[rgba(93,202,165,0.20)]">
              {summary.active} Active
            </span>
          )}
          {summary.paused > 0 && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[rgba(245,194,66,0.08)] text-[#f5c242] border border-[rgba(245,194,66,0.20)]">
              {summary.paused} Paused
            </span>
          )}
          {summary.timeout > 0 && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[rgba(245,158,11,0.08)] text-[#f59e0b] border border-[rgba(245,158,11,0.20)]">
              {summary.timeout} Timeout
            </span>
          )}
          {summary.unreachable > 0 && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[rgba(226,75,74,0.08)] text-[#e24b4a] border border-[rgba(226,75,74,0.20)]">
              {summary.unreachable} Unreachable
            </span>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="px-5 py-3 text-sm text-[#e24b4a] flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && !projects && (
        <div className="py-12 text-center">
          <RefreshCw className="w-6 h-6 text-[#3ecf8e] animate-spin mx-auto mb-2" />
          <p className="text-[12px] text-[rgba(255,255,255,0.40)]">Querying Supabase Management API...</p>
        </div>
      )}

      {/* Project list */}
      {projects && projects.length > 0 && (
        <div className="divide-y divide-[rgba(255,255,255,0.06)]">
          {projects.map((p) => {
            const hs = HEALTH_STYLES[p.health.health] || HEALTH_STYLES.unreachable;
            const HIcon = hs.icon;
            return (
              <div key={p.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[rgba(255,255,255,0.03)] transition-colors">
                {/* Health indicator */}
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: hs.bg, border: `1px solid ${hs.border}` }}>
                  <HIcon className="w-4 h-4" style={{ color: hs.color }} />
                </div>

                {/* Name + region */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-bold text-white truncate">{p.name}</p>
                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0" style={{ background: hs.bg, color: hs.color, border: `1px solid ${hs.border}` }}>
                      {hs.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] text-[rgba(255,255,255,0.35)] font-mono">{p.id}</span>
                    {p.region && (
                      <span className="flex items-center gap-1 text-[10px] text-[rgba(255,255,255,0.35)]">
                        <MapPin className="w-2.5 h-2.5" /> {p.region}
                      </span>
                    )}
                    {p.created_at && (
                      <span className="text-[10px] text-[rgba(255,255,255,0.25)]">
                        {new Date(p.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Endpoint link */}
                <a
                  href={p.endpoint_rest}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[10px] font-bold text-[rgba(255,255,255,0.40)] hover:text-[#3ecf8e] transition-colors shrink-0"
                >
                  <Globe className="w-3 h-3" />
                  <span className="hidden md:inline">REST</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty */}
      {projects && projects.length === 0 && !loading && !error && (
        <div className="py-10 text-center">
          <Server className="w-7 h-7 mx-auto mb-2 opacity-15" />
          <p className="text-[12px] text-[rgba(255,255,255,0.35)]">No projects found</p>
        </div>
      )}
    </div>
  );
}