import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate } from "react-router-dom";
import { Plus, GitBranch, Zap, Archive, Search, Users } from "lucide-react";

const PALETTE = ["#f5c242","#5dcaa5","#4e8ef7","#e24b4a","#a855f7","#f97316"];

export default function FunnelDashboard() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const { data: funnels = [], isLoading } = useQuery({
    queryKey: ["sales-funnels"],
    queryFn: () => base44.entities.SalesFunnel.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.SalesFunnel.create(data),
    onSuccess: (f) => {
      qc.invalidateQueries(["sales-funnels"]);
      setCreating(false);
      setNewName(""); setNewDesc("");
      navigate(`/funnels/${f.id}/canvas`);
    }
  });

  const filtered = funnels.filter(f =>
    f.name?.toLowerCase().includes(search.toLowerCase()) ||
    f.description?.toLowerCase().includes(search.toLowerCase())
  );

  const active = funnels.filter(f => f.status === "active").length;
  const draft = funnels.filter(f => f.status === "draft").length;
  const totalLeads = funnels.reduce((s, f) => s + (f.total_leads || 0), 0);

  const colorForFunnel = (f) => PALETTE[f.name?.charCodeAt(0) % PALETTE.length] || "#f5c242";

  return (
    <div style={{ minHeight: "100vh", background: "transparent", color: "#fff", fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', sans-serif" }}>
      {/* HEADER */}
      <div style={{ borderBottom: "0.5px solid rgba(245,194,66,0.1)", padding: "24px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "#f5c242", margin: 0, marginBottom: 4 }}>ABOS · Deal Engine</p>
          <h1 style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.03em", margin: 0 }}>Funnel Builder</h1>
        </div>
        <button
          onClick={() => setCreating(true)}
          style={{ display: "flex", alignItems: "center", gap: 8, background: "#f5c242", color: "#04060a", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", letterSpacing: "0.01em" }}
        >
          <Plus size={16} /> Create Funnel
        </button>
      </div>

      {/* STATS */}
      <div style={{ padding: "24px 32px 0", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, maxWidth: 1280, margin: "0 auto" }}>
        {[
          { label: "Total Funnels", value: funnels.length, Icon: GitBranch, color: "#f5c242" },
          { label: "Active", value: active, Icon: Zap, color: "#5dcaa5" },
          { label: "Draft", value: draft, Icon: Archive, color: "#4e8ef7" },
          { label: "Total Leads", value: totalLeads, Icon: Users, color: "#f5c242" },
        ].map(({ label, value, Icon, color }) => (
          <div key={label} style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "18px 20px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: `${color}14`, border: `0.5px solid ${color}28`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon size={16} style={{ color }} />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 500, letterSpacing: "-0.03em", color, lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginTop: 4 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* SEARCH */}
      <div style={{ padding: "20px 32px", maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ position: "relative", maxWidth: 360 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search funnels..."
            style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 12px 9px 34px", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box" }}
          />
        </div>
      </div>

      {/* FUNNEL GRID */}
      <div style={{ padding: "0 32px 80px", maxWidth: 1280, margin: "0 auto" }}>
        {isLoading ? (
          <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", paddingTop: 60, fontSize: 13 }}>Loading funnels...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", paddingTop: 80 }}>
            <GitBranch size={40} style={{ color: "rgba(255,255,255,0.1)", margin: "0 auto 16px", display: "block" }} />
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 14 }}>No funnels yet. Create your first deal funnel.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
            {filtered.map(f => {
              const accent = colorForFunnel(f);
              return (
                <div key={f.id} style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: 12, overflow: "hidden", transition: "border-color 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(245,194,66,0.3)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
                >
                  {/* Color accent top bar */}
                  <div style={{ height: 3, background: accent }} />
                  <div style={{ padding: "16px 18px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                      <h3 style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.02em", margin: 0, color: "rgba(255,255,255,0.9)" }}>{f.name}</h3>
                      <span style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", padding: "2px 8px", borderRadius: 99, background: f.status === "active" ? "rgba(93,202,165,0.12)" : "rgba(255,255,255,0.06)", color: f.status === "active" ? "#5dcaa5" : "rgba(255,255,255,0.4)", border: `0.5px solid ${f.status === "active" ? "rgba(93,202,165,0.25)" : "rgba(255,255,255,0.1)"}`, flexShrink: 0, marginLeft: 8 }}>
                        {f.status}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: "0 0 14px", lineHeight: 1.5, minHeight: 36 }}>
                      {f.description || "No description"}
                    </p>
                    <div style={{ display: "flex", gap: 16, marginBottom: 14 }}>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                        <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>{(f.blocks || []).length}</span> blocks
                      </div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                        <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>{(f.connections || []).length}</span> connections
                      </div>
                      {(f.total_leads || 0) > 0 && (
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                          <span style={{ color: "#f5c242", fontWeight: 600 }}>{f.total_leads}</span> leads
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>
                        {f.created_date ? new Date(f.created_date).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"2-digit" }) : ""}
                      </span>
                      <Link to={`/funnels/${f.id}/canvas`} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(245,194,66,0.1)", border: "0.5px solid rgba(245,194,66,0.25)", color: "#f5c242", borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 600, textDecoration: "none", letterSpacing: "0.01em" }}>
                        Edit Funnel
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {creating && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={e => e.target === e.currentTarget && setCreating(false)}>
          <div style={{ background: "#0a0f1a", border: "0.5px solid rgba(245,194,66,0.2)", borderRadius: 16, padding: 32, width: 420, boxShadow: "0 24px 64px rgba(0,0,0,0.6)" }}>
            <h2 style={{ fontSize: 18, fontWeight: 500, letterSpacing: "-0.03em", margin: "0 0 24px" }}>New Deal Funnel</h2>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 8 }}>Funnel Name</label>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g. Citation II — European Buyer"
                autoFocus
                style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "10px 14px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 8 }}>Description (optional)</label>
              <input
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="Describe the deal or aircraft..."
                style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "10px 14px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setCreating(false)} style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px", color: "rgba(255,255,255,0.6)", fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button
                onClick={() => newName.trim() && createMutation.mutate({ name: newName.trim(), description: newDesc.trim(), status: "draft", blocks: [], connections: [] })}
                disabled={!newName.trim() || createMutation.isPending}
                style={{ flex: 2, background: newName.trim() ? "#f5c242" : "rgba(245,194,66,0.3)", color: "#04060a", border: "none", borderRadius: 8, padding: "10px", fontSize: 13, fontWeight: 600, cursor: newName.trim() ? "pointer" : "default" }}
              >
                {createMutation.isPending ? "Creating..." : "Create & Open Canvas"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}