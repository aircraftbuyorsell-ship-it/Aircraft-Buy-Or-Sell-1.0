import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const validHttps = (value) => /^https:\/\//.test(String(value || '')) ? String(value) : '';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['admin', 'super_admin'].includes(user.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
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
      ...pages.map(({ id, name }) => ({
        key: `facebook:${id}`,
        channel: 'facebook',
        id,
        name,
      })),
      ...(instagramMe.id ? [{
        key: `instagram:${instagramMe.id}`,
        channel: 'instagram',
        id: instagramMe.id,
        name: `@${instagramMe.username || 'Instagram Business'}`,
      }] : []),
    ];

    if (['listPages', 'listDestinations'].includes(body.action) || !body.action) {
      return Response.json({
        pages: destinations.filter((item) => item.channel === 'facebook'),
        destinations,
      });
    }
    if (body.action !== 'publish') {
      return Response.json({ error: 'Unsupported action' }, { status: 400 });
    }

    const copy = String(body.copy || '').trim().slice(0, 5000);
    const channel = body.channel === 'instagram' ? 'instagram' : 'facebook';
    const destinationId = String(body.destinationId || body.pageId || '');
    const destination = destinations.find(
      (item) => item.channel === channel && item.id === destinationId,
    );
    const imageUrl = validHttps(body.imageUrl);
    const linkUrl = validHttps(body.linkUrl);
    if (!destination || !copy) {
      return Response.json({ error: 'Destination and post copy are required' }, { status: 400 });
    }

    let postId = '';
    if (channel === 'instagram') {
      if (!imageUrl) {
        return Response.json({ error: 'Instagram requires a public listing photo' }, { status: 400 });
      }
      const caption = linkUrl ? `${copy}\n\n${linkUrl}` : copy;
      const createParams = new URLSearchParams({
        image_url: imageUrl,
        caption,
        access_token: instagramConnection.accessToken,
      });
      const containerRes = await fetch(
        `https://graph.instagram.com/v25.0/${destination.id}/media`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: createParams,
        },
      );
      const container = await containerRes.json();
      if (!containerRes.ok || !container.id) throw new Error('Instagram media creation failed');

      const publishParams = new URLSearchParams({
        creation_id: container.id,
        access_token: instagramConnection.accessToken,
      });
      const publishRes = await fetch(
        `https://graph.instagram.com/v25.0/${destination.id}/media_publish`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: publishParams,
        },
      );
      const published = await publishRes.json();
      if (!publishRes.ok || !published.id) throw new Error('Instagram publishing failed');
      postId = published.id;
    } else {
      const page = pages.find((item) => item.id === destination.id);
      const endpoint = imageUrl ? `${page.id}/photos` : `${page.id}/feed`;
      const payload = imageUrl
        ? { url: imageUrl, caption: linkUrl ? `${copy}\n\n${linkUrl}` : copy }
        : { message: copy, ...(linkUrl ? { link: linkUrl } : {}) };
      const publishRes = await fetch(
        `https://graph.facebook.com/v25.0/${endpoint}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${page.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
      );
      const published = await publishRes.json();
      if (!publishRes.ok || !published.id) throw new Error('Facebook publishing failed');
      postId = published.post_id || published.id;
    }

    const record = await base44.asServiceRole.entities.MarketingPost.create({
      channel,
      page_id: destination.id,
      page_name: destination.name,
      source_type: body.sourceType || 'AircraftListing',
      source_id: body.sourceId || '',
      post_id: postId,
      copy,
      link_url: linkUrl,
      published_at: new Date().toISOString(),
      status: 'published',
    });
    return Response.json({ success: true, post: record });
  } catch (error) {
    console.error('Social publishing failed', error?.message || error);
    return Response.json(
      { error: 'Unable to publish. A social connection may need renewal.' },
      { status: 500 },
    );
  }
});