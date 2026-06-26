import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Fetches an aircraft photo linked to a tail number.
 *
 * Sources (in order):
 *   1. adsbdb.com API — real photo of the specific aircraft (from planespotters.net etc.)
 *   2. Hugging Face GenerateImage — AI-generated representative photo by make/model
 *
 * Input: { registration, make, model }
 * Returns: { photo_url, thumbnail_url, source }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { registration, make, model } = await req.json().catch(() => ({}));
    const result = { photo_url: null, thumbnail_url: null, source: null };

    // ── SOURCE 1: adsbdb.com — real photo of this specific aircraft ──
    if (registration) {
      try {
        const normalized = registration.replace(/^N/i, '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        const fullReg = `N${normalized}`;
        const adsbRes = await fetch(`https://api.adsbdb.com/v0/aircraft/${fullReg}`, {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(8000),
        });
        if (adsbRes.ok) {
          const adsbData = await adsbRes.json();
          const ac = adsbData?.response?.aircraft;
          if (ac?.url_photo) {
            result.photo_url = ac.url_photo;
            result.thumbnail_url = ac.url_photo_thumbnail || ac.url_photo;
            result.source = 'adsbdb';
          }
        }
      } catch (_) { /* non-critical */ }
    }

    // ── SOURCE 2: Hugging Face GenerateImage — representative photo by make/model ──
    if (!result.photo_url && (make || model)) {
      try {
        const aircraftDesc = [make, model].filter(Boolean).join(' ').trim();
        const prompt = `Professional aviation photograph of a ${aircraftDesc} aircraft on a tarmac, clear blue sky, side profile view, high resolution, photorealistic`;
        let genRes;
        try {
          genRes = await base44.integrations.Core.GenerateImage({ prompt });
        } catch (_) {
          genRes = await base44.asServiceRole.integrations.Core.GenerateImage({ prompt });
        }
        if (genRes?.url) {
          result.photo_url = genRes.url;
          result.thumbnail_url = genRes.url;
          result.source = 'hf_generated';
        }
      } catch (_) { /* non-critical */ }
    }

    if (!result.photo_url) {
      return Response.json({
        ...result,
        error: 'No photo available for this aircraft.',
      }, { status: 404 });
    }

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});