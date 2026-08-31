import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useTheme } from "@/lib/useTheme";
import {
  Lightbulb, ChevronUp, Plus, MessageSquare, Search,
  Filter, X, Loader2, CheckCircle2, Clock, Rocket,
  AlertCircle, Ban, Trash2
} from "lucide-react";
import { isAdminRole } from "@/utils/roles";

const STATUS_CONFIG = {
  under_review: { label: "Under Review", icon: Clock, color: "#D4A017" },
  planned: { label: "Planned", icon: Rocket, color: "#2563eb" },
  in_progress: { label: "In Progress", icon: Loader2, color: "#7c3aed" },
  released: { label: "Released", icon: CheckCircle2, color: "#16a34a" },
  declined: { label: "Declined", icon: Ban, color: "#dc2626" },
};

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "listings", label: "Listings" },
  { value: "analytics", label: "Analytics" },
  { value: "tools", label: "Tools" },
  { value: "escrow", label: "Escrow" },
  { value: "community", label: "Community" },
  { value: "traffic", label: "Traffic" },
  { value: "other", label: "Other" },
];

const SORTS = [
  { value: "votes", label: "Most Votes" },
  { value: "newest", label: "Newest" },
  { value: "updated", label: "Recently Updated" },
];

export default function FeatureRequests() {
  const isDark = useTheme();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("votes");
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formCategory, setFormCategory] = useState("other");

  const textColor = isDark ? "#fff" : "#1e293b";
  const mutedColor = isDark ? "rgba(255,255,255,0.40)" : "rgba(0,0,0,0.45)";
  const subtleColor = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)";
  const accentCyan = isDark ? "#00f5ff" : "#2563eb";
  const cardBg = isDark ? "rgba(255,255,255,0.04)" : "#fff";
  const cardBorder = isDark ? "rgba(0,245,255,0.10)" : "rgba(0,0,0,0.07)";

  const { data: currentUser } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => base44.auth.me(),
  });

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["feature-requests"],
    queryFn: () => base44.entities.FeatureRequest.list("-created_date", 100),
  });

  const { data: votes = [] } = useQuery({
    queryKey: ["feature-votes"],
    queryFn: () => base44.entities.FeatureVote.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.FeatureRequest.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feature-requests"] });
      setShowForm(false);
      setFormTitle("");
      setFormDesc("");
      setFormCategory("other");
    },
  });

  const voteMutation = useMutation({
    mutationFn: async ({ request, userEmail }) => {
      const existingVote = votes.find(
        (v) => v.feature_request === request.id && v.voter_email === userEmail
      );
      if (existingVote) {
        await base44.entities.FeatureVote.delete(existingVote.id);
        await base44.entities.FeatureRequest.update(request.id, {
          vote_count: (request.vote_count || 1) - 1,
        });
      } else {
        await base44.entities.FeatureVote.create({
          feature_request: request.id,
          voter_email: userEmail,
        });
        await base44.entities.FeatureRequest.update(request.id, {
          vote_count: (request.vote_count || 0) + 1,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feature-requests"] });
      queryClient.invalidateQueries({ queryKey: ["feature-votes"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FeatureRequest.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["feature-requests"] }),
  });

  const userEmail = currentUser?.email || "";
  const isAdmin = isAdminRole(currentUser);

  const myVotedIds = new Set(
    votes.filter((v) => v.voter_email === userEmail).map((v) => v.feature_request)
  );

  let filtered = [...requests];

  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.title?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q)
    );
  }

  if (category !== "all") {
    filtered = filtered.filter((r) => r.category === category);
  }

  filtered.sort((a, b) => {
    if (sortBy === "votes") return (b.vote_count || 0) - (a.vote_count || 0);
    if (sortBy === "newest") return new Date(b.created_date) - new Date(a.created_date);
    if (sortBy === "updated") return new Date(b.updated_date) - new Date(a.updated_date);
    return 0;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formTitle.trim()) return;
    createMutation.mutate({
      title: formTitle.trim(),
      description: formDesc.trim(),
      category: formCategory,
      submitter_email: userEmail,
    });
  };

  return (
    <div className="min-h-screen px-4 md:px-8 py-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] font-black mb-1" style={{ color: accentCyan }}>
              Community Feedback
            </p>
            <h1 className="text-2xl font-black" style={{ color: textColor }}>
              Feature Requests
            </h1>
            <p className="text-[12px] mt-0.5" style={{ color: mutedColor }}>
              Suggest and vote on what to build next
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[12px] font-bold transition-all active:scale-95"
            style={{
              background: `linear-gradient(135deg, ${accentCyan}, ${isDark ? "#7a00ff" : "#7c3aed"})`,
              color: "#fff",
            }}
          >
            <Plus className="w-4 h-4" /> New Request
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 shrink-0" style={{ color: mutedColor }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search requests..."
              className="flex-1 bg-transparent text-[12px] outline-none py-1.5"
              style={{ color: textColor }}
            />
            {search && (
              <button onClick={() => setSearch("")}>
                <X className="w-3.5 h-3.5" style={{ color: mutedColor }} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className="px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all"
                style={{
                  color: category === c.value ? accentCyan : mutedColor,
                  background: category === c.value
                    ? (isDark ? "rgba(0,245,255,0.1)" : "rgba(37,99,235,0.08)")
                    : "transparent",
                  border: `1px solid ${category === c.value ? accentCyan : subtleColor}`,
                }}
              >
                {c.label}
              </button>
            ))}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-[10px] font-semibold rounded-lg px-2.5 py-1.5 outline-none"
            style={{ background: cardBg, color: textColor, border: `1px solid ${subtleColor}` }}
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-4 mb-5 text-[10px] font-semibold" style={{ color: mutedColor }}>
          <span>{filtered.length} request{filtered.length !== 1 ? "s" : ""}</span>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
            const count = filtered.filter((r) => r.status === key).length;
            if (count === 0) return null;
            const Icon = cfg.icon;
            return (
              <span key={key} className="flex items-center gap-1">
                <Icon className="w-3 h-3" style={{ color: cfg.color }} />
                {count} {cfg.label}
              </span>
            );
          })}
        </div>

        {/* Submit form */}
        {showForm && (
          <div className="mb-5 p-5 rounded-2xl" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Short feature title..."
                className="w-full text-[14px] font-semibold bg-transparent outline-none"
                style={{ color: textColor }}
                autoFocus
              />
              <textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Describe the feature in detail..."
                rows={3}
                className="w-full text-[12px] bg-transparent outline-none resize-none"
                style={{ color: mutedColor }}
              />
              <div className="flex items-center gap-3">
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="text-[11px] rounded-lg px-2.5 py-1.5 outline-none"
                  style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", color: textColor, border: `1px solid ${subtleColor}` }}
                >
                  {CATEGORIES.filter((c) => c.value !== "all").map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-[11px] font-semibold px-3 py-1.5 rounded-lg"
                  style={{ color: mutedColor }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!formTitle.trim() || createMutation.isPending}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[11px] font-bold disabled:opacity-40 transition-all"
                  style={{ background: accentCyan, color: "#fff" }}
                >
                  {createMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                  Submit
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Requests list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: mutedColor }} />
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-2">
            {filtered.map((r) => {
              const StatusIcon = STATUS_CONFIG[r.status]?.icon || Clock;
              const statusColor = STATUS_CONFIG[r.status]?.color || mutedColor;
              const hasVoted = myVotedIds.has(r.id);

              return (
                <div
                  key={r.id}
                  className="flex items-start gap-3 p-4 rounded-2xl transition-all"
                  style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
                >
                  {/* Vote button */}
                  <button
                    onClick={() => voteMutation.mutate({ request: r, userEmail })}
                    disabled={voteMutation.isPending}
                    className="flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-xl shrink-0 transition-all active:scale-95 min-w-[44px]"
                    style={{
                      background: hasVoted
                        ? (isDark ? "rgba(0,245,255,0.12)" : "rgba(37,99,235,0.1)")
                        : (isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)"),
                      border: `1px solid ${hasVoted ? accentCyan : subtleColor}`,
                    }}
                  >
                    <ChevronUp className="w-4 h-4" style={{ color: hasVoted ? accentCyan : mutedColor }} />
                    <span className="text-[11px] font-black" style={{ color: hasVoted ? accentCyan : textColor }}>
                      {r.vote_count || 0}
                    </span>
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-[13px] font-bold" style={{ color: textColor }}>
                        {r.title}
                      </h3>
                      <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ color: mutedColor, background: subtleColor }}>
                        {r.category}
                      </span>
                      <span className="flex items-center gap-1 text-[9px] font-semibold"
                        style={{ color: statusColor }}>
                        <StatusIcon className="w-3 h-3" />
                        {STATUS_CONFIG[r.status]?.label}
                      </span>
                    </div>
                    {r.description && (
                      <p className="text-[11px] leading-relaxed mb-1.5" style={{ color: mutedColor }}>
                        {r.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-[9px]" style={{ color: subtleColor }}>
                      <span>{r.submitter_email}</span>
                      <span>{new Date(r.created_date).toLocaleDateString()}</span>
                    </div>
                    {r.admin_notes && (
                      <div className="mt-2 p-2.5 rounded-xl text-[10px]"
                        style={{ background: isDark ? "rgba(0,245,255,0.05)" : "rgba(37,99,235,0.05)", color: accentCyan }}>
                        <span className="font-bold">Admin:</span> {r.admin_notes}
                      </div>
                    )}
                  </div>

                  {/* Admin actions */}
                  {isAdmin && (
                    <div className="flex items-center gap-1 shrink-0">
                      <select
                        value={r.status}
                        onChange={(e) => {
                          base44.entities.FeatureRequest.update(r.id, { status: e.target.value }).then(() =>
                            queryClient.invalidateQueries({ queryKey: ["feature-requests"] })
                          );
                        }}
                        className="text-[9px] font-semibold rounded-lg px-2 py-1 outline-none"
                        style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", color: textColor, border: `1px solid ${subtleColor}` }}
                      >
                        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => {
                          const note = prompt("Admin notes:", r.admin_notes || "");
                          if (note !== null) {
                            base44.entities.FeatureRequest.update(r.id, { admin_notes: note }).then(() =>
                              queryClient.invalidateQueries({ queryKey: ["feature-requests"] })
                            );
                          }
                        }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px]"
                        style={{ color: mutedColor, background: subtleColor }}
                        title="Add admin note"
                      >
                        <MessageSquare className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => { if (confirm("Delete this request?")) deleteMutation.mutate(r.id); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px]"
                        style={{ color: "#dc2626", background: subtleColor }}
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-20 text-center" style={{ color: mutedColor }}>
            <Lightbulb className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-[13px] font-semibold">No feature requests yet</p>
            <p className="text-[11px] mt-1">Be the first to suggest a feature!</p>
          </div>
        )}
      </div>
    </div>
  );
}