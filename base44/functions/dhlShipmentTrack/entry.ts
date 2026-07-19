import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// Demo data — returns sample DHL shipment tracking data.
// When DHL_API_KEY secret is configured, this function will be upgraded
// to call the live DHL Shipment Tracking Unified API.

const DEMO_TRACKING = {
  demo: true,
  message: 'Demo data — add DHL_API_KEY secret to enable live tracking',
  shipment: {
    trackingNumber: '1234567890',
    service: 'DHL Express Worldwide',
    status: 'IN_TRANSIT',
    estimatedTimeOfDelivery: '2026-07-22T12:00:00Z',
    origin: { address: { country: 'Germany', city: 'Bonn', postalCode: '53113' } },
    destination: { address: { country: 'Czech Republic', city: 'Prague', postalCode: '11000' } },
    details: { weight: { value: 2.5, unitText: 'kg' }, dimensions: { length: 30, width: 20, height: 15, unitText: 'cm' } },
    lastEvent: {
      timestamp: '2026-07-18T08:30:00Z',
      description: 'Shipment picked up',
      location: 'Bonn, DE',
    },
  },
  events: [
    { timestamp: '2026-07-18T08:30:00Z', description: 'Shipment picked up', location: 'Bonn, DE', statusCode: 'picked-up' },
    { timestamp: '2026-07-18T14:00:00Z', description: 'Processed at origin facility', location: 'Bonn, DE', statusCode: 'origin-processed' },
    { timestamp: '2026-07-18T22:15:00Z', description: 'Departed from origin hub', location: 'Leipzig, DE', statusCode: 'departure' },
  ],
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const trackingNumber = body.trackingNumber || '1234567890';

    // Return demo tracking data
    // Live API integration will be enabled once DHL_API_KEY is configured.
    return Response.json({ ...DEMO_TRACKING, shipment: { ...DEMO_TRACKING.shipment, trackingNumber } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});