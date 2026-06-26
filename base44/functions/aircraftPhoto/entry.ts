import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Fetches an aircraft photo linked to a tail number.
 *
 * Sources (in order):
 *   1. planespotters.net pub API — real photo matched by registration marking
 *   2. adsbdb.com API — real photo (also sourced from planespotters etc.)
 *   3. Hugging Face GenerateImage — AI-generated representative photo by make/model
 *
 * Input: { registration, make, model }
 * Returns: { photo_url, thumbnail_url, source, photographer, photo_link }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { registration, make, model } = await req.json().catch(() => ({}));
    const result = { photo_url: null, thumbnail_url: null, source: null, photographer: null, photo_link: null };

    // Use the registration as-is (caller normalizes prefix/dashes).
    // For US N-numbers the caller may pass "N12345" or "12345" — normalize to "N12345".
    let fullReg = (registration || '').trim().toUpperCase();
    if (fullReg && /^N[A-Z0-9]/.test(fullReg) === false && /^[A-Z0-9]{1,5}$/.test(fullReg)) {
      // Bare FAA n-number without N prefix
      fullReg = 'N' + fullReg;
    }

    // ── SOURCE 1: planespotters.net pub API — match by registration marking ──
    if (fullReg) {
      try {
        const psRes = await fetch(`https://api.planespotters.net/pub/photos/reg/${encodeURIComponent(fullReg)}`, {
          headers: { 'Accept': 'application/json', 'User-Agent': 'ABOS-MarketSpace/1.0 (+https://abos-marketspace.com/contact)' },
          signal: AbortSignal.timeout(4000),
        });
        if (psRes.ok) {
          try {
            const psData = await psRes.json();
            const photo = psData?.photos?.[0];
            if (photo?.thumbnail_large?.src) {
              result.photo_url = photo.thumbnail_large.src;
              result.thumbnail_url = photo.thumbnail?.src || photo.thumbnail_large.src;
              result.source = 'planespotters';
              result.photographer = photo.photographer || null;
              result.photo_link = photo.link || null;
            }
          } catch (_) { /* non-JSON response */ }
        }
      } catch (_) { /* non-critical */ }
    }

    // ── SOURCE 2: adsbdb.com — real photo of this specific aircraft ──
    if (!result.photo_url && fullReg) {
      try {
        const adsbRes = await fetch(`https://api.adsbdb.com/v0/aircraft/${encodeURIComponent(fullReg)}`, {
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

    // ── SOURCE 3: Hugging Face GenerateImage — representative photo by make/model ──
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