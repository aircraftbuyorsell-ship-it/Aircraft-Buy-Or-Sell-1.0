import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link2, Copy, Check, Plus, BarChart3, Trash2, Power, Image as ImageIcon, MousePointerClick, Users, TrendingUp } from "lucide-react";
import { generateUniqueSlug, buildLinkUrl, buildBannerEmbed, BANNER_SIZES } from "@/lib/affiliate";

const ROLES = [
  { value: "marketplace", label: "Marketplace" },
  { value: "broker", label: "Broker" },
  { value: "sub_broker", label: "Sub-broker" },
  { value: "introducer", label: "Introducer" },
  { value: "closing_agent", label: "Closing Agent" },
];

const TARGET_TYPES = [
  { value: "ati_card", label: "ATI Card", path: (id) => `/ati-card/${id}` },
  { value: "listing", label: "Listing", path: (id) => `/listing/${id}` },
  { value: "checkout", label: "Checkout / Plan", path: (id) => `/${id}` },
  { value: "bundle", label: "Service / Bundle", path: (id) => `/${id}` },
];

function CopyBtn({ text, label = "Copy" }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button onClick={copy}
      className="flex items-center gap-1 px-2 py-1 text-[10px] uppercase tracking-wider font-black text-[#0B2D5B] hover:bg-[#0B2D5B] hover:text-white border border-[#0B2D5B]/30 rounded transition-colors shrink-0">
      {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> {label}</>}
    </button>
  );
}

function StatTile({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white border border-black/[0.07] rounded-xl p-4 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}1A` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div>
        <p className="text-lg font-black text-[#1A1814] leading-none">{value}</p>
        <p className="text-[10px] uppercase tracking-wider font-bold text-[#6B6560] mt-1">{label}</p>
      </div>
    </div>
  );
}

function BannerPicker({ link, baseUrl, targetPath }) {
  const [size, setSize] = useState(BANNER_SIZES[1]);
  const clickUrl = buildLinkUrl(baseUrl, targetPath, link);
  const embed = buildBannerEmbed({ link, clickUrl, size });
  return (
    <div className="mt-2 bg-[#F7F4EF] rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-black text-[#6B6560]">
          <ImageIcon className="w-3.5 h-3.5" /> Banner embed
        </div>
        <select value={size.key} onChange={e => setSize(BANNER_SIZES.find(s => s.key === e.target.value))}
          className="text-[11px] px-2 py-1 bg-white border border-black/10 rounded font-semibold">
          {BANNER_SIZES.map(s => <option key={s.key} value={s.key}>{s.label} ({s.w}x{s.h})</option>)}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <code className="text-[10px] text-[#1A1814] bg-white px-2 py-1.5 rounded flex-1 truncate font-mono border border-black/5">{embed}</code>
        <CopyBtn text={embed} label="Copy HTML" />
      </div>
      <p className="text-[9px] text-[#AAA49C] mt-1.5">Paste this snippet on any partner site. Clicks are tracked, attributed, and dispatched to your webhooks automatically.</p>
    </div>
  );
}

export default function AffiliateDashboard() {
  const qc = useQueryClient();
  const [role, setRole] = useState("marketplace");
  const [targetType, setTargetType] = useState("ati_card");
  const [targetId, setTargetId] = useState("");
  const [campaignId, setCampaignId] = useState("");
  const [parentSlug, setParentSlug] = useState("");
  const [creating, setCreating] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const { data: me } = useQuery({ queryKey: ["auth-me"], queryFn: () => base44.auth.me() });

  const { data: links = [], isLoading } = useQuery({
    queryKey: ["my-affiliate-links", me?.email],
    enabled: !!me?.email,
    queryFn: () => base44.entities.AffiliateLink.filter({ owner_email: me.email }, "-created_date", 200),
  });

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const totals = useMemo(() => links.reduce((acc, l) => ({
    clicks: acc.clicks + (l.click_count || 0),
    leads: acc.leads + (l.lead_count || 0),
    conversions: acc.conversions + (l.conversion_count || 0),
  }), { clicks: 0, leads: 0, conversions: 0 }), [links]);

  const createLink = async () => {
    if (!me?.email) return;
    setCreating(true);
    try {
      const slug = await generateUniqueSlug(role);
      const payload = {
        slug,
        owner_email: me.email,
        owner_role: role,
        target_type: targetType,
        campaign_id: campaignId.trim() || undefined,
        parent_link_slug: parentSlug.trim() || undefined,
        is_active: true,
        click_count: 0,
        lead_count: 0,
        conversion_count: 0,
      };
      if (targetType === "ati_card") payload.target_card = targetId.trim() || undefined;
      if (targetType === "listing") payload.target_listing = targetId.trim() || undefined;
      await base44.entities.AffiliateLink.create(payload);
      setTargetId("");
      setCampaignId("");
      setParentSlug("");
      qc.invalidateQueries({ queryKey: ["my-affiliate-links", me.email] });
    } finally {
      setCreating(false);
    }
  };

  const toggleMut = useMutation({
    mutationFn: (l) => base44.entities.AffiliateLink.update(l.id, { is_active: !l.is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-affiliate-links", me?.email] }),
  });
  const deleteMut = useMutation({
    mutationFn: (l) => base44.entities.AffiliateLink.delete(l.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-affiliate-links", me?.email] }),
  });

  const targetPathFor = (l) => {
    const def = TARGET_TYPES.find(t => t.value === l.target_type) || TARGET_TYPES[0];
    const id = l.target_card || l.target_listing || "";
    return def.path(id);
  };

  return (
    <div className="min-h-screen px-4 md:px-8 py-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-1">
        <Link2 className="w-5 h-5 text-[#E8A83A]" />
        <h1 className="text-xl font-black text-[#1A1814]">Affiliate Program</h1>
      </div>
      <p className="text-sm text-[#6B6560] mb-6">Generate tracked links and banners for any listing, ATI card, or service — clicks, leads, and conversions flow into your webhooks and email notifications automatically.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <StatTile icon={MousePointerClick} label="Total Clicks" value={totals.clicks} color="#0B2D5B" />
        <StatTile icon={Users} label="Total Leads" value={totals.leads} color="#E8A83A" />
        <StatTile icon={TrendingUp} label="Conversions" value={totals.conversions} color="#0F7A56" />
      </div>

      <div className="bg-white border border-black/[0.07] rounded-2xl p-5 md:p-6 mb-6">
        <p className="text-[10px] uppercase tracking-[0.15em] font-black text-[#E8A83A] mb-4">Create a new link</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
          <select value={role} onChange={e => setRole(e.target.value)}
            className="px-3 py-2 bg-[#F7F4EF] border border-black/10 rounded-lg text-sm font-semibold text-[#1A1814]">
            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <select value={targetType} onChange={e => setTargetType(e.target.value)}
            className="px-3 py-2 bg-[#F7F4EF] border border-black/10 rounded-lg text-sm font-semibold text-[#1A1814]">
            {TARGET_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input value={targetId} onChange={e => setTargetId(e.target.value)}
            placeholder="Target ID / card code / service slug"
            className="px-3 py-2 bg-[#F7F4EF] border border-black/10 rounded-lg text-sm text-[#1A1814] placeholder-[#AAA49C]" />
          <input value={campaignId} onChange={e => setCampaignId(e.target.value)}
            placeholder="Campaign tag (opt)"
            className="px-3 py-2 bg-[#F7F4EF] border border-black/10 rounded-lg text-sm text-[#1A1814] placeholder-[#AAA49C]" />
          <input value={parentSlug} onChange={e => setParentSlug(e.target.value)}
            placeholder="Upstream slug (opt)"
            className="px-3 py-2 bg-[#F7F4EF] border border-black/10 rounded-lg text-sm text-[#1A1814] placeholder-[#AAA49C] font-mono" />
        </div>
        <button onClick={createLink} disabled={creating}
          className="mt-3 flex items-center justify-center gap-1.5 bg-[#0B2D5B] hover:bg-[#143C75] disabled:opacity-50 text-white text-[11px] uppercase tracking-wider font-black px-4 py-2.5 rounded-md">
          <Plus className="w-3.5 h-3.5" /> {creating ? "Creating…" : "Create Link"}
        </button>
        <p className="text-[10px] text-[#AAA49C] mt-2">
          Leave Target ID blank for a general marketplace link. Chain up to 3 levels using an upstream slug — first verified lead wins attribution.
        </p>
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-[0.15em] font-black text-[#0B2D5B] mb-3">Your links ({links.length})</p>
        {isLoading ? (
          <div className="h-24 bg-black/5 rounded-lg animate-pulse" />
        ) : links.length === 0 ? (
          <p className="text-center text-sm text-[#AAA49C] py-8 bg-white border border-black/[0.07] rounded-2xl">No affiliate links yet — create your first one above.</p>
        ) : (
          <div className="space-y-2">
            {links.map(l => {
              const path = targetPathFor(l);
              const url = buildLinkUrl(baseUrl, path, l);
              return (
                <div key={l.id} className={`bg-white border rounded-xl p-4 ${l.is_active ? "border-black/[0.08]" : "border-black/[0.05] opacity-60"}`}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-black text-[#0B2D5B]">{l.slug}</span>
                    <span className="text-[9px] uppercase tracking-wider font-black px-2 py-0.5 rounded-full bg-black/5 text-[#6B6560]">
                      {ROLES.find(r => r.value === l.owner_role)?.label || l.owner_role}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-[#AAA49C] font-semibold">
                      {TARGET_TYPES.find(t => t.value === l.target_type)?.label}
                    </span>
                    {l.campaign_id && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#E8A83A]/10 text-[#B4791F] font-bold">#{l.campaign_id}</span>
                    )}
                    <span className="text-[10px] text-[#6B6560] flex items-center gap-0.5 ml-auto">
                      <BarChart3 className="w-3 h-3" /> {l.click_count || 0} clicks · {l.lead_count || 0} leads · {l.conversion_count || 0} conv
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <code className="text-[11px] text-[#1A1814] bg-[#F7F4EF] px-2 py-1 rounded flex-1 truncate font-mono">{url}</code>
                    <CopyBtn text={url} />
                    <button onClick={() => setExpandedId(expandedId === l.id ? null : l.id)} title="Banner"
                      className="p-1.5 text-[#6B6560] hover:text-[#0B2D5B] shrink-0">
                      <ImageIcon className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => toggleMut.mutate(l)} title={l.is_active ? "Pause" : "Activate"}
                      className="p-1.5 text-[#6B6560] hover:text-[#0B2D5B] shrink-0">
                      <Power className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => { if (confirm(`Delete link ${l.slug}?`)) deleteMut.mutate(l); }}
                      className="p-1.5 text-[#6B6560] hover:text-[#C0392B] shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {expandedId === l.id && <BannerPicker link={l} baseUrl={baseUrl} targetPath={path} />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
