import { base44 } from "@/api/base44Client";
import { logDecision } from "@/lib/logDecision";

/**
 * Affiliate chain + lead event engine.
 * MVP attribution: first_verified_source wins (per section 11 of the spec).
 * Max 3 referral levels honored.
 */

export const MAX_CHAIN_DEPTH = 3;

// ─── Session / dedup ──────────────────────────────────────────────────────
const SESSION_KEY = "abos_aff_session";
export function getSessionId() {
  if (typeof window === "undefined") return "";
  let s = localStorage.getItem(SESSION_KEY);
  if (!s) {
    s = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(SESSION_KEY, s);
  }
  return s;
}

// ─── URL parsing ──────────────────────────────────────────────────────────
/**
 * Parse chain slugs from URL — supports both:
 *   ?ref=MKP001&sub1=BRK022&sub2=INT007
 *   path /r/MKP001-BRK022-INT007
 * Returns ordered array, level 1 = most upstream.
 */
export function parseChainFromUrl(url = typeof window !== "undefined" ? window.location.href : "") {
  if (!url) return [];
  try {
    const u = new URL(url, "http://x.invalid");
    const params = u.searchParams;
    const chain = [];
    const ref = params.get("ref");
    if (ref) chain.push(ref);
    for (let i = 1; i <= MAX_CHAIN_DEPTH - 1; i++) {
      const s = params.get(`sub${i}`);
      if (s) chain.push(s);
    }
    // Path-style: /r/A-B-C
    const m = u.pathname.match(/\/r\/([^/?#]+)/);
    if (chain.length === 0 && m) {
      return m[1].split("-").filter(Boolean).slice(0, MAX_CHAIN_DEPTH);
    }
    return chain.slice(0, MAX_CHAIN_DEPTH);
  } catch {
    return [];
  }
}

// ─── Slug generation ──────────────────────────────────────────────────────
const ROLE_PREFIX = {
  issuer: "ISS",
  master_distributor: "MST",
  marketplace: "MKP",
  broker: "BRK",
  sub_broker: "SBR",
  introducer: "INT",
  closing_agent: "CLS",
};

export async function generateUniqueSlug(role = "marketplace") {
  const prefix = ROLE_PREFIX[role] || "REF";
  // Find next number for this prefix
  const existing = await base44.entities.AffiliateLink.filter({}, "-created_date", 500);
  const used = existing
    .map(l => l.slug)
    .filter(s => s?.startsWith(prefix))
    .map(s => parseInt(s.slice(prefix.length), 10))
    .filter(n => !isNaN(n));
  const next = used.length ? Math.max(...used) + 1 : 1;
  return `${prefix}${String(next).padStart(3, "0")}`;
}

// ─── Event logging ────────────────────────────────────────────────────────
/**
 * Log any lead event. If this event is `verified`, also locks the
 * first_verified_source on the card (idempotent — never overwrites).
 */
export async function logEvent({
  event_type,
  card,
  affiliate_link = null,
  chain_slugs = null,
  actor_email = "",
  metadata = {},
  is_verified = false,
}) {
  if (!event_type) return null;

  const evt = await base44.entities.LeadEvent.create({
    event_type,
    ati_card: card?.id || undefined,
    public_card_code: card?.public_card_code || undefined,
    affiliate_link: affiliate_link?.id || undefined,
    affiliate_link_slug: affiliate_link?.slug || undefined,
    chain_slugs: chain_slugs || parseChainFromUrl(),
    actor_email,
    session_id: getSessionId(),
    is_verified,
    metadata,
  });

  // First-verified-source lock on the card
  if (is_verified && card?.id && !card.first_verified_source_id) {
    const lockedSlug = affiliate_link?.slug || "direct";

    if (affiliate_link?.slug) {
      trackAffiliateEvent(event_type === "conversion" ? "conversion" : "lead", affiliate_link.slug, {
        public_card_code: card.public_card_code,
        event_type,
      });
    }

    await base44.entities.ATICard.update(card.id, {
      first_verified_source_id: lockedSlug,
      first_verified_locked_at: new Date().toISOString(),
      status: card.status === "issued" || card.status === "draft" ? "engaged" : card.status,
    });

    // ─── Decision Log: first-verified-source lock (one-shot, permanent) ──
    logDecision({
      type: "first_verified_source",
      subject: { type: "ati_card", id: card.id, label: card.public_card_code },
      inputs: {
        event_type,
        chain_slugs: chain_slugs || [],
        candidate_slug: lockedSlug,
      },
      outputs: {
        locked_slug: lockedSlug,
        owner_email: affiliate_link?.owner_email || null,
        owner_role: affiliate_link?.owner_role || "direct",
      },
      version: "attribution_v1",
      source: "lib/affiliate:logEvent",
      actor: actor_email || "system",
      reasoning: `First verified source locked — ${lockedSlug} wins attribution for this card forever.`,
    });
  }

  return evt;
}

/**
 * Increment cheap counters on the link (best-effort).
 */
export async function bumpLinkCounter(link, field) {
  if (!link?.id) return;
  const patch = { [field]: (link[field] || 0) + 1 };
  if (field === "click_count") patch.last_click_at = new Date().toISOString();
  try { await base44.entities.AffiliateLink.update(link.id, patch); } catch {}
}

/**
 * Resolve a link by slug (used on landing).
 */
export async function resolveLinkBySlug(slug) {
  if (!slug) return null;
  const results = await base44.entities.AffiliateLink.filter({ slug }, "-created_date", 1);
  return results[0] || null;
}

// ─── Tracking (click / lead / conversion) ──────────────────────────────────
/**
 * Record a click/lead/conversion against a slug: bumps the link's counters,
 * fans out to any subscribed webhooks (affiliate.click / .lead / .conversion),
 * and emails the affiliate owner on lead/conversion. Safe to call anonymously.
 */
export async function trackAffiliateEvent(event_type, slug, metadata = {}) {
  if (!slug || !event_type) return null;
  try {
    const res = await base44.functions.invoke("affiliateTrack", {
      event_type,
      slug,
      chain_slugs: parseChainFromUrl(),
      metadata,
    });
    return res?.data || res;
  } catch {
    return null;
  }
}

/**
 * Track a page/card view that arrived via an affiliate link (?ref=SLUG), once
 * per session. Call on mount of any publicly shareable page.
 */
export async function trackAffiliateClickFromUrl(metadata = {}) {
  const chain = parseChainFromUrl();
  const slug = chain[chain.length - 1];
  if (!slug || typeof window === "undefined") return null;
  const dedupeKey = `abos_aff_clicked_${slug}_${getSessionId()}`;
  if (sessionStorage.getItem(dedupeKey)) return null;
  sessionStorage.setItem(dedupeKey, "1");
  return trackAffiliateEvent("click", slug, metadata);
}

// ─── Banners ────────────────────────────────────────────────────────────────
export const BANNER_SIZES = [
  { key: "leaderboard", label: "Leaderboard", w: 728, h: 90 },
  { key: "rectangle", label: "Medium Rectangle", w: 300, h: 250 },
  { key: "skyscraper", label: "Wide Skyscraper", w: 160, h: 600 },
  { key: "square", label: "Square", w: 250, h: 250 },
];

/**
 * Build the click-through URL for a link, honoring an upstream chain slug.
 */
export function buildLinkUrl(baseUrl, targetPath, link) {
  const url = `${baseUrl}${targetPath}`;
  return link.parent_link_slug
    ? `${url}?ref=${link.parent_link_slug}&sub1=${link.slug}`
    : `${url}?ref=${link.slug}`;
}

/**
 * Build a copy-pasteable HTML embed snippet (banner or text link) for a link.
 * `imageUrl` is optional — falls back to a text banner when not provided.
 */
export function buildBannerEmbed({ link, clickUrl, imageUrl, size = BANNER_SIZES[1], alt = "Aircraft Buy Or Sell" }) {
  const trackedHref = clickUrl;
  if (imageUrl) {
    return `<a href="${trackedHref}" target="_blank" rel="noopener sponsored"><img src="${imageUrl}" width="${size.w}" height="${size.h}" alt="${alt}" style="border:0;max-width:100%;" /></a>`;
  }
  return `<a href="${trackedHref}" target="_blank" rel="noopener sponsored" style="display:inline-block;padding:12px 20px;background:#0B2D5B;color:#fff;font:700 13px/1 sans-serif;text-decoration:none;border-radius:6px;">${alt} — Verified Aircraft Listings</a>`;
}

// ─── Attribution resolution (MVP: first verified source wins) ─────────────
/**
 * Decide who gets credit for a card conversion.
 * Returns { winner_slug, reason, chain } or null.
 */
export function resolveAttribution(card, recentEvents = []) {
  if (card?.first_verified_source_id) {
    return {
      winner_slug: card.first_verified_source_id,
      reason: "first_verified_source_locked",
      locked_at: card.first_verified_locked_at,
    };
  }
  // Fallback: first verified event in log order
  const firstVerified = [...recentEvents]
    .filter(e => e.is_verified && e.affiliate_link_slug)
    .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))[0];
  if (firstVerified) {
    return {
      winner_slug: firstVerified.affiliate_link_slug,
      reason: "first_verified_event",
      locked_at: firstVerified.created_date,
    };
  }
  return { winner_slug: "direct", reason: "no_verified_source" };
}