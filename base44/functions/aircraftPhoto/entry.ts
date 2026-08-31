import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * Fetches an aircraft photo linked to a tail number.
 *
 * Sources (in order):
 *   1. planespotters.net pub API — by hex code (Mode S / ICAO 24-bit) if available, then by registration
 *   2. adsbdb.com API — real photo of the specific aircraft
 *
 * Input: { registration, hex }
 * Returns: { photo_url, thumbnail_url, source, photographer, photo_link }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { registration, hex } = await req.json().catch(() => ({}));
    const result = { photo_url: null, thumbnail_url: null, source: null, photographer: null, photo_link: null };

    // Normalize hex: strip 0x prefix, uppercase, alphanumeric only
    const hexCode = (hex || '').trim().replace(/^0x/i, '').replace(/[^a-fA-F0-9]/g, '').toUpperCase();

    // Use the registration as-is (caller normalizes prefix/dashes).
    // For US N-numbers the caller may pass "N12345" or "12345" — normalize to "N12345".
    let fullReg = (registration || '').trim().toUpperCase();
    if (fullReg && /^N[A-Z0-9]/.test(fullReg) === false && /^[A-Z0-9]{1,5}$/.test(fullReg)) {
      // Bare FAA n-number without N prefix
      fullReg = 'N' + fullReg;
    }

    // ── CACHE CHECK: return cached photo instantly if recently fetched ──
    if (fullReg || hexCode) {
      try {
        const filter = fullReg ? { registration: fullReg } : { mode_s_hex: hexCode };
        const cached = await base44.asServiceRole.entities.GlobalRegistry.filter(filter, '-created_date', 1);
        if (cached.length > 0) {
          const c = cached[0];
          const ageMs = Date.now() - new Date(c.last_verified_at || c.updated_date || c.created_date).getTime();
          const PHOTO_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
          if (
            ageMs < PHOTO_CACHE_TTL_MS &&
            c.raw_data?.photo?.photo_url &&
            c.raw_data.photo.source !== 'hf_generated'
          ) {
            return Response.json(c.raw_data.photo);
          }
        }
      } catch (_) { /* cache miss is fine */ }
    }

    // ── SOURCE 1a: planespotters.net pub API — match by hex code (most precise) ──
    if (hexCode) {
      try {
        const psRes = await fetch(`https://api.planespotters.net/pub/photos/hex/${encodeURIComponent(hexCode)}`, {
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

    // ── SOURCE 1b: planespotters.net pub API — match by registration marking ──
    if (!result.photo_url && fullReg) {
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

    if (!result.photo_url) {
      return Response.json({
        ...result,
        error: 'No photo available for this aircraft.',
      }, { status: 404 });
    }

    // ── CACHE WRITE: store photo for instant repeat lookups ──
    if (fullReg) {
      try {
        const existing = await base44.asServiceRole.entities.GlobalRegistry.filter(
          { registration: fullReg }, '-created_date', 1
        );
        const photoData = {
          photo_url: result.photo_url,
          thumbnail_url: result.thumbnail_url,
          source: result.source,
          photographer: result.photographer,
          photo_link: result.photo_link,
        };
        if (existing.length > 0) {
          const c = existing[0];
          await base44.asServiceRole.entities.GlobalRegistry.update(c.id, {
            raw_data: { ...c.raw_data, photo: photoData },
            last_verified_at: new Date().toISOString(),
          });
        } else {
          await base44.asServiceRole.entities.GlobalRegistry.create({
            registration: fullReg,
            mode_s_hex: hexCode || null,
            source: 'photo_cache',
            raw_data: { photo: photoData },
            last_verified_at: new Date().toISOString(),
          });
        }
      } catch (_) { /* cache write is non-critical */ }
    }

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});