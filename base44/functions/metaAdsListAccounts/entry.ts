import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['admin', 'super_admin'].includes(user.role)) return Response.json({ error: 'Forbidden' }, { status: 403 });
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('meta_ads');
    const response = await fetch('https://graph.facebook.com/v25.0/me/adaccounts?fields=account_id,name,currency,account_status', { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!response.ok) throw new Error('Meta Ads connection expired');
    return Response.json({ accounts: (await response.json()).data || [] });
  } catch (error) {
    console.error('Meta account listing failed', error?.message || error);
    return Response.json({ error: 'Unable to load Meta ad accounts. The connection may need renewal.' }, { status: 500 });
  }
});