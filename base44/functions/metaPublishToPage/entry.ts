import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['admin', 'super_admin'].includes(user.role)) return Response.json({ error: 'Forbidden' }, { status: 403 });
    const body = await req.json().catch(() => ({}));
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('facebook_pages');
    const accountsRes = await fetch('https://graph.facebook.com/v25.0/me/accounts?fields=id,name,access_token', { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!accountsRes.ok) throw new Error('Facebook Pages connection expired');
    const pages = (await accountsRes.json()).data || [];
    if (body.action === 'listPages' || !body.action) return Response.json({ pages: pages.map(({ id, name }) => ({ id, name })) });
    if (body.action !== 'publish') return Response.json({ error: 'Unsupported action' }, { status: 400 });
    const page = pages.find((item) => item.id === String(body.pageId || ''));
    const copy = String(body.copy || '').trim().slice(0, 5000);
    if (!page || !copy) return Response.json({ error: 'Page and post copy are required' }, { status: 400 });
    const linkUrl = /^https:\/\//.test(body.linkUrl || '') ? body.linkUrl : '';
    const imageUrl = /^https:\/\//.test(body.imageUrl || '') ? body.imageUrl : '';
    const endpoint = imageUrl ? `${page.id}/photos` : `${page.id}/feed`;
    const payload = imageUrl ? { url: imageUrl, caption: linkUrl ? `${copy}\n\n${linkUrl}` : copy } : { message: copy, ...(linkUrl ? { link: linkUrl } : {}) };
    const publishRes = await fetch(`https://graph.facebook.com/v25.0/${endpoint}`, { method: 'POST', headers: { Authorization: `Bearer ${page.access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const published = await publishRes.json();
    if (!publishRes.ok || !published.id) throw new Error('Facebook rejected the post');
    const record = await base44.asServiceRole.entities.MarketingPost.create({ page_id: page.id, page_name: page.name, source_type: body.sourceType || 'custom', source_id: body.sourceId || '', post_id: published.post_id || published.id, copy, link_url: linkUrl, published_at: new Date().toISOString(), status: 'published' });
    return Response.json({ success: true, post: record });
  } catch (error) {
    console.error('Meta publishing failed', error?.message || error);
    return Response.json({ error: 'Unable to publish. Reconnect Facebook Pages if the session expired.' }, { status: 500 });
  }
});