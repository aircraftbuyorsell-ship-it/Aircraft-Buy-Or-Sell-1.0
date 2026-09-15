import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { webcrypto } from '../_shared/webcrypto.mjs';
import {
  classifyPost,
  isOwnActivity,
  shouldAutoComment,
} from '../_shared/facebookGroupLinker.mjs';

// ─────────────────────────────────────────────────────────────────────────
// ABOS Facebook Group auto-link webhook.
//
// Turns organic "for sale N7692J" / listing posts in the ABOS Facebook Group
// into a helpful ABOS link. Never scrapes Facebook; only reacts to Meta's own
// webhook deliveries (feed/comment change notifications) plus a manual
// admin-triggered path used by the in-app "FB Group Assistant" search tool.
//
// Required env vars:
//   META_VERIFY_TOKEN            - shared secret for GET webhook verification
//   META_APP_SECRET              - app secret used to verify X-Hub-Signature-256
//   META_PAGE_ID / META_APP_SCOPED_ID - identifies ABOS's own activity (loop protection)
//   ABOS_PUBLIC_URL              - origin used to build absolute ABOS links (defaults below)
//   FB_AUTO_COMMENT_ENABLED      - "true" to allow posting real comments (default: false)
//   FB_AUTO_COMMENT_MIN_CONFIDENCE - 0..1 threshold for auto-commenting (default: 0.9)
//
// Required Meta permissions for the auto-comment path (not yet granted at
// time of writing — see PR description): groups_access_member_info and
// publish_to_groups via an App Review-approved app installed by a group
// admin, subscribed to the group's `feed` webhook field. Until that is
// granted, every event is still parsed/scored/logged; FB_AUTO_COMMENT_ENABLED
// stays false and status is reported as MATCHED (not COMMENTED) so nothing is
// ever faked.
// ─────────────────────────────────────────────────────────────────────────

function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const aBytes = enc.encode(a);
  const bBytes = enc.encode(b);
  if (aBytes.length !== bBytes.length) return false;
  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) diff |= aBytes[i] ^ bBytes[i];
  return diff === 0;
}

async function verifyMetaSignature(rawBody: string, signatureHeader: string | null, appSecret: string): Promise<boolean> {
  if (!signatureHeader || !appSecret) return false;
  const [scheme, hexDigest] = signatureHeader.split('=');
  if (scheme !== 'sha256' || !hexDigest) return false;
  const key = await webcrypto.subtle.importKey(
    'raw', new TextEncoder().encode(appSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const sigBuffer = await webcrypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
  const computedHex = Array.from(new Uint8Array(sigBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
  return timingSafeEqual(computedHex, hexDigest);
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);

    // Meta's one-time webhook subscription handshake.
    if (req.method === 'GET') {
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');
      const verifyToken = Deno.env.get('META_VERIFY_TOKEN') || '';
      if (mode === 'subscribe' && verifyToken && token && timingSafeEqual(token, verifyToken)) {
        return new Response(challenge || '', { status: 200, headers: { 'Content-Type': 'text/plain' } });
      }
      return new Response('Forbidden', { status: 403 });
    }

    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

    const rawBody = await req.text();
    const signatureHeader = req.headers.get('x-hub-signature-256');
    const isMetaDelivery = !!signatureHeader;

    if (isMetaDelivery) {
      const appSecret = Deno.env.get('META_APP_SECRET') || '';
      const valid = await verifyMetaSignature(rawBody, signatureHeader, appSecret);
      if (!valid) return Response.json({ error: 'invalid signature' }, { status: 401 });
    }

    const body = JSON.parse(rawBody || '{}');
    const base44 = createClientFromRequest(req);
    const originForLinks = (Deno.env.get('ABOS_PUBLIC_URL') || '').replace(/\/$/, '');
    const pageId = Deno.env.get('META_PAGE_ID') || '';
    const appScopedUserId = Deno.env.get('META_APP_SCOPED_ID') || '';
    const autoCommentEnabled = (Deno.env.get('FB_AUTO_COMMENT_ENABLED') || 'false').toLowerCase() === 'true';
    const minConfidence = Number(Deno.env.get('FB_AUTO_COMMENT_MIN_CONFIDENCE') || '0.9');

    // ── Manual/admin path used by the FB Group Assistant search-bar UI ──
    // Lets an admin paste a post's text and get back the same classification
    // (registration/listing, confidence, ABOS link, suggested comment) that
    // the live webhook would produce, without requiring Meta's Groups API
    // permissions to already be granted.
    if (!isMetaDelivery && body.action) {
      const user = await base44.auth.me().catch(() => null);
      const isAdmin = ['admin', 'super_admin'].includes(user?.role);
      if (!isAdmin) return Response.json({ error: user ? 'Forbidden' : 'Unauthorized' }, { status: user ? 403 : 401 });

      if (body.action === 'preview') {
        const classification = classifyPost(String(body.text || ''), { baseUrl: originForLinks });
        return Response.json(classification);
      }

      if (body.action === 'logManual') {
        const classification = classifyPost(String(body.text || ''), { baseUrl: originForLinks });
        const postId = String(body.facebookPostId || `manual-${Date.now()}`);
        const existing = await base44.asServiceRole.entities.FacebookGroupEvent.filter(
          { facebook_post_id: postId }, '-created_date', 1,
        );
        if (existing.length) return Response.json({ skipped: true, reason: 'already logged', event: existing[0] });
        const event = await base44.asServiceRole.entities.FacebookGroupEvent.create({
          facebook_post_id: postId,
          facebook_group_id: body.facebookGroupId || '',
          source_text: String(body.text || '').slice(0, 5000),
          registration: classification.registration || undefined,
          aircraft_match: classification.listing || undefined,
          destination_url: classification.destination_url || undefined,
          confidence: classification.confidence,
          comment_text: classification.comment || undefined,
          status: classification.status,
          reason: classification.reason || undefined,
          processed_at: new Date().toISOString(),
        });
        return Response.json({ success: true, event });
      }

      if (body.action === 'listRecent') {
        const events = await base44.asServiceRole.entities.FacebookGroupEvent.filter({}, '-created_date', 25);
        return Response.json({ events });
      }

      return Response.json({ error: 'Unsupported action' }, { status: 400 });
    }

    // ── Real Meta webhook delivery ──
    if (!isMetaDelivery) return Response.json({ error: 'Missing signature' }, { status: 401 });

    const entries = Array.isArray(body.entry) ? body.entry : [];
    const results = [];

    for (const entry of entries) {
      const changes = Array.isArray(entry.changes) ? entry.changes : [];
      for (const change of changes) {
        const value = change.value || {};
        const postId = String(value.comment_id || value.post_id || value.item_id || '');
        if (!postId) continue;

        if (isOwnActivity(value, { pageId, appScopedUserId })) {
          results.push({ facebook_post_id: postId, status: 'SKIPPED', reason: 'own activity (loop protection)' });
          continue;
        }

        const existing = await base44.asServiceRole.entities.FacebookGroupEvent.filter(
          { facebook_post_id: postId }, '-created_date', 1,
        );
        if (existing.length) {
          results.push({ facebook_post_id: postId, status: 'SKIPPED', reason: 'duplicate event' });
          continue;
        }

        const text = String(value.message || value.description || '');
        const classification = classifyPost(text, { baseUrl: originForLinks });
        let status = classification.status;
        let commentId = '';
        let reason = classification.reason;

        if (shouldAutoComment(classification, { enabled: autoCommentEnabled, minConfidence })) {
          try {
            const { accessToken } = await base44.asServiceRole.connectors.getConnection('facebook_pages');
            const commentRes = await fetch(`https://graph.facebook.com/v25.0/${postId}/comments`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ message: classification.comment }),
            });
            const published = await commentRes.json();
            if (!commentRes.ok || !published.id) throw new Error(published?.error?.message || 'comment failed');
            status = 'COMMENTED';
            commentId = published.id;
          } catch (error) {
            status = 'ERROR';
            reason = `auto-comment failed: ${error?.message || error}`;
          }
        }

        const event = await base44.asServiceRole.entities.FacebookGroupEvent.create({
          facebook_post_id: postId,
          facebook_group_id: entry.id || value.group_id || '',
          facebook_page_id: pageId || undefined,
          source_text: text.slice(0, 5000),
          registration: classification.registration || undefined,
          aircraft_match: classification.listing || undefined,
          destination_url: classification.destination_url || undefined,
          confidence: classification.confidence,
          comment_text: classification.comment || undefined,
          comment_id: commentId || undefined,
          status,
          reason: reason || undefined,
          processed_at: new Date().toISOString(),
        });
        results.push(event);
      }
    }

    return Response.json({ received: entries.length, processed: results.length, results });
  } catch (error) {
    console.error('facebookGroupWebhook failed', error?.message || error);
    return Response.json({ error: 'Unable to process Facebook webhook event' }, { status: 500 });
  }
});
