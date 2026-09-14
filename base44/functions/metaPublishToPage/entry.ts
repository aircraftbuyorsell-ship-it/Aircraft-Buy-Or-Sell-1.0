import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const validHttps = (value) => /^https:\/\//.test(String(value || '')) ? String(value) : '';
const money = (value, currency = 'USD') => value
  ? new Intl.NumberFormat('en', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value)
  : 'Price on request';

const buildTemplate = (listing, market, templateKey) => {
  const identity = [listing.year, listing.make, listing.model].filter(Boolean).join(' ');
  const registration = listing.registration ? ` · ${listing.registration}` : '';
  const price = money(listing.asking_price, listing.currency || 'USD');
  const omvm = listing.omvm_value ? money(listing.omvm_value, listing.currency || 'USD') : null;
  const trust = listing.ati_score != null ? `${listing.ati_score}/120` : null;
  const snapshot = `${market.active} active aircraft · median asking ${money(market.medianPrice)}`;
  const description = String(listing.description || '').trim();
  const templates = {
    market_snapshot: `${identity}${registration}\n\nNow available for ${price}.${omvm ? ` OMVM estimate: ${omvm}.` : ''}${trust ? ` ATI trust score: ${trust}.` : ''}\n\nMarket snapshot: ${snapshot}.${description ? `\n\n${description}` : ''}\n\n#AircraftForSale #Aviation #ABOS`,
    trust_first: `Verified aircraft opportunity · ${identity}${registration}\n\n${trust ? `ATI trust score ${trust}. ` : ''}${omvm ? `Independent OMVM estimate ${omvm}. ` : ''}Offered at ${price}.\n\nCurrent ABOS market: ${snapshot}.${description ? `\n\n${description}` : ''}\n\n#VerifiedAircraft #AircraftForSale #ABOS`,
    deal_highlight: `${listing.deal_label ? `${String(listing.deal_label).toUpperCase()} · ` : ''}${identity}${registration}\n\nAsking ${price}${listing.discount_pct ? ` · ${Math.abs(listing.discount_pct)}% below OMVM` : ''}.${omvm ? ` Estimated market value ${omvm}.` : ''}\n\nLive market context: ${snapshot}.${description ? `\n\n${description}` : ''}\n\n#AviationDeals #AircraftForSale #ABOS`,
  };
  return templates[templateKey] || templates.market_snapshot;
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    const body = await req.json().catch(() => ({}));
    const event = body.workflow_event || {};
    const isListingWorkflow = event.entity_name === 'AircraftListing'
      && ['create', 'update'].includes(event.event_type)
      && String(event.entity_id || '') === String(body.listingId || '');
    const isAdmin = ['admin', 'super_admin'].includes(user?.role);
    if (!isAdmin && !isListingWorkflow) {
      return Response.json({ error: user ? 'Forbidden' : 'Unauthorized' }, { status: user ? 403 : 401 });
    }

    if (body.action === 'listTemplates') {
      return Response.json({ templates: [
        { key: 'market_snapshot', name: 'Market Snapshot' },
        { key: 'trust_first', name: 'Trust First' },
        { key: 'deal_highlight', name: 'Deal Highlight' },
      ] });
    }

    if (body.action === 'publishListing' || body.action === 'previewListing') {
      const listing = await base44.asServiceRole.entities.AircraftListing.get(String(body.listingId || ''));
      if (!listing) return Response.json({ skipped: true, reason: 'listing not found' });
      if (listing.status !== 'active' || (listing.visibility && listing.visibility !== 'public')) {
        return Response.json({ skipped: true, reason: 'listing is not active and public' });
      }
      const existing = await base44.asServiceRole.entities.MarketingPost.filter({
        channel: 'facebook', source_type: 'AircraftListing', source_id: listing.id,
      }, '-published_at', 1);
      if (existing.length && body.action === 'publishListing') {
        return Response.json({ skipped: true, reason: 'listing already published', post_id: existing[0].post_id });
      }
      const activeListings = await base44.asServiceRole.entities.AircraftListing.filter({ status: 'active' }, '-created_date', 500);
      const prices = activeListings.map((item) => Number(item.asking_price)).filter((value) => value > 0).sort((a, b) => a - b);
      const medianPrice = prices.length
        ? prices.length % 2 ? prices[Math.floor(prices.length / 2)] : Math.round((prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2)
        : null;
      const configs = await base44.asServiceRole.entities.SocialPublishConfig.filter({ key: 'facebook_listing_sync' }, '-created_date', 1);
      const config = configs[0] || null;
      const templateKey = body.templateKey || config?.template_key || 'market_snapshot';
      const copy = buildTemplate(listing, { active: activeListings.length, medianPrice }, templateKey);
      if (body.action === 'previewListing') {
        return Response.json({ copy, template_key: templateKey, image_url: listing.photo_url || null });
      }
      const imageUrl = validHttps(listing.photo_url);
      if (!imageUrl) return Response.json({ skipped: true, reason: 'listing photo is required' });
      if (config && !config.enabled) return Response.json({ skipped: true, reason: 'Facebook listing sync is disabled' });

      const { accessToken } = await base44.asServiceRole.connectors.getConnection('facebook_pages');
      const pagesRes = await fetch(
        'https://graph.facebook.com/v25.0/me/accounts?fields=id,name,access_token',
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      if (!pagesRes.ok) throw new Error('Facebook connection expired');
      const pages = (await pagesRes.json()).data || [];
      let page = config ? pages.find((item) => item.id === config.destination_id) : null;
      if (!page && pages.length === 1) page = pages[0];
      if (!page) return Response.json({ skipped: true, reason: pages.length ? 'select a Facebook Page in Social Publisher first' : 'no managed Facebook Page available' });

      const linkUrl = validHttps(listing.source_url);
      const caption = linkUrl ? `${copy}\n\n${linkUrl}` : copy;
      const publishRes = await fetch(`https://graph.facebook.com/v25.0/${page.id}/photos`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${page.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: imageUrl, caption }),
      });
      const published = await publishRes.json();
      if (!publishRes.ok || !published.id) throw new Error('Facebook publishing failed');
      const post = await base44.asServiceRole.entities.MarketingPost.create({
        channel: 'facebook', page_id: page.id, page_name: page.name,
        source_type: 'AircraftListing', source_id: listing.id,
        post_id: published.post_id || published.id, copy, link_url: linkUrl,
        published_at: new Date().toISOString(), status: 'published',
      });
      if (!config && pages.length === 1) {
        await base44.asServiceRole.entities.SocialPublishConfig.create({
          key: 'facebook_listing_sync', channel: 'facebook', destination_id: page.id,
          destination_name: page.name, template_key: templateKey, enabled: true,
        });
      }
      return Response.json({ success: true, post });
    }

    const [facebookConnection, instagramConnection] = await Promise.all([
      base44.asServiceRole.connectors.getConnection('facebook_pages'),
      base44.asServiceRole.connectors.getConnection('instagram'),
    ]);
    const pagesRes = await fetch(
      'https://graph.facebook.com/v25.0/me/accounts?fields=id,name,access_token',
      { headers: { Authorization: `Bearer ${facebookConnection.accessToken}` } },
    );
    const instagramMeRes = await fetch(
      `https://graph.instagram.com/me?fields=id,username&access_token=${encodeURIComponent(instagramConnection.accessToken)}`,
    );
    if (!pagesRes.ok || !instagramMeRes.ok) throw new Error('Social connection expired');
    const pages = (await pagesRes.json()).data || [];
    const instagramMe = await instagramMeRes.json();
    const destinations = [
      ...pages.map(({ id, name }) => ({ key: `facebook:${id}`, channel: 'facebook', id, name })),
      ...(instagramMe.id ? [{ key: `instagram:${instagramMe.id}`, channel: 'instagram', id: instagramMe.id, name: `@${instagramMe.username || 'Instagram Business'}` }] : []),
    ];
    if (['listPages', 'listDestinations'].includes(body.action) || !body.action) {
      return Response.json({ pages: destinations.filter((item) => item.channel === 'facebook'), destinations });
    }
    if (body.action !== 'publish') return Response.json({ error: 'Unsupported action' }, { status: 400 });

    const copy = String(body.copy || '').trim().slice(0, 5000);
    const channel = body.channel === 'instagram' ? 'instagram' : 'facebook';
    const destination = destinations.find((item) => item.channel === channel && item.id === String(body.destinationId || body.pageId || ''));
    const imageUrl = validHttps(body.imageUrl);
    const linkUrl = validHttps(body.linkUrl);
    if (!destination || !copy) return Response.json({ error: 'Destination and post copy are required' }, { status: 400 });
    let postId = '';
    if (channel === 'instagram') {
      if (!imageUrl) return Response.json({ error: 'Instagram requires a public listing photo' }, { status: 400 });
      const createParams = new URLSearchParams({ image_url: imageUrl, caption: linkUrl ? `${copy}\n\n${linkUrl}` : copy, access_token: instagramConnection.accessToken });
      const containerRes = await fetch(`https://graph.instagram.com/v25.0/${destination.id}/media`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: createParams });
      const container = await containerRes.json();
      if (!containerRes.ok || !container.id) throw new Error('Instagram media creation failed');
      const publishParams = new URLSearchParams({ creation_id: container.id, access_token: instagramConnection.accessToken });
      const publishRes = await fetch(`https://graph.instagram.com/v25.0/${destination.id}/media_publish`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: publishParams });
      const published = await publishRes.json();
      if (!publishRes.ok || !published.id) throw new Error('Instagram publishing failed');
      postId = published.id;
    } else {
      const page = pages.find((item) => item.id === destination.id);
      const endpoint = imageUrl ? `${page.id}/photos` : `${page.id}/feed`;
      const payload = imageUrl ? { url: imageUrl, caption: linkUrl ? `${copy}\n\n${linkUrl}` : copy } : { message: copy, ...(linkUrl ? { link: linkUrl } : {}) };
      const publishRes = await fetch(`https://graph.facebook.com/v25.0/${endpoint}`, { method: 'POST', headers: { Authorization: `Bearer ${page.access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const published = await publishRes.json();
      if (!publishRes.ok || !published.id) throw new Error('Facebook publishing failed');
      postId = published.post_id || published.id;
      const configs = await base44.asServiceRole.entities.SocialPublishConfig.filter({ key: 'facebook_listing_sync' }, '-created_date', 1);
      const configData = { destination_id: page.id, destination_name: page.name, template_key: body.templateKey || 'market_snapshot', enabled: true };
      if (configs[0]) await base44.asServiceRole.entities.SocialPublishConfig.update(configs[0].id, configData);
      else await base44.asServiceRole.entities.SocialPublishConfig.create({ key: 'facebook_listing_sync', channel: 'facebook', ...configData });
    }
    const record = await base44.asServiceRole.entities.MarketingPost.create({
      channel, page_id: destination.id, page_name: destination.name,
      source_type: body.sourceType || 'AircraftListing', source_id: body.sourceId || '',
      post_id: postId, copy, link_url: linkUrl,
      published_at: new Date().toISOString(), status: 'published',
    });
    return Response.json({ success: true, post: record });
  } catch (error) {
    console.error('Social publishing failed', error?.message || error);
    return Response.json({ error: 'Unable to publish. A social connection may need renewal.' }, { status: 500 });
  }
});