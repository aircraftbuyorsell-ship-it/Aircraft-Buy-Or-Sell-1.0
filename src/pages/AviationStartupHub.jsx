import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useTheme } from "@/lib/useTheme";
import {
  Rocket, Users, Handshake, Target, Search, Plus,
  Globe, Zap, TrendingUp, ShieldCheck, Plane, Lightbulb,
  ArrowRight, CheckCircle2, Clock, Building2, MapPin,
  Eye, ExternalLink, Send, Star, Sparkles
} from "lucide-react";

const CATEGORY_CONFIG = {
  marketplace: { icon: Plane, label: "Marketplace", color: "#3b82f6" },
  analytics_valuation: { icon: TrendingUp, label: "Analytics & Valuation", color: "#8b5cf6" },
  compliance_trust: { icon: ShieldCheck, label: "Compliance & Trust", color: "#22c55e" },
  cross_border_logistics: { icon: Globe, label: "Cross-Border Logistics", color: "#f59e0b" },
  ai_automation: { icon: Zap, label: "AI & Automation", color: "#ef4444" },
  maintenance_tracking: { icon: Clock, label: "Maintenance Tracking", color: "#06b6d4" },
  fractional_ownership: { icon: Users, label: "Fractional Ownership", color: "#ec4899" },
  sustainability: { icon: Lightbulb, label: "Sustainability", color: "#10b981" },
  financing_escrow: { icon: Handshake, label: "Financing & Escrow", color: "#f97316" },
  training_crew: { icon: Target, label: "Training & Crew", color: "#6366f1" },
  other: { icon: Building2, label: "Other", color: "#64748b" },
};

const STAGE_LABELS = {
  idea: "Idea Stage",
  mvp: "MVP / Prototype",
  beta: "Beta Testing",
  live: "Live Product",
  scaling: "Scaling Up",
};

const SEEKING_CONFIG = {
  investment: { icon: Target, label: "Seeking Investment", color: "#D4A017" },
  collaboration: { icon: Users, label: "Seeking Collaboration", color: "#3b82f6" },
  mentorship: { icon: Star, label: "Seeking Mentorship", color: "#8b5cf6" },
  customers: { icon: Eye, label: "Seeking Customers", color: "#22c55e" },
  partners: { icon: Handshake, label: "Seeking Partners", color: "#f59e0b" },
  team_members: { icon: Rocket, label: "Seeking Team", color: "#ef4444" },
};

function Panel({ children, className = "", isDark }) {
  return (
    <div className={`rounded-xl ${className}`} style={{
      background: isDark ? "rgba(22,22,38,0.78)" : "#ffffff",
      border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)",
      boxShadow: isDark ? "0 1px 3px rgba(0,0,0,0.2)" : "0 1px 2px rgba(0,0,0,0.04)",
    }}>
      {children}
    </div>
  );
}

export default function AviationStartupHub() {
  const isDark = useTheme();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [filterSeeking, setFilterSeeking] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [form, setForm] = useState({
    project_name: "",
    tagline: "",
    description: "",
    category: "ai_automation",
    stage: "idea",
    seeking: "investment",
    funding_goal: "",
    team_size: "",
    location: "",
    website_url: "",
    contact_email: "",
    founder_name: "",
    ati_integrated: false,
    tags: "",
  });

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["startup-projects"],
    queryFn: () => base44.entities.StartupProject.filter({ status: { "$in": ["approved", "active"] } }, "-created_date", 50),
  });

  const textColor = isDark ? "#f1f5f9" : "#1e293b";
  const muted = isDark ? "rgba(255,255,255,0.5)" : "#64748b";
  const accent = isDark ? "#60a5fa" : "#3b82f6";
  const gold = "#D4A017";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

  const filtered = projects.filter(p => {
    if (search && !p.project_name?.toLowerCase().includes(search.toLowerCase()) && !p.tagline?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCat !== "all" && p.category !== filterCat) return false;
    if (filterSeeking !== "all" && p.seeking !== filterSeeking) return false;
    return true;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const user = await base44.auth.me();
      await base44.entities.StartupProject.create({
        ...form,
        funding_goal: form.funding_goal ? parseFloat(form.funding_goal) : undefined,
        team_size: form.team_size ? parseInt(form.team_size) : undefined,
        tags: form.tags ? form.tags.split(",").map(t => t.trim()) : [],
        submitted_by: user.email,
        status: "pending",
      });
      setFormSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["startup-projects"] });
    } catch (err) {
      console.error("Submit failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({
      project_name: "", tagline: "", description: "", category: "ai_automation",
      stage: "idea", seeking: "investment", funding_goal: "", team_size: "",
      location: "", website_url: "", contact_email: "", founder_name: "",
      ati_integrated: false, tags: "",
    });
    setShowForm(false);
    setFormSuccess(false);
  };

  return (
    <div className="min-h-screen" style={{ background: isDark ? "#0A081E" : "#f8fafc" }}>
      {/* ═══════ HERO ═══════ */}
      <section className="relative px-4 md:px-8 pt-14 pb-14 md:pt-20 md:pb-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 50% 0%, ${accent}20 0%, transparent 55%), radial-gradient(ellipse at 80% 60%, ${gold}12 0%, transparent 50%)` }} />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-[10px] font-bold tracking-[0.15em] uppercase"
            style={{ background: `${gold}15`, border: `1px solid ${gold}30`, color: gold }}>
            <Sparkles className="w-3 h-3" /> Aviation Start Up Hub
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] mb-5" style={{ color: textColor }}>
            Where <span style={{ color: accent }}>Aviation Innovation</span><br />Takes Flight
          </h1>
          <p className="text-sm md:text-base max-w-xl mx-auto mb-8 leading-relaxed" style={{ color: muted }}>
            The professional network for aviation entrepreneurs, investors, and industry experts.
            Discover groundbreaking projects, forge partnerships, and help shape the future of aviation.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] shadow-lg"
              style={{ background: accent, color: "#fff", boxShadow: `0 4px 20px ${accent}40` }}>
              <Plus className="w-4 h-4" /> List Your Project
            </button>
            <a href="#projects"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all"
              style={{ background: "transparent", border: `2px solid ${accent}`, color: accent }}>
              Explore Projects <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ═══════ NETWORK INVITATION ═══════ */}
      <section className="px-4 md:px-8 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: Users, title: "Network", desc: "Connect with 2,000+ aviation professionals — dealers, brokers, engineers, regulators, and founders across Europe." },
              { icon: Handshake, title: "Collaborate", desc: "Find co-founders, technical partners, investors, and early adopters for your aviation technology project." },
              { icon: TrendingUp, title: "Grow", desc: "Access ABOS platform credits, ATI API integration, distribution channels, and a curated investor pipeline." },
            ].map(n => (
              <Panel key={n.title} isDark={isDark} className="p-5 text-center">
                <div className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-3"
                  style={{ background: `${accent}12`, border: `1px solid ${accent}25` }}>
                  <n.icon className="w-5 h-5" style={{ color: accent }} />
                </div>
                <h3 className="text-sm font-bold mb-1.5" style={{ color: textColor }}>{n.title}</h3>
                <p className="text-[11px] leading-relaxed" style={{ color: muted }}>{n.desc}</p>
              </Panel>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ PROJECTS ═══════ */}
      <section id="projects" className="px-4 md:px-8 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
            <div>
              <p className="text-[10px] tracking-[0.2em] font-semibold mb-2" style={{ color: accent }}>ACTIVE PROJECTS</p>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight" style={{ color: textColor }}>
                {filtered.length} Projects Seeking {filterSeeking !== "all" ? SEEKING_CONFIG[filterSeeking]?.label : "Opportunities"}
              </h2>
            </div>
            <button onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-bold transition-all"
              style={{ background: gold, color: "#0B2D5B" }}>
              <Plus className="w-3.5 h-3.5" /> Submit Project
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-5">
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: muted }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search projects..."
                className="w-full pl-9 pr-3 py-2 rounded-lg text-[11px] outline-none"
                style={{ background: isDark ? "rgba(255,255,255,0.05)" : "#fff", border: `1px solid ${borderColor}`, color: textColor }} />
            </div>
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
              className="rounded-lg px-3 py-2 text-[11px] outline-none"
              style={{ background: isDark ? "rgba(255,255,255,0.05)" : "#fff", border: `1px solid ${borderColor}`, color: textColor }}>
              <option value="all">All Categories</option>
              {Object.entries(CATEGORY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <select value={filterSeeking} onChange={e => setFilterSeeking(e.target.value)}
              className="rounded-lg px-3 py-2 text-[11px] outline-none"
              style={{ background: isDark ? "rgba(255,255,255,0.05)" : "#fff", border: `1px solid ${borderColor}`, color: textColor }}>
              <option value="all">All Opportunities</option>
              {Object.entries(SEEKING_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="h-52 rounded-xl animate-pulse" style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)" }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Building2 className="w-10 h-10 mx-auto mb-4 opacity-20" style={{ color: muted }} />
              <p className="text-sm font-medium" style={{ color: textColor }}>No projects found</p>
              <p className="text-[11px] mt-1 mb-4" style={{ color: muted }}>
                {projects.length === 0 ? "Be the first to list your aviation startup project." : "Try adjusting your filters."}
              </p>
              <button onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-[11px] font-bold"
                style={{ background: accent, color: "#fff" }}>
                <Plus className="w-3.5 h-3.5" /> List Your Project
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map(p => {
                const cat = CATEGORY_CONFIG[p.category] || CATEGORY_CONFIG.other;
                const seek = SEEKING_CONFIG[p.seeking] || SEEKING_CONFIG.investment;
                return (
                  <Panel key={p.id} isDark={isDark} className="p-5 flex flex-col hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `${cat.color}15`, border: `1px solid ${cat.color}30` }}>
                        <cat.icon className="w-5 h-5" style={{ color: cat.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[13px] font-bold truncate" style={{ color: textColor }}>{p.project_name}</h3>
                        <p className="text-[10px] truncate mt-0.5" style={{ color: muted }}>{p.tagline}</p>
                      </div>
                    </div>

                    <p className="text-[11px] leading-relaxed mb-3 line-clamp-2 flex-1" style={{ color: muted }}>
                      {p.description}
                    </p>

                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                          style={{ background: `${seek.color}15`, color: seek.color, border: `1px solid ${seek.color}30` }}>
                          <seek.icon className="w-2.5 h-2.5 inline mr-0.5" />{seek.label}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                          style={{ background: `${cat.color}10`, color: cat.color }}>
                          {STAGE_LABELS[p.stage] || p.stage}
                        </span>
                        {p.ati_integrated && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-[#0B2D5B]/10 text-[#4e8ef7] border border-[#0B2D5B]/20">
                            ATI
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[9px]" style={{ color: muted }}>
                        {p.location && <span className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5" />{p.location}</span>}
                        {p.team_size && <span className="flex items-center gap-1"><Users className="w-2.5 h-2.5" />{p.team_size}</span>}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2.5 border-t" style={{ borderColor }}>
                      <div style={{ color: muted }}>
                        {p.funding_goal ? (
                          <span className="text-[10px] font-semibold" style={{ color: textColor }}>
                            €{p.funding_goal.toLocaleString()}
                            {p.funding_raised > 0 && (
                              <span className="text-[9px] ml-1" style={{ color: "#22c55e" }}>
                                ({Math.round(p.funding_raised / p.funding_goal * 100)}% raised)
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-[10px]">{p.contact_email}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-medium" style={{ color: muted }}>
                          {p.interest_count || 0} interested
                        </span>
                        {p.website_url && (
                          <a href={p.website_url} target="_blank" rel="noopener noreferrer"
                            className="text-[10px] font-medium hover:underline flex items-center gap-1"
                            style={{ color: accent }}>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </Panel>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ═══════ SUBMIT FORM ═══════ */}
      {showForm && (
        <section className="px-4 md:px-8 py-10"
          style={{ background: isDark ? "rgba(255,255,255,0.015)" : "rgba(0,0,0,0.015)" }}>
          <div className="max-w-2xl mx-auto">
            <Panel isDark={isDark} className="p-6 md:p-8">
              {formSuccess ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-4" style={{ color: "#22c55e" }} />
                  <h3 className="text-lg font-bold mb-2" style={{ color: textColor }}>Project Submitted</h3>
                  <p className="text-sm mb-4" style={{ color: muted }}>
                    Your project is under review. We'll notify you once it's approved and listed on the hub.
                  </p>
                  <button onClick={resetForm}
                    className="px-5 py-2 rounded-lg text-[11px] font-bold"
                    style={{ background: accent, color: "#fff" }}>
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-[10px] tracking-[0.15em] font-bold" style={{ color: gold }}>LIST YOUR PROJECT</p>
                      <h3 className="text-base font-bold" style={{ color: textColor }}>Submit to the Start Up Hub</h3>
                    </div>
                    <button onClick={resetForm} className="text-[11px] hover:underline" style={{ color: muted }}>Cancel</button>
                  </div>
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2">
                        <input value={form.project_name} onChange={e => setForm(p => ({ ...p, project_name: e.target.value }))}
                          placeholder="Project Name *" required maxLength={150}
                          className="w-full rounded-lg px-3 py-2.5 text-[12px] outline-none"
                          style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)", border: `1px solid ${borderColor}`, color: textColor }} />
                      </div>
                      <div className="sm:col-span-2">
                        <input value={form.tagline} onChange={e => setForm(p => ({ ...p, tagline: e.target.value }))}
                          placeholder="One-line elevator pitch" maxLength={200}
                          className="w-full rounded-lg px-3 py-2.5 text-[12px] outline-none"
                          style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)", border: `1px solid ${borderColor}`, color: textColor }} />
                      </div>
                      <div className="sm:col-span-2">
                        <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                          rows={3} placeholder="Describe your project — what problem does it solve, who is it for?"
                          className="w-full rounded-lg px-3 py-2.5 text-[12px] outline-none resize-none"
                          style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)", border: `1px solid ${borderColor}`, color: textColor }} />
                      </div>
                      <div>
                        <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                          className="w-full rounded-lg px-3 py-2.5 text-[12px] outline-none"
                          style={{ background: isDark ? "rgba(255,255,255,0.05)" : "#fff", border: `1px solid ${borderColor}`, color: textColor }}>
                          <option value="" disabled>Category *</option>
                          {Object.entries(CATEGORY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <select value={form.stage} onChange={e => setForm(p => ({ ...p, stage: e.target.value }))}
                          className="w-full rounded-lg px-3 py-2.5 text-[12px] outline-none"
                          style={{ background: isDark ? "rgba(255,255,255,0.05)" : "#fff", border: `1px solid ${borderColor}`, color: textColor }}>
                          {Object.entries(STAGE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                      </div>
                      <div>
                        <select value={form.seeking} onChange={e => setForm(p => ({ ...p, seeking: e.target.value }))}
                          className="w-full rounded-lg px-3 py-2.5 text-[12px] outline-none"
                          style={{ background: isDark ? "rgba(255,255,255,0.05)" : "#fff", border: `1px solid ${borderColor}`, color: textColor }}>
                          <option value="" disabled>Seeking *</option>
                          {Object.entries(SEEKING_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <input type="number" value={form.funding_goal} onChange={e => setForm(p => ({ ...p, funding_goal: e.target.value }))}
                          placeholder="Funding goal (EUR)" min="0"
                          className="w-full rounded-lg px-3 py-2.5 text-[12px] outline-none"
                          style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)", border: `1px solid ${borderColor}`, color: textColor }} />
                      </div>
                      <div>
                        <input type="number" value={form.team_size} onChange={e => setForm(p => ({ ...p, team_size: e.target.value }))}
                          placeholder="Team size" min="0"
                          className="w-full rounded-lg px-3 py-2.5 text-[12px] outline-none"
                          style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)", border: `1px solid ${borderColor}`, color: textColor }} />
                      </div>
                      <div>
                        <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                          placeholder="City, Country" maxLength={200}
                          className="w-full rounded-lg px-3 py-2.5 text-[12px] outline-none"
                          style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)", border: `1px solid ${borderColor}`, color: textColor }} />
                      </div>
                      <div>
                        <input type="url" value={form.website_url} onChange={e => setForm(p => ({ ...p, website_url: e.target.value }))}
                          placeholder="Website URL" maxLength={200}
                          className="w-full rounded-lg px-3 py-2.5 text-[12px] outline-none"
                          style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)", border: `1px solid ${borderColor}`, color: textColor }} />
                      </div>
                      <div>
                        <input type="email" value={form.contact_email} onChange={e => setForm(p => ({ ...p, contact_email: e.target.value }))}
                          placeholder="Contact Email *" required maxLength={200}
                          className="w-full rounded-lg px-3 py-2.5 text-[12px] outline-none"
                          style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)", border: `1px solid ${borderColor}`, color: textColor }} />
                      </div>
                      <div>
                        <input value={form.founder_name} onChange={e => setForm(p => ({ ...p, founder_name: e.target.value }))}
                          placeholder="Founder / Primary Contact" maxLength={150}
                          className="w-full rounded-lg px-3 py-2.5 text-[12px] outline-none"
                          style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)", border: `1px solid ${borderColor}`, color: textColor }} />
                      </div>
                      <div>
                        <input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
                          placeholder="Tags (comma-separated)" maxLength={300}
                          className="w-full rounded-lg px-3 py-2.5 text-[12px] outline-none"
                          style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)", border: `1px solid ${borderColor}`, color: textColor }} />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-[11px] cursor-pointer" style={{ color: muted }}>
                      <input type="checkbox" checked={form.ati_integrated} onChange={e => setForm(p => ({ ...p, ati_integrated: e.target.checked }))} />
                      Integrates with ATI Standard
                    </label>
                    <button type="submit" disabled={submitting}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                      style={{ background: accent, color: "#fff" }}>
                      {submitting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</> : <><Send className="w-4 h-4" /> Submit Project</>}
                    </button>
                  </form>
                </>
              )}
            </Panel>
          </div>
        </section>
      )}

      {/* ═══════ CTA FOOTER ═══════ */}
      <section className="px-4 md:px-8 py-16 text-center"
        style={{ borderTop: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.06)" }}>
        <div className="max-w-2xl mx-auto">
          <p className="text-sm font-bold mb-3" style={{ color: textColor }}>
            Ready to join the aviation innovation network?
          </p>
          <p className="text-[11px] mb-5" style={{ color: muted }}>
            The Aviation Start Up Hub is powered by ABOS Group. Explore SOAR for accelerator programs and ATI integration opportunities.
          </p>
          <div className="flex justify-center gap-3">
            <Link to="/soar" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-[11px] font-bold"
              style={{ background: gold, color: "#0B2D5B" }}>
              <Rocket className="w-3.5 h-3.5" /> SOAR Accelerator
            </Link>
            <button onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-[11px] font-bold"
              style={{ border: `2px solid ${accent}`, color: accent }}>
              <Plus className="w-3.5 h-3.5" /> List Your Project
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}