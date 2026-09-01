import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ToggleLeft, Zap, ShieldCheck, Save, Plus, Trash2,
  LayoutDashboard, Plane, FileText, Globe, TrendingUp, Radar, Calculator,
  Users, BarChart3, Handshake, MessageCircle, Lightbulb, Star, Rocket,
  Video, Layers, CreditCard, Search, Settings, Database
} from "lucide-react";

// ─── Feature catalog — every page, component, and tool in the app ───
const FEATURE_CATALOG = [
  // ── Pages ──
  {
    category: "MarketSpace Pages",
    color: "#f48120",
    icon: LayoutDashboard,
    items: [
      { key: "page_dashboard", label: "Dashboard", desc: "Main platform overview with globe, metrics, news ticker", icon: LayoutDashboard },
      { key: "page_listings", label: "Aircraft Register", desc: "Browse the aircraft register with ATI scores", icon: Plane },
      { key: "page_ati_passport", label: "ATI Passport", desc: "Detailed aircraft analysis and scoring report", icon: FileText },
      { key: "page_ati_card", label: "ATI Card", desc: "Digital aircraft identity card with vault", icon: Star },
      { key: "page_ati_quick_score", label: "ATI Quick Score", desc: "Instant 8-dimension scorecard from listing text", icon: Zap },
      { key: "page_ati_full_report", label: "ATI Full Report", desc: "Professional appraisal with .docx export", icon: FileText },
      { key: "page_ati_standard", label: "ATI Standard", desc: "ATI Score, Report and Card standard overview", icon: Star },
      { key: "page_ati_verify", label: "ATI Verify", desc: "Remote document verification with video calls", icon: Video },
      { key: "page_deal_radar", label: "Deal Radar", desc: "Hot deals priced below market with high ATI scores", icon: TrendingUp },
      { key: "page_traffic", label: "Live Traffic", desc: "Real-time ADS-B tracking with globe and map", icon: Radar },
      { key: "page_compare", label: "Compare Aircraft", desc: "Side-by-side comparison of up to 3 aircraft", icon: Layers },
      { key: "page_community", label: "Community", desc: "Aviation dealer and buyer discussion board", icon: Users },
      { key: "page_feature_requests", label: "Feature Requests", desc: "Community-driven roadmap and voting", icon: Lightbulb },
      { key: "page_soar_hub", label: "SOAR Startup Hub", desc: "Aviation startup accelerator and investor matching", icon: Rocket },
      { key: "page_startup_hub", label: "Start Up Hub", desc: "Innovation network for aviation projects", icon: Users },
      { key: "page_weekly_briefing", label: "Weekly Briefing", desc: "AI-generated market intelligence newsletter", icon: FileText },
      { key: "page_skyboss", label: "SkyBoss", desc: "3D globe with full traffic and listing overlay", icon: Globe },
      { key: "page_market_reports", label: "Market Reports", desc: "AI-generated aviation market intelligence", icon: BarChart3 },
      { key: "page_marketplace", label: "Marketplace", desc: "Third-party developer tools and integrations", icon: Search },
    ],
  },
  {
    category: "IntraZone Pages",
    color: "#D4A017",
    icon: ShieldCheck,
    items: [
      { key: "page_intrazone", label: "IntraZone Hub", desc: "Private workspace — deals, leads, matching engine", icon: LayoutDashboard },
      { key: "page_analytics", label: "Market Analytics", desc: "Price trends, days-on-market, inventory charts", icon: BarChart3 },
      { key: "page_valuation", label: "OMVM Valuation", desc: "Off-market value model price estimates", icon: TrendingUp },
      { key: "page_opex_calculator", label: "OPEX Calculator", desc: "Annual ownership cost calculator", icon: Calculator },
      { key: "page_escrow", label: "Escrow & Deals", desc: "Secure buyer-seller escrow transactions", icon: Handshake },
      { key: "page_leads", label: "Leads CRM", desc: "Buyer lead pipeline with auto-scoring", icon: Users },
      { key: "page_pre_buy_inspection", label: "Pre-Buy Inspection", desc: "On-site visual analysis with Max", icon: ShieldCheck },
      { key: "page_max_chat", label: "Ask Max", desc: "Aviation intelligence AI assistant", icon: MessageCircle },
    ],
  },
  {
    category: "Account & Admin Pages",
    color: "#6366f1",
    icon: Settings,
    items: [
      { key: "page_pricing", label: "Credits & Plans", desc: "Token pack purchasing and pricing", icon: CreditCard },
      { key: "page_subscription", label: "Subscription", desc: "Subscription plan management", icon: CreditCard },
      { key: "page_my_account", label: "My Account", desc: "Profile settings and preferences", icon: Users },
      { key: "page_admin_listings", label: "Admin Listings", desc: "Bulk listing oversight and scoring", icon: ShieldCheck },
      { key: "page_admin_marketplace", label: "Admin Marketplace", desc: "Approve developer tools and integrations", icon: Globe },
      { key: "page_admin_settings", label: "Admin Settings", desc: "Platform configuration", icon: Settings },
      { key: "page_supabase_sync", label: "Supabase Sync", desc: "FAA registry synchronization", icon: Database },
      { key: "page_developers", label: "Developers", desc: "Developer portal for API/tool creators", icon: Rocket },
      { key: "page_developer_earnings", label: "Developer Earnings", desc: "Commission and earnings dashboard", icon: TrendingUp },
    ],
  },
  // ── Tools & Features ──
  {
    category: "ATI Scoring Tools",
    color: "#22c55e",
    icon: Zap,
    items: [
      { key: "tool_ati_quick_score", label: "Quick Score Engine", desc: "LLM-based instant ATI scoring from text", icon: Zap },
      { key: "tool_ati_full_report", label: "Full Report Generator", desc: "Professional appraisal with all dimensions", icon: FileText },
      { key: "tool_ati_native_scoring", label: "Native ATI Scoring", desc: "Claude-based advanced scoring pipeline", icon: Star },
      { key: "tool_auto_score_faa", label: "Auto-Score FAA", desc: "Automatic scoring from FAA registry data", icon: Database },
      { key: "tool_auto_score_traffic", label: "Auto-Score Traffic", desc: "Score aircraft spotted in live traffic", icon: Radar },
      { key: "tool_omvm_valuation", label: "OMVM Valuation", desc: "Off-market value model engine", icon: TrendingUp },
      { key: "tool_market_expert_valuation", label: "Expert Valuation", desc: "Expert market valuation reports", icon: BarChart3 },
    ],
  },
  {
    category: "Traffic & Analytics",
    color: "#06b6d4",
    icon: Radar,
    items: [
      { key: "tool_live_traffic", label: "Live Traffic Engine", desc: "Real-time ADS-B data pipeline", icon: Radar },
      { key: "tool_cached_traffic", label: "Cached Traffic", desc: "ADS-B.lol integration", icon: Globe },
      { key: "tool_skyboss_globe", label: "3D Globe", desc: "Three.js interactive aircraft globe", icon: Globe },
      { key: "tool_traffic_map", label: "2D Traffic Map", desc: "Leaflet-based traffic visualization", icon: Layers },
      { key: "tool_aviation_news", label: "Aviation News Ticker", desc: "Market pulse news ring on dashboard", icon: FileText },
      { key: "tool_market_forecast", label: "Market Forecasts", desc: "AI-generated market predictions", icon: TrendingUp },
      { key: "tool_market_reports_ai", label: "Market Reports AI", desc: "AI-generated intelligence reports", icon: BarChart3 },
    ],
  },
  {
    category: "Business Tools",
    color: "#8b5cf6",
    icon: Handshake,
    items: [
      { key: "tool_escrow", label: "Escrow System", desc: "Secure transaction management", icon: Handshake },
      { key: "tool_leads_crm", label: "CRM / Leads", desc: "Buyer pipeline and lead scoring", icon: Users },
      { key: "tool_cmr_match_engine", label: "CMR Match Engine", desc: "Buyer-seller aircraft matching", icon: Search },
      { key: "tool_cmr_nego_brief", label: "Negotiation Briefs", desc: "AI-generated negotiation strategies", icon: FileText },
      { key: "tool_deal_radar", label: "Deal Radar Engine", desc: "Hot deal detection algorithm", icon: TrendingUp },
      { key: "tool_broker_alerts", label: "Broker Alerts", desc: "Automated broker notifications", icon: Lightbulb },
    ],
  },
  {
    category: "Verification & Trust",
    color: "#ec4899",
    icon: ShieldCheck,
    items: [
      { key: "tool_ati_verify", label: "ATI Verify System", desc: "Remote document verification flow", icon: Video },
      { key: "tool_vault_documents", label: "Document Vault", desc: "Polygon-blockchain document anchoring", icon: Database },
      { key: "tool_ocr_processing", label: "OCR Processing", desc: "Document text extraction and validation", icon: FileText },
      { key: "tool_ownership_trace", label: "Ownership Trace", desc: "Aircraft ownership chain verification", icon: Star },
    ],
  },
  {
    category: "Platform Features",
    color: "#f59e0b",
    icon: Settings,
    items: [
      { key: "feature_community", label: "Community Hub", desc: "Discussion boards and networking", icon: Users },
      { key: "feature_feature_requests", label: "Feature Request Board", desc: "User-driven roadmap with voting", icon: Lightbulb },
      { key: "feature_startup_hub", label: "Startup Accelerator", desc: "Aviation startup ecosystem", icon: Rocket },
      { key: "feature_developers_marketplace", label: "Developer Marketplace", desc: "Third-party tool ecosystem", icon: Search },
      { key: "feature_affiliate_program", label: "Affiliate Program", desc: "Revenue-sharing referral system", icon: TrendingUp },
      { key: "feature_webhooks", label: "Webhooks System", desc: "Outbound event webhooks", icon: Settings },
      { key: "feature_github_sync", label: "GitHub Sync", desc: "Feature request → GitHub issue sync", icon: Database },
      { key: "feature_calendar_sync", label: "Calendar Sync", desc: "Google Calendar escrow integration", icon: Calculator },
      { key: "feature_gdpr", label: "GDPR Compliance", desc: "Consent banners, data deletion, privacy", icon: ShieldCheck },
    ],
  },
];

const TIER_OPTIONS = [
  { value: "free_explorer", label: "Free Explorer" },
  { value: "pro", label: "Pro" },
  { value: "enterprise", label: "Enterprise" },
];

export default function FeatureTogglePanel() {
  const queryClient = useQueryClient();
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [newFeatureKey, setNewFeatureKey] = useState("");
  const [newFeatureLabel, setNewFeatureLabel] = useState("");
  const [selectedTier, setSelectedTier] = useState("pro");
  const [showAddForm, setShowAddForm] = useState(false);

  const { data: toggles = [], isLoading } = useQuery({
    queryKey: ["feature-toggles"],
    queryFn: () => base44.entities.FeatureToggle.list("-created_date", 200),
  });

  // Build lookup: feature_key → toggle record
  const toggleMap = {};
  toggles.forEach((t) => { toggleMap[t.feature_name] = t; });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.FeatureToggle.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feature-toggles"] });
      setNewFeatureKey("");
      setNewFeatureLabel("");
      setShowAddForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.FeatureToggle.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["feature-toggles"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FeatureToggle.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["feature-toggles"] }),
  });

  const toggleFeature = async (featureKey, currentToggle, targetTier) => {
    const now = new Date().toISOString();
    if (currentToggle) {
      const currentEnabled = currentToggle.enabled_for_tiers || {};
      const isEnabled = currentEnabled[targetTier] === true;
      await updateMutation.mutateAsync({
        id: currentToggle.id,
        data: {
          enabled_for_tiers: { ...currentEnabled, [targetTier]: !isEnabled },
          status: !isEnabled ? "enabled" : "disabled",
          modified_by: "admin",
          last_modified: now,
        },
      });
    } else {
      // Create new toggle
      await createMutation.mutateAsync({
        feature_name: featureKey,
        status: "enabled",
        enabled_for_tiers: { [targetTier]: true, free_explorer: false, pro: false, enterprise: false },
        is_beta: false,
        description: `Auto-created toggle for ${featureKey}`,
        created_by: "admin",
        modified_by: "admin",
        affected_tiers: ["free_explorer", "pro", "enterprise"],
      });
    }
  };

  const handleDelete = (toggle) => {
    if (confirm(`Delete toggle "${toggle.feature_name}"? This cannot be undone.`)) {
      deleteMutation.mutate(toggle.id);
    }
  };

  const isEnabledForTier = (toggle, tier) => {
    if (!toggle || !toggle.enabled_for_tiers) return true; // no toggle = enabled by default
    return toggle.enabled_for_tiers[tier] !== false; // default true
  };

  return (
    <div className="glass-card p-7 mt-6">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-11 h-11 rounded-2xl bg-[#8b5cf6]/10 flex items-center justify-center shrink-0">
          <ToggleLeft className="w-5 h-5 text-[#8b5cf6]" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-black text-[#0B2D5B] uppercase tracking-tight text-base">
              Feature Toggles — Super Admin
            </h2>
            <Badge className="bg-[#8b5cf6]/15 text-[#7c3aed] border-[#8b5cf6]/30 uppercase text-[10px] tracking-widest font-bold">
              Tier-Gated
            </Badge>
          </div>
          <p className="text-sm text-[#6B6560] mt-1">
            Enable or disable every page, component, and tool across the platform — per subscription tier.
          </p>

          {/* Tier selector */}
          <div className="flex items-center gap-3 mt-3">
            <span className="text-[11px] font-bold text-[#6B6560] uppercase tracking-wide">Toggle for tier:</span>
            <Select value={selectedTier} onValueChange={setSelectedTier}>
              <SelectTrigger className="w-40 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIER_OPTIONS.map((t) => (
                  <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge className={`
              text-[10px] uppercase tracking-wider font-bold
              ${selectedTier === "free_explorer" ? "bg-gray-100 text-gray-600 border-gray-200" : ""}
              ${selectedTier === "pro" ? "bg-blue-50 text-blue-700 border-blue-200" : ""}
              ${selectedTier === "enterprise" ? "bg-purple-50 text-purple-700 border-purple-200" : ""}
            `}>
              {selectedTier === "free_explorer" ? "Free Explorer" : selectedTier === "pro" ? "Pro" : "Enterprise"}
            </Badge>
          </div>
        </div>

        {/* Add new feature */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddForm(!showAddForm)}
          className="gap-1.5 text-[11px]"
        >
          <Plus className="w-3.5 h-3.5" /> Add Feature
        </Button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="rounded-xl border border-dashed border-[#8b5cf6]/30 bg-[#8b5cf6]/03 p-4 mb-5 flex items-end gap-3 flex-wrap">
          <div className="flex-1 min-w-[160px]">
            <label className="text-[10px] font-bold text-[#6B6560] uppercase tracking-wide block mb-1">Feature Key</label>
            <Input
              value={newFeatureKey}
              onChange={(e) => setNewFeatureKey(e.target.value)}
              placeholder="e.g. tool_new_feature"
              className="h-8 text-xs"
            />
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="text-[10px] font-bold text-[#6B6560] uppercase tracking-wide block mb-1">Label</label>
            <Input
              value={newFeatureLabel}
              onChange={(e) => setNewFeatureLabel(e.target.value)}
              placeholder="e.g. New Feature"
              className="h-8 text-xs"
            />
          </div>
          <Button
            size="sm"
            onClick={async () => {
              if (!newFeatureKey) return;
              await createMutation.mutateAsync({
                feature_name: newFeatureKey,
                status: "enabled",
                enabled_for_tiers: { free_explorer: false, pro: true, enterprise: true },
                is_beta: true,
                description: newFeatureLabel || `Custom toggle for ${newFeatureKey}`,
                created_by: "admin",
                modified_by: "admin",
                affected_tiers: ["free_explorer", "pro", "enterprise"],
              });
            }}
            disabled={createMutation.isPending || !newFeatureKey}
            className="gap-1.5 text-[11px] h-8"
            style={{ background: "linear-gradient(135deg,#8b5cf6,#7c3aed)" }}
          >
            <Save className="w-3.5 h-3.5" /> Add
          </Button>
        </div>
      )}

      {/* Category accordion */}
      <div className="space-y-2">
        {FEATURE_CATALOG.map((cat) => {
          const CategoryIcon = cat.icon;
          const expanded = expandedCategory === cat.category;
          return (
            <div key={cat.category} className="rounded-xl border border-black/[0.06] bg-white/40 overflow-hidden">
              {/* Category header */}
              <button
                onClick={() => setExpandedCategory(expanded ? null : cat.category)}
                className="w-full flex items-center gap-3 px-5 py-3 hover:bg-black/[0.02] transition-colors"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${cat.color}14`, border: `1px solid ${cat.color}30` }}>
                  <CategoryIcon className="w-4 h-4" style={{ color: cat.color }} />
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-bold text-[#1A1814]">{cat.category}</p>
                  <p className="text-[10px] text-[#6B6560]">{cat.items.length} features</p>
                </div>
                <div className="flex items-center gap-1">
                  {cat.items.filter((item) => {
                    const t = toggleMap[item.key];
                    return isEnabledForTier(t, selectedTier);
                  }).length > 0 && (
                    <Badge className="bg-green-50 text-green-700 border-green-200 text-[9px]">
                      {cat.items.filter((item) => {
                        const t = toggleMap[item.key];
                        return isEnabledForTier(t, selectedTier);
                      }).length} on
                    </Badge>
                  )}
                  <svg
                    className={`w-4 h-4 text-[#6B6560] transition-transform ${expanded ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Category items */}
              {expanded && (
                <div className="px-5 pb-4 space-y-1" style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }}>
                  {cat.items.map((item) => {
                    const toggle = toggleMap[item.key];
                    const enabled = isEnabledForTier(toggle, selectedTier);
                    const hasCustomToggle = !!toggle;
                    const ItemIcon = item.icon;
                    return (
                      <div
                        key={item.key}
                        className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-black/[0.02] transition-colors group"
                      >
                        <ItemIcon className="w-3.5 h-3.5 shrink-0 text-[#6B6560]" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-[#1A1814]">{item.label}</p>
                            {hasCustomToggle && (
                              <Badge className="bg-[#8b5cf6]/10 text-[#7c3aed] border-[#8b5cf6]/20 text-[8px] tracking-wider">
                                CUSTOM
                              </Badge>
                            )}
                          </div>
                          <p className="text-[10px] text-[#6B6560] truncate">{item.desc}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge className={`
                            text-[9px] uppercase tracking-wider font-bold
                            ${enabled ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-600 border-red-200"}
                          `}>
                            {enabled ? "ON" : "OFF"}
                          </Badge>
                          <Switch
                            checked={enabled}
                            onCheckedChange={() => toggleFeature(item.key, toggle, selectedTier)}
                          />
                          {hasCustomToggle && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(toggle); }}
                              className="opacity-0 group-hover:opacity-50 hover:opacity-100 text-red-500 transition-opacity ml-1"
                              title="Delete custom toggle (revert to default ON)"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Existing custom toggles not in catalog */}
      {toggles.filter((t) => !FEATURE_CATALOG.some((cat) => cat.items.some((item) => item.key === t.feature_name))).length > 0 && (
        <div className="mt-4 rounded-xl border border-dashed border-[#E8A83A]/30 bg-[#E8A83A]/05 p-4">
          <p className="text-[10px] font-bold text-[#A67C00] uppercase tracking-wide mb-2">Orphan Custom Toggles</p>
          <div className="space-y-1">
            {toggles.filter((t) => !FEATURE_CATALOG.some((cat) => cat.items.some((item) => item.key === t.feature_name))).map((t) => (
              <div key={t.id} className="flex items-center justify-between py-1.5 px-3 rounded-lg hover:bg-black/[0.02]">
                <div className="flex items-center gap-2">
                  <code className="text-[10px] text-[#6B6560] font-mono">{t.feature_name}</code>
                  <Badge className="text-[8px]">{t.status}</Badge>
                </div>
                <button onClick={() => handleDelete(t)} className="text-red-400 hover:text-red-600 transition-colors">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="w-5 h-5 border-2 border-[#8b5cf6]/30 border-t-[#8b5cf6] rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}