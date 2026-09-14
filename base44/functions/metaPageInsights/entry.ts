import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['admin', 'super_admin'].includes(user.role)) return Response.json({ error: 'Forbidden' }, { status: 403 });
    const { pageId } = await req.json().catch(() => ({}));
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('facebook_pages');
    const accountsRes = await fetch('https://graph.facebook.com/v25.0/me/accounts?fields=id,name,access_token', { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!accountsRes.ok) throw new Error('Facebook Pages connection expired');
    const pages = (await accountsRes.json()).data || [];
    if (!pageId) return Response.json({ pages: pages.map(({ id, name }) => ({ id, name })) });
    const page = pages.find((item) => item.id === String(pageId));
    if (!page) return Response.json({ error: 'Page not available' }, { status: 404 });
    const headers = { Authorization: `Bearer ${page.access_token}` };
    const [profileRes, postsRes] = await Promise.all([
      fetch(`https://graph.facebook.com/v25.0/${page.id}?fields=id,name,followers_count,fan_count`, { headers }),
      fetch(`https://graph.facebook.com/v25.0/${page.id}/posts?fields=id,message,created_time,permalink_url,shares,reactions.limit(0).summary(true)&limit=10`, { headers }),
    ]);
    if (!profileRes.ok || !postsRes.ok) throw new Error('Facebook insight request failed');
    const profile = await profileRes.json();
    const posts = (await postsRes.json()).data || [];
    const normalized = posts.map((post) => ({ id: post.id, message: post.message || 'Page post', created_time: post.created_time, permalink_url: post.permalink_url, reactions: post.reactions?.summary?.total_count || 0, shares: post.shares?.count || 0 }));
    return Response.json({ page: { id: profile.id, name: profile.name, followers: profile.followers_count || profile.fan_count || 0 }, posts: normalized, engagement: normalized.reduce((sum, post) => sum + post.reactions + post.shares, 0) });
  } catch (error) {
    console.error('Facebook insights failed', error?.message || error);
    return Response.json({ error: 'Unable to load Facebook Page insights. The connection may need renewal.' }, { status: 500 });
  }
});