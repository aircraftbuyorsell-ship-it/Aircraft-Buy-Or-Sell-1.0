import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link2, Copy, Check, Plus, BarChart3, Trash2, Power } from "lucide-react";
import { generateUniqueSlug } from "@/lib/affiliate";

const ROLES = [
  { value: "marketplace", label: "Marketplace" },
  { value: "broker", label: "Broker" },
  { value: "sub_broker", label: "Sub-broker" },
  { value: "introducer", label: "Introducer" },
  { value: "closing_agent", label: "Closing Agent" },
];

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button onClick={copy}
      className="flex items-center gap-1 px-2 py-1 text-[10px] uppercase tracking-wider font-black text-[#0B2D5B] hover:bg-[#0B2D5B] hover:text-white border border-[#0B2D5B]/30 rounded transition-colors shrink-0">
      {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
    </button>
  );
}

export default function AffiliateLinksPanel({ card }) {
  const qc = useQueryClient();
  const [role, setRole] = useState("marketplace");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [parentSlug, setParentSlug] = useState("");

  const { data: links = [], isLoading } = useQuery({
    queryKey: ["card-links", card?.id],
    enabled: !!card?.id,
    queryFn: () => base44.entities.AffiliateLink.filter({ target_card: card.id }, "-created_date", 50),
  });

  const { data: me } = useQuery({ queryKey: ["auth-me"], queryFn: () => base44.auth.me() });

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const cardPath = `/c/${card?.public_card_code}`;

  const buildUrl = (link) => {
    // If parent_link_slug set, emit full chain (upstream → current)
    if (link.parent_link_slug) {
      return `${baseUrl}${cardPath}?ref=${link.parent_link_slug}&sub1=${link.slug}`;
    }
    return `${baseUrl}${cardPath}?ref=${link.slug}`;
  };

  const createLink = async () => {
    if (!card?.id) return;
    setCreating(true);
    try {
      const slug = await generateUniqueSlug(role);
      await base44.entities.AffiliateLink.create({
        slug,
        owner_email: ownerEmail.trim() || me?.email || "",
        owner_role: role,
        target_type: "ati_card",
        target_card: card.id,
        parent_link_slug: parentSlug.trim() || undefined,
        is_active: true,
        click_count: 0,
        lead_count: 0,
        conversion_count: 0,
      });
      setOwnerEmail("");
      setParentSlug("");
      qc.invalidateQueries({ queryKey: ["card-links", card.id] });
    } finally {
      setCreating(false);
    }
  };

  const toggleMut = useMutation({
    mutationFn: (l) => base44.entities.AffiliateLink.update(l.id, { is_active: !l.is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["card-links", card?.id] }),
  });
  const deleteMut = useMutation({
    mutationFn: (l) => base44.entities.AffiliateLink.delete(l.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["card-links", card?.id] }),
  });

  if (!card) return null;

  return (
    <div className="bg-white border border-black/[0.07] rounded-2xl p-5 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Link2 className="w-4 h-4 text-[#E8A83A]" />
        <p className="text-[10px] uppercase tracking-[0.15em] font-black text-[#E8A83A]">Affiliate Links · Referral Chain</p>
      </div>

      {/* Create new link */}
      <div className="bg-[#F7F4EF] rounded-xl p-3 md:p-4 space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-[140px_1fr_140px_auto] gap-2">
          <select value={role} onChange={e => setRole(e.target.value)}
            className="px-3 py-2 bg-white border border-black/10 rounded-lg text-sm font-semibold text-[#1A1814]">
            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <input value={ownerEmail} onChange={e => setOwnerEmail(e.target.value)}
            placeholder={`Owner email (${me?.email || "me"})`}
            className="px-3 py-2 bg-white border border-black/10 rounded-lg text-sm text-[#1A1814] placeholder-[#AAA49C]" />
          <input value={parentSlug} onChange={e => setParentSlug(e.target.value)}
            placeholder="Upstream slug (opt)"
            className="px-3 py-2 bg-white border border-black/10 rounded-lg text-sm text-[#1A1814] placeholder-[#AAA49C] font-mono" />
          <button onClick={createLink} disabled={creating}
            className="flex items-center justify-center gap-1.5 bg-[#0B2D5B] hover:bg-[#143C75] disabled:opacity-50 text-white text-[11px] uppercase tracking-wider font-black px-3 py-2 rounded-md">
            <Plus className="w-3.5 h-3.5" /> {creating ? "…" : "Create"}
          </button>
        </div>
        <p className="text-[10px] text-[#AAA49C]">
          Set an upstream slug to build a chain (max 3 levels). First verified lead wins attribution.
        </p>
      </div>

      {/* Links list */}
      <div className="mt-4">
        {isLoading ? (
          <div className="h-20 bg-black/5 rounded-lg animate-pulse" />
        ) : links.length === 0 ? (
          <p className="text-center text-sm text-[#AAA49C] py-6">No affiliate links yet for this card.</p>
        ) : (
          <div className="space-y-2">
            {links.map(l => {
              const url = buildUrl(l);
              return (
                <div key={l.id} className={`border rounded-lg p-3 ${l.is_active ? "border-black/[0.08]" : "border-black/[0.05] opacity-60"}`}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-black text-[#0B2D5B]">{l.slug}</span>
                    <span className="text-[9px] uppercase tracking-wider font-black px-2 py-0.5 rounded-full bg-black/5 text-[#6B6560]">
                      {ROLES.find(r => r.value === l.owner_role)?.label || l.owner_role}
                    </span>
                    {l.parent_link_slug && (
                      <span className="text-[9px] uppercase tracking-wider text-[#AAA49C] font-semibold">
                        ↳ under <span className="font-mono font-bold text-[#6B6560]">{l.parent_link_slug}</span>
                      </span>
                    )}
                    <span className="text-[10px] text-[#6B6560] flex items-center gap-0.5 ml-auto">
                      <BarChart3 className="w-3 h-3" /> {l.click_count || 0} clicks · {l.lead_count || 0} leads · {l.conversion_count || 0} conv
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <code className="text-[11px] text-[#1A1814] bg-[#F7F4EF] px-2 py-1 rounded flex-1 truncate font-mono">{url}</code>
                    <CopyBtn text={url} />
                    <button onClick={() => toggleMut.mutate(l)} title={l.is_active ? "Pause" : "Activate"}
                      className="p-1.5 text-[#6B6560] hover:text-[#0B2D5B] shrink-0">
                      <Power className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => { if (confirm(`Delete link ${l.slug}?`)) deleteMut.mutate(l); }}
                      className="p-1.5 text-[#6B6560] hover:text-[#C0392B] shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[10px] text-[#AAA49C] mt-1">Owner: {l.owner_email}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Attribution note */}
      {card.first_verified_source_id && (
        <div className="mt-4 bg-[rgba(15,122,86,0.08)] border border-[rgba(15,122,86,0.2)] rounded-lg px-3 py-2">
          <p className="text-[11px] text-[#0F7A56]">
            🔒 <span className="font-black">Attribution locked</span> — first verified source: <span className="font-mono font-bold">{card.first_verified_source_id}</span>
            {card.first_verified_locked_at && <span className="text-[#0F7A56]/70"> · {new Date(card.first_verified_locked_at).toLocaleString()}</span>}
          </p>
        </div>
      )}
    </div>
  );
}