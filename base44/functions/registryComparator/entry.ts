import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

/**
 * Registry Comparator — cross-references multi-authority registry data
 * (FAA, UK CAA, Czech CAA, EASA via adsbdb.com) with live ADS-B tracking
 * history to detect grounded / revoked / inactive aircraft.
 *
 * Alert thresholds:
 *   - ACTIVE:          ADS-B sighting within 30 days
 *   - INACTIVE:        No sighting 30–90 days
 *   - GROUNDED_90D:    No sighting 90+ days (grounded alert)
 *   - LONG_GROUNDED:   No sighting 120+ days (extended ground alert)
 *   - NO_TRACKING:     No ADS-B data ever recorded
 *
 * POST { registration: string }
 */
const DASH_PREFIXES = ['OK', 'D', 'G', 'F', 'I', 'EC', 'EA', 'SE', 'OO', 'PH', 'HB', 'OE', 'LN', 'OY', 'ZK', 'VH', 'CS', 'B', '9M'];

const DAY_MS = 24 * 60 * 60 * 1000;

// ── ABOS monetization gate — active PRO/BROKER subscription required (server-enforced for web, API and MCP) ──
async function gateProSubscription(base44, user) {
  if (user?.role === 'admin' || user?.role === 'super_admin') return null;
  const check = await base44.functions.invoke('abosEntitlements', { action: 'check', product_key: 'PRO' });
  const d = check?.data || {};
  if (d.entitled || d.active_sub_product) return null;
  let checkoutUrl = null;
  try {
    const co = await base44.functions.invoke('abosEntitlements', {
      action: 'create_checkout', product_key: 'PRO',
      return_url: Deno.env.get('BASE44_APP_URL') || 'https://base44.app',
    });
    checkoutUrl = co?.data?.url || null;
  } catch (_) { /* checkout link is optional */ }
  return Response.json({
    error: 'payment_required',
    message: 'This is a paid ABOS PRO tool. An active ABOS Professional (\u20ac99/mo) or Broker subscription is required. Open checkout_url to subscribe, then retry this request.',
    product_key: 'PRO',
    checkout_url: checkoutUrl,
  }, { status: 402 });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // ── Paid feature: grounded-detection cross-registry check requires PRO ──
    const gate = await gateProSubscription(base44, user);
    if (gate) return gate;

    const { registration } = await req.json().catch(() => ({}));
    if (!registration) return Response.json({ error: 'registration required' }, { status: 400 });

    const fullReg = normalizeRegistration(registration);
    const country = detectCountry(fullReg);

    const result = {
      registration: fullReg,
      origin_country: country.code,
      origin_label: country.label,
      registry: null,
      tracking: null,
      activity_status: 'NO_TRACKING',
      alerts: [],
      compared_at: new Date().toISOString(),
    };

    // ── 1. Registry lookup (FAA entity → GlobalRegistry cache → adsbdb live) ──
    const registryData = await lookupRegistry(base44, fullReg, country);
    result.registry = registryData;

    // ── 2. ADS-B tracking history (TrafficAppearance) ──
    const tracking = await lookupTrackingHistory(base44, fullReg);
    result.tracking = tracking;

    // ── 3. Live ADS-B position (adsbdb.com — current state) ──
    if (!tracking?.live_position) {
      const live = await fetchLiveAdsb(fullReg);
      if (live) {
        if (!tracking) {
          result.tracking = { appearances_count: 0, last_seen: null, days_since_last_seen: null, live_position: live };
        } else {
          result.tracking.live_position = live;
        }
      }
    }

    // ── 4. Compute activity status & alerts ──
    const { status, alerts } = computeActivityStatus(result.tracking, result.registry, country);
    result.activity_status = status;
    result.alerts = alerts;

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// ── Registry Lookup ──────────────────────────────────────

async function lookupRegistry(base44, fullReg, country) {
  const registry = {
    found: false,
    source: null,
    authority: country.label,
    authority_code: country.code,
    registration: fullReg,
    make: null,
    model: null,
    year: null,
    serial_number: null,
    icao_type: null,
    mode_s_hex: null,
    type_aircraft: null,
    engine_type: null,
    status: null,
    registration_status: 'unknown',
    state: null,
    country: null,
    cert_issue_date: null,
    expiration_date: null,
    air_worth_date: null,
    last_action_date: null,
    registered_owner: null,
    url_photo: null,
  };

  // US: FAAAircraft entity
  if (country.code === 'US') {
    const nNumber = fullReg.replace(/^N/i, '').replace(/[^a-zA-Z0-9]/g, '');
    try {
      const faaResults = await base44.asServiceRole.entities.FAAAircraft.filter(
        { n_number: nNumber }, '-created_date', 1
      );
      if (faaResults.length > 0) {
        const faa = faaResults[0];
        registry.found = true;
        registry.source = 'faa_registry';
        registry.make = faa.make || null;
        registry.model = faa.model || null;
        registry.year = faa.year_mfr || null;
        registry.serial_number = faa.serial_number || null;
        registry.mode_s_hex = faa.mode_s_hex || null;
        registry.type_aircraft = faa.type_aircraft || null;
        registry.engine_type = faa.type_engine || null;
        registry.status = faa.status_code || null;
        registry.registration_status = mapFAAStatus(faa.status_code);
        registry.state = faa.state || null;
        registry.country = faa.country || 'United States';
        registry.cert_issue_date = faa.cert_issue_date || null;
        registry.expiration_date = faa.expiration_date || null;
        registry.air_worth_date = faa.air_worth_date || null;
        registry.last_action_date = faa.last_action_date || null;
        registry.registered_owner = faa.name ? maskOwner(faa.name) : null;
      }
    } catch (_) { /* non-critical */ }
  }

  // GlobalRegistry cache (all countries)
  if (!registry.found) {
    try {
      const cached = await base44.asServiceRole.entities.GlobalRegistry.filter(
        { registration: fullReg }, '-created_date', 1
      );
      if (cached.length > 0) {
        const c = cached[0];
        registry.found = true;
        registry.source = 'global_cache';
        registry.make = c.make || null;
        registry.model = c.model || null;
        registry.year = c.year || null;
        registry.serial_number = c.serial_number || null;
        registry.mode_s_hex = c.mode_s_hex || null;
        registry.icao_type = c.icao_type || null;
        registry.type_aircraft = c.type_aircraft || null;
        registry.engine_type = c.engine_type || null;
        registry.status = c.status || null;
        registry.country = c.country_code || country.label;
        registry.url_photo = c.raw_data?.url_photo || null;
        registry.registered_owner = c.raw_data?.registered_owner ? '****' : null;
      }
    } catch (_) { /* non-critical */ }
  }

  // adsbdb.com live (all countries — universal Mode-S fallback)
  if (!registry.found || !registry.mode_s_hex) {
    const adsb = await fetchAdsbdb(fullReg);
    if (adsb) {
      if (!registry.found) {
        registry.found = true;
        registry.source = 'adsbdb';
        registry.make = adsb.manufacturer || null;
        registry.model = adsb.type || null;
        registry.icao_type = adsb.icao_type || null;
        registry.country = adsb.registered_owner_country_name || country.label;
        registry.url_photo = adsb.url_photo || null;
        registry.registered_owner = adsb.registered_owner ? maskOwner(adsb.registered_owner) : null;
      }
      if (!registry.mode_s_hex) registry.mode_s_hex = adsb.mode_s || null;
    }
  }

  return registry;
}

// ── ADS-B Tracking History ──────────────────────────────

async function lookupTrackingHistory(base44, fullReg) {
  let appearances = [];
  
  // Query by registration
  try {
    appearances = await base44.asServiceRole.entities.TrafficAppearance.filter(
      { registration: fullReg }, '-captured_at', 50
    );
  } catch (_) { /* non-critical */ }

  // Also try by mode_s_hex if no registration match
  if (appearances.length === 0) {
    // Will be retried after registry lookup provides mode_s_hex
  }

  if (appearances.length === 0) return null;

  const lastSeen = appearances[0];
  const lastSeenDate = new Date(lastSeen.captured_at);
  const daysSince = Math.floor((Date.now() - lastSeenDate.getTime()) / DAY_MS);

  // Check if last appearance was on ground
  const groundAppearances = appearances.filter(a => a.on_ground === true);
  const lastGroundDate = groundAppearances.length > 0
    ? new Date(groundAppearances[0].captured_at)
    : null;
  const daysSinceGround = lastGroundDate
    ? Math.floor((Date.now() - lastGroundDate.getTime()) / DAY_MS)
    : null;

  return {
    appearances_count: appearances.length,
    last_seen: lastSeen.captured_at,
    last_seen_days_ago: daysSince,
    last_position: lastSeen.latitude && lastSeen.longitude ? {
      lat: lastSeen.latitude,
      lon: lastSeen.longitude,
      altitude_ft: lastSeen.altitude_ft || null,
      speed_kt: lastSeen.speed_kt || null,
      heading: lastSeen.heading || null,
      on_ground: lastSeen.on_ground || false,
    } : null,
    last_callsign: lastSeen.callsign || null,
    last_aircraft_type: lastSeen.aircraft_type || null,
    last_on_ground: lastSeen.on_ground || false,
    last_ground_date: lastGroundDate?.toISOString() || null,
    days_since_ground: daysSinceGround,
    first_seen: appearances[appearances.length - 1]?.captured_at || null,
  };
}

// ── Live ADS-B position ─────────────────────────────────

async function fetchLiveAdsb(fullReg) {
  try {
    const res = await fetch(`https://api.adsbdb.com/v0/aircraft/${encodeURIComponent(fullReg)}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const ac = data?.response?.aircraft;
    if (!ac) return null;
    return {
      mode_s: ac.mode_s || null,
      registration: ac.registration || fullReg,
      icao_type: ac.icao_type || null,
      manufacturer: ac.manufacturer || null,
      type: ac.type || null,
      registered_owner: ac.registered_owner ? maskOwner(ac.registered_owner) : null,
      url_photo: ac.url_photo || null,
    };
  } catch (_) { return null; }
}

async function fetchAdsbdb(fullReg) {
  const variants = [fullReg];
  if (fullReg.includes('-')) variants.push(fullReg.replace(/-/g, ''));
  for (const v of variants) {
    try {
      const res = await fetch(`https://api.adsbdb.com/v0/aircraft/${encodeURIComponent(v)}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const ac = data?.response?.aircraft;
      if (ac && ac.registration) return ac;
    } catch (_) { /* try next */ }
  }
  return null;
}

// ── Activity Status & Alert Computation ─────────────────

function computeActivityStatus(tracking, registry, country) {
  const alerts = [];

  if (!tracking || !tracking.last_seen) {
    // No tracking data
    if (registry?.found && registry.registration_status === 'valid') {
      return { status: 'NO_TRACKING', alerts: [{
        level: 'info',
        code: 'NO_ADSB_DATA',
        message: 'No ADS-B tracking data recorded — aircraft may not be ADS-B equipped or has never appeared in monitored airspace.',
      }] };
    }
    return { status: 'NO_TRACKING', alerts: [{
      level: 'info',
      code: 'NO_ADSB_DATA',
      message: 'No ADS-B tracking data available for this aircraft.',
    }] };
  }

  const days = tracking.last_seen_days_ago;
  let status = 'ACTIVE';

  if (days >= 120) {
    status = 'LONG_GROUNDED';
    alerts.push({
      level: 'critical',
      code: 'LONG_GROUNDED_120D',
      message: `⚠️ LONG-GROUNDED: No ADS-B activity for ${days} days (120+ day threshold). Aircraft is likely grounded, stored, or decommissioned.`,
    });
  } else if (days >= 90) {
    status = 'GROUNDED_90D';
    alerts.push({
      level: 'warning',
      code: 'GROUNDED_90D',
      message: `⚠️ GROUNDED: No ADS-B activity for ${days} days (90+ day threshold). Aircraft may be grounded, in maintenance, or stored.`,
    });
  } else if (days >= 30) {
    status = 'INACTIVE';
    alerts.push({
      level: 'info',
      code: 'INACTIVE_30D',
      message: `No ADS-B activity for ${days} days. Aircraft may be seasonally inactive or in maintenance.`,
    });
  } else {
    alerts.push({
      level: 'success',
      code: 'ACTIVE',
      message: `Aircraft is actively flying — last seen ${days} day(s) ago.`,
    });
  }

  // Registration status alerts
  if (registry?.registration_status === 'expired') {
    alerts.push({
      level: 'critical',
      code: 'REG_EXPIRED',
      message: '🚫 Registration EXPIRED — aircraft is not legally airworthy. Check with ' + country.label + ' for renewal status.',
    });
  } else if (registry?.registration_status === 'revoked') {
    alerts.push({
      level: 'critical',
      code: 'REG_REVOKED',
      message: '🚫 Registration REVOKED — aircraft registration has been cancelled by the authority.',
    });
  } else if (registry?.registration_status === 'deregistered') {
    alerts.push({
      level: 'critical',
      code: 'REG_DEREGISTERED',
      message: '🚫 Aircraft DEREGISTERED — registration has been cancelled or transferred.',
    });
  }

  // Expiration date check (FAA)
  if (registry?.expiration_date) {
    const expDate = parseFAADate(registry.expiration_date);
    if (expDate) {
      const daysToExpire = Math.floor((expDate.getTime() - Date.now()) / DAY_MS);
      if (daysToExpire < 0) {
        alerts.push({
          level: 'critical',
          code: 'REG_EXPIRED_DATE',
          message: `Registration expired ${Math.abs(daysToExpire)} days ago (${expDate.toLocaleDateString()}).`,
        });
      } else if (daysToExpire <= 30) {
        alerts.push({
          level: 'warning',
          code: 'REG_EXPIRING_SOON',
          message: `Registration expires in ${daysToExpire} days (${expDate.toLocaleDateString()}).`,
        });
      }
    }
  }

  // Cross-reference: registry says valid but no tracking for 90+ days
  if (days >= 90 && registry?.registration_status === 'valid') {
    alerts.push({
      level: 'warning',
      code: 'REG_VALID_BUT_GROUNDED',
      message: 'Registration is valid but aircraft shows no flight activity for 90+ days. Possible stored/abandoned aircraft — verify airworthiness.',
    });
  }

  // Last seen on ground
  if (tracking.last_on_ground && days < 30) {
    alerts.push({
      level: 'info',
      code: 'LAST_SEEN_GROUND',
      message: 'Aircraft was last seen on the ground (parked).',
    });
  }

  return { status, alerts };
}

// ── Helpers ──────────────────────────────────────────────

function normalizeRegistration(raw) {
  if (!raw) return '';
  let r = String(raw).toUpperCase().replace(/\s+/g, '');
  for (const p of DASH_PREFIXES) {
    if (r.startsWith(p) && !r.startsWith(p + '-')) {
      r = p + '-' + r.slice(p.length);
      break;
    }
  }
  return r;
}

function detectCountry(reg) {
  const r = reg.toUpperCase();
  if (/^N[A-Z0-9]/.test(r)) return { code: 'US', label: 'United States (FAA)' };
  if (r.startsWith('OK-')) return { code: 'CZ', label: 'Czech Republic (ÚCL)' };
  if (r.startsWith('D-')) return { code: 'DE', label: 'Germany (LBA)' };
  if (r.startsWith('G-')) return { code: 'GB', label: 'United Kingdom (CAA)' };
  if (r.startsWith('F-')) return { code: 'FR', label: 'France (DGAC)' };
  if (r.startsWith('I-')) return { code: 'IT', label: 'Italy (ENAC)' };
  if (r.startsWith('EC-') || r.startsWith('EA-')) return { code: 'ES', label: 'Spain (AESA)' };
  if (r.startsWith('SE-')) return { code: 'SE', label: 'Sweden' };
  if (r.startsWith('OO-')) return { code: 'BE', label: 'Belgium' };
  if (r.startsWith('PH-')) return { code: 'NL', label: 'Netherlands' };
  if (r.startsWith('HB-')) return { code: 'CH', label: 'Switzerland' };
  if (r.startsWith('OE-')) return { code: 'AT', label: 'Austria' };
  if (r.startsWith('LN-')) return { code: 'NO', label: 'Norway' };
  if (r.startsWith('OY-')) return { code: 'DK', label: 'Denmark' };
  if (r.startsWith('CS-')) return { code: 'PT', label: 'Portugal' };
  if (r.startsWith('C-F') || r.startsWith('C-G')) return { code: 'CA', label: 'Canada' };
  if (r.startsWith('VH-')) return { code: 'AU', label: 'Australia' };
  if (r.startsWith('ZK-')) return { code: 'NZ', label: 'New Zealand' };
  if (r.startsWith('JA')) return { code: 'JP', label: 'Japan' };
  if (r.startsWith('B-')) return { code: 'CN', label: 'China' };
  return { code: 'EU', label: 'EASA / International' };
}

function mapFAAStatus(statusCode) {
  if (!statusCode) return 'unknown';
  // FAA status codes: V/blank=Valid, A=Invalid, D=Deregistered, R=Revoked, S=Suspended, X=Expired, N=Valid
  const map = {
    'V': 'valid',
    'N': 'valid',
    'A': 'invalid',
    'D': 'deregistered',
    'R': 'revoked',
    'S': 'suspended',
    'X': 'expired',
  };
  return map[statusCode] || 'unknown';
}

function parseFAADate(dateStr) {
  if (!dateStr) return null;
  // FAA dates can be YYYYMMDD or ISO format
  if (dateStr.length === 8 && /^\d{8}$/.test(dateStr)) {
    return new Date(
      parseInt(dateStr.slice(0, 4)),
      parseInt(dateStr.slice(4, 6)) - 1,
      parseInt(dateStr.slice(6, 8))
    );
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

function maskOwner(name) {
  if (!name) return null;
  // Show first 2 words + mask
  const words = String(name).split(/\s+/).slice(0, 2).join(' ');
  return words + ' ****';
}