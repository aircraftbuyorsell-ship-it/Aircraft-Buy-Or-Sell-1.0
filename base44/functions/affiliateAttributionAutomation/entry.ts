import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });

    const { entity_name, entity_id, event_type, old_status } = await req.json().catch(() => ({}));
    if (!entity_name || !entity_id) return Response.json({ error: 'entity_name and entity_id required' }, { status: 400 });

    let record = null;
    let sourceLead = null;
    let attributionEvent = '';

    if (entity_name === 'Lead') {
      record = await base44.asServiceRole.entities.Lead.get(entity_id).catch(() => null);
      if (!record) return Response.json({ skipped: true, reason: 'lead_not_found' });
      attributionEvent = event_type === 'update' && record.status === 'closed' && old_status !== 'closed' ? 'deal_closed' : 'lead_created';
      sourceLead = record;
    } else if (entity_name === 'SalesPipeline') {
      record = await base44.asServiceRole.entities.SalesPipeline.get(entity_id).catch(() => null);
      if (!record || record.status !== 'completed' || old_status === 'completed') {
        return Response.json({ skipped: true, reason: 'pipeline_not_newly_completed' });
      }
      if (!record.buyer_email) return Response.json({ skipped: true, reason: 'pipeline_has_no_buyer_email' });
      const leads = await base44.asServiceRole.entities.Lead.filter({ email: record.buyer_email }, 'created_date', 100);
      sourceLead = leads.find((lead) => lead.affiliate_link_slug && record.listing_id && lead.listing === record.listing_id)
        || leads.find((lead) => lead.affiliate_link_slug)
        || null;
      attributionEvent = 'deal_closed';
    } else {
      return Response.json({ error: 'Unsupported entity_name' }, { status: 400 });
    }

    const slug = sourceLead?.affiliate_link_slug;
    if (!slug) return Response.json({ skipped: true, reason: 'no_affiliate_attribution' });

    const links = await base44.asServiceRole.entities.AffiliateLink.filter({ slug }, '-created_date', 1);
    const link = links[0];
    if (!link || !link.is_active) return Response.json({ skipped: true, reason: 'affiliate_link_inactive_or_missing' });

    const attributionKey = attributionEvent === 'deal_closed'
      ? `deal:${sourceLead.id}`
      : `lead:${sourceLead.id}`;
    const existing = await base44.asServiceRole.entities.LeadEvent.filter({ attribution_key: attributionKey }, '-created_date', 1);
    if (existing[0]) return Response.json({ skipped: true, reason: 'already_attributed', event_id: existing[0].id });

    const chainSlugs = Array.isArray(sourceLead.affiliate_chain_slugs) && sourceLead.affiliate_chain_slugs.length
      ? sourceLead.affiliate_chain_slugs.slice(0, 3)
      : [slug];

    const created = await base44.asServiceRole.entities.LeadEvent.create({
      event_type: attributionEvent,
      affiliate_link: link.id,
      affiliate_link_slug: slug,
      chain_slugs: chainSlugs,
      actor_email: sourceLead.email || record.buyer_email || null,
      is_verified: true,
      source_entity_type: entity_name,
      source_entity_id: entity_id,
      attribution_key: attributionKey,
      metadata: {
        lead_id: sourceLead.id,
        pipeline_id: entity_name === 'SalesPipeline' ? entity_id : null,
        listing_id: sourceLead.listing || record.listing_id || null,
        sale_amount: record.sale_amount || null,
        automated: true,
      },
    });

    const trackedType = attributionEvent === 'deal_closed' ? 'conversion' : 'lead';
    const tracking = await base44.functions.invoke('affiliateTrack', {
      event_type: trackedType,
      slug,
      chain_slugs: chainSlugs,
      metadata: { source_entity_type: entity_name, source_entity_id: entity_id, lead_event_id: created.id },
    });

    return Response.json({ ok: true, event_id: created.id, attribution: trackedType, slug, tracked: tracking?.data?.tracked === true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});