import { base44 } from "@/api/base44Client";
import { resolveAttribution } from "@/lib/affiliate";

/**
 * 3-Level Waterfall Commission Model
 *
 * Gross sale → Finder's fee pool → Split across levels:
 *   Level 0 (Issuer / Platform):  20%  of pool  (always)
 *   Level 1 (Marketplace):        40%  of pool  (winner of first_verified_source)
 *   Level 2 (Broker / sub-link):  30%  of pool  (if chain has 2+ levels)
 *   Level 3 (Sub-broker):         10%  of pool  (if chain has 3 levels)
 *
 * When fewer levels are present, higher levels absorb the unallocated %.
 */

export const WATERFALL = {
  ISSUER_PLATFORM: 0.20,
  MARKETPLACE:     0.40,
  BROKER:          0.30,
  SUB_BROKER:      0.10,
};

export const ROLE_META = {
  issuer:      { label: "Issuer / Platform", color: "#0B2D5B" },
  marketplace: { label: "Marketplace",        color: "#E8A83A" },
  broker:      { label: "Broker",             color: "#0F7A56" },
  sub_broker:  { label: "Sub-broker",         color: "#185FA5" },
};

/**
 * Compute the waterfall split for a finalized escrow transaction.
 * Returns an array of { level, role, payee_email, payee_slug, percentage, amount, attribution_reason }.
 */
export async function computeWaterfall({ card, escrow, commissionPool, events = [] }) {
  const pool = commissionPool || escrow?.finders_fee_amount || 0;
  if (!pool || pool <= 0) return [];

  // 1. Resolve attribution winner (first verified source)
  const attribution = resolveAttribution(card, events);
  const winnerSlug = attribution?.winner_slug;

  // 2. Look up the winning link + its upstream chain
  let marketplaceLink = null;
  let brokerLink = null;
  let subBrokerLink = null;

  if (winnerSlug && winnerSlug !== "direct") {
    const links = await base44.entities.AffiliateLink.filter({ slug: winnerSlug }, "-created_date", 1);
    const winner = links[0];
    if (winner) {
      // Walk upstream via parent_link_slug (max 2 hops up)
      const chain = [winner];
      let cursor = winner;
      for (let i = 0; i < 2 && cursor?.parent_link_slug; i++) {
        const parents = await base44.entities.AffiliateLink.filter({ slug: cursor.parent_link_slug }, "-created_date", 1);
        if (!parents[0]) break;
        chain.unshift(parents[0]); // most upstream first
        cursor = parents[0];
      }
      // chain[0] = most upstream (marketplace), chain[1] = broker, chain[2] = sub_broker
      marketplaceLink = chain[0] || null;
      brokerLink      = chain[1] || null;
      subBrokerLink   = chain[2] || null;
    }
  }

  const levels = [];

  // Level 0 — Issuer always gets its cut
  levels.push({
    level: 0,
    role: "issuer",
    payee_email: card?.issuer_email || "platform@abos",
    payee_slug: null,
    percentage: WATERFALL.ISSUER_PLATFORM * 100,
    amount: Math.round(pool * WATERFALL.ISSUER_PLATFORM * 100) / 100,
    attribution_reason: "platform_fee",
  });

  // Level 1 — Marketplace (primary) — absorbs unallocated levels
  let mktPct = WATERFALL.MARKETPLACE;
  if (!brokerLink)     mktPct += WATERFALL.BROKER;
  if (!subBrokerLink)  mktPct += WATERFALL.SUB_BROKER;
  if (marketplaceLink) {
    levels.push({
      level: 1,
      role: "marketplace",
      payee_email: marketplaceLink.owner_email,
      payee_slug: marketplaceLink.slug,
      percentage: mktPct * 100,
      amount: Math.round(pool * mktPct * 100) / 100,
      attribution_reason: attribution?.reason || "first_verified_source_locked",
    });
  } else {
    // No link → platform keeps it
    const fallback = levels[0];
    fallback.amount += Math.round(pool * mktPct * 100) / 100;
    fallback.percentage += mktPct * 100;
    fallback.attribution_reason = "no_marketplace_attribution";
  }

  // Level 2 — Broker
  if (brokerLink) {
    let brkPct = WATERFALL.BROKER;
    if (!subBrokerLink) brkPct += WATERFALL.SUB_BROKER;
    levels.push({
      level: 2,
      role: "broker",
      payee_email: brokerLink.owner_email,
      payee_slug: brokerLink.slug,
      percentage: brkPct * 100,
      amount: Math.round(pool * brkPct * 100) / 100,
      attribution_reason: "referral_chain_level_2",
    });
  }

  // Level 3 — Sub-broker
  if (subBrokerLink) {
    levels.push({
      level: 3,
      role: "sub_broker",
      payee_email: subBrokerLink.owner_email,
      payee_slug: subBrokerLink.slug,
      percentage: WATERFALL.SUB_BROKER * 100,
      amount: Math.round(pool * WATERFALL.SUB_BROKER * 100) / 100,
      attribution_reason: "referral_chain_level_3",
    });
  }

  return levels;
}

/**
 * Persist the computed waterfall entries as CommissionLedger records.
 * Idempotent: deletes any existing pending entries for this escrow first.
 */
export async function persistLedger({ card, escrow, levels }) {
  // Remove any existing pending entries for this escrow (re-computation)
  const existing = await base44.entities.CommissionLedger.filter({
    escrow_transaction: escrow.id,
    status: "pending",
  }, "-created_date", 100);
  await Promise.all(existing.map(e => base44.entities.CommissionLedger.delete(e.id)));

  const now = new Date().toISOString();
  const records = levels.map(l => ({
    ati_card: card?.id,
    public_card_code: card?.public_card_code,
    escrow_transaction: escrow.id,
    gross_amount: escrow.sale_amount || 0,
    commission_pool: escrow.finders_fee_amount || 0,
    currency: escrow.currency || "USD",
    level: l.level,
    role: l.role,
    payee_email: l.payee_email,
    payee_slug: l.payee_slug || undefined,
    percentage: l.percentage,
    amount: l.amount,
    status: "allocated",
    attribution_reason: l.attribution_reason,
    calculated_at: now,
  }));

  const created = [];
  for (const r of records) {
    created.push(await base44.entities.CommissionLedger.create(r));
  }
  return created;
}

/**
 * Generate a batch code like STL-2026-04-001
 */
export async function nextBatchCode() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const prefix = `STL-${yyyy}-${mm}-`;
  const existing = await base44.entities.Settlement.filter({}, "-created_date", 200);
  const used = existing
    .map(s => s.batch_code)
    .filter(c => c?.startsWith(prefix))
    .map(c => parseInt(c.slice(prefix.length), 10))
    .filter(n => !isNaN(n));
  const next = used.length ? Math.max(...used) + 1 : 1;
  return `${prefix}${String(next).padStart(3, "0")}`;
}

/**
 * Group allocated commission entries by payee_email, build Settlement batches,
 * and link each ledger entry to its batch (status → "batched").
 */
export async function buildSettlementBatches(ledgerEntries) {
  const byPayee = {};
  for (const e of ledgerEntries) {
    if (!byPayee[e.payee_email]) byPayee[e.payee_email] = [];
    byPayee[e.payee_email].push(e);
  }

  const batches = [];
  for (const [email, entries] of Object.entries(byPayee)) {
    const total = entries.reduce((s, e) => s + (e.amount || 0), 0);
    const code = await nextBatchCode();
    const batch = await base44.entities.Settlement.create({
      batch_code: code,
      payee_email: email,
      payee_role: entries[0].role,
      currency: entries[0].currency || "USD",
      total_amount: Math.round(total * 100) / 100,
      entry_count: entries.length,
      status: "draft",
      period_start: entries[entries.length - 1]?.calculated_at?.slice(0, 10),
      period_end: entries[0]?.calculated_at?.slice(0, 10),
    });
    // Link ledger entries to this batch
    await Promise.all(entries.map(e => base44.entities.CommissionLedger.update(e.id, {
      settlement: batch.id,
      status: "batched",
    })));
    batches.push(batch);
  }
  return batches;
}

/**
 * Mark a settlement as paid → cascade status to all its ledger entries.
 */
export async function markSettlementPaid(batch, { paymentMethod, paymentReference, adminEmail }) {
  const now = new Date().toISOString();
  await base44.entities.Settlement.update(batch.id, {
    status: "paid",
    payment_method: paymentMethod,
    payment_reference: paymentReference,
    paid_at: now,
    paid_by: adminEmail,
  });
  const entries = await base44.entities.CommissionLedger.filter({ settlement: batch.id }, "-created_date", 500);
  await Promise.all(entries.map(e => base44.entities.CommissionLedger.update(e.id, {
    status: "paid",
    paid_at: now,
  })));
  return entries.length;
}