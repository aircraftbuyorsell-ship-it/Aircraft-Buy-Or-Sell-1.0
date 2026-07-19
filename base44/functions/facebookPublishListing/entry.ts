import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const FB_API = "https://graph.facebook.com/v25.0";
const APP_USER_CONNECTOR_ID = "6a5c242aee39d843261a3df8";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { action, mode = "shared", pageId, listingId, message, link } = body;

    // Resolve OAuth access token based on connection mode
    let userAccessToken;
    if (mode === "app_user") {
      const conn = await base44.asServiceRole.connectors.getCurrentAppUserConnection(APP_USER_CONNECTOR_ID);
      userAccessToken = conn.accessToken;
    } else {
      const conn = await base44.asServiceRole.connectors.getConnection("facebook_pages");
      userAccessToken = conn.accessToken;
    }

    // List managed Pages
    if (action === "list_pages") {
      const r = await fetch(`${FB_API}/me/accounts?fields=id,name,access_token,category,picture{url}&access_token=${userAccessToken}`);
      const data = await r.json();
      if (data.error) return Response.json({ error: data.error.message }, { status: 400 });
      return Response.json({ pages: data.data || [] });
    }

    // List recent posts on a Page (also serves as connection check)
    if (action === "list_posts") {
      if (!pageId) return Response.json({ error: "pageId required" }, { status: 400 });
      const page = await resolvePage(userAccessToken, pageId);
      const r = await fetch(`${FB_API}/${pageId}/posts?fields=id,message,created_time,permalink_url&limit=10&access_token=${page.pageAccessToken}`);
      const data = await r.json();
      if (data.error) return Response.json({ error: data.error.message }, { status: 400 });
      return Response.json({ posts: data.data || [] });
    }

    // Publish a listing (and/or custom message) to a Page feed
    if (action === "publish") {
      if (!pageId) return Response.json({ error: "pageId required" }, { status: 400 });
      const page = await resolvePage(userAccessToken, pageId);

      let finalMessage = message || "";
      let finalLink = link || "";

      if (listingId) {
        const listing = await base44.asServiceRole.entities.AircraftListing.get(listingId);
        finalMessage = buildListingPost(listing, finalMessage);
        finalLink = finalLink || listing.source_url || "";
      }

      if (!finalMessage) return Response.json({ error: "Nothing to publish" }, { status: 400 });

      const params = new URLSearchParams();
      params.append("message", finalMessage);
      if (finalLink) params.append("link", finalLink);
      params.append("access_token", page.pageAccessToken);

      const r = await fetch(`${FB_API}/${pageId}/feed`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });
      const data = await r.json();
      if (data.error) return Response.json({ error: data.error.message }, { status: 400 });
      return Response.json({ postId: data.id, success: true });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function resolvePage(userAccessToken, pageId) {
  const r = await fetch(`${FB_API}/me/accounts?fields=id,name,access_token&access_token=${userAccessToken}`);
  const data = await r.json();
  if (data.error) throw new Error(data.error.message);
  const page = (data.data || []).find((p) => p.id === pageId);
  if (!page) throw new Error("Page not found or not managed by this account");
  return { pageId: page.id, pageAccessToken: page.access_token, pageName: page.name };
}

function buildListingPost(l, customNote) {
  const parts = [];
  const title = [l.year, l.make, l.model].filter(Boolean).join(" ");
  parts.push(`✈️ ${title}`);
  if (l.registration) parts.push(`Registration: ${l.registration}`);
  if (l.asking_price != null) parts.push(`Price: ${l.currency || "USD"} ${Number(l.asking_price).toLocaleString()}`);
  if (l.total_time != null) parts.push(`Total Time: ${l.total_time} hrs`);
  if (l.engine_hours != null) parts.push(`Engine SMOH: ${l.engine_hours} hrs`);
  if (l.avionics) parts.push(`Avionics: ${l.avionics}`);
  if (l.ai_summary) parts.push(`\n${l.ai_summary}`);
  if (customNote) parts.push(`\n${customNote}`);
  parts.push(`\nView on ABOS Marketspace`);
  return parts.join("\n");
}