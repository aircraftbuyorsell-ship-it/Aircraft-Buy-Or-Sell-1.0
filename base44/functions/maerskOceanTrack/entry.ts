import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// Demo data — returns sample ocean tracking data.
// When MAERSK_CONSUMER_KEY and MAERSK_BEARER_TOKEN secrets are configured,
// this function will be upgraded to call the live Maersk Ocean Track & Trace API.

const DEMO_TRACKING = {
  demo: true,
  message: 'Demo data — add MAERSK_CONSUMER_KEY and MAERSK_BEARER_TOKEN secrets to enable live tracking',
  shipment: {
    containerNumber: 'MAEU1234567',
    blNumber: 'MAEU1234567890',
    status: 'IN_TRANSIT',
    eta: '2026-08-02T14:00:00Z',
    pol: { name: 'Rotterdam', unLocode: 'NLRTM', country: 'Netherlands' },
    pod: { name: 'New York', unLocode: 'USNYC', country: 'United States' },
    vessel: { name: 'Maersk Lima', imo: '9778791', voyage: '405N' },
    lastEvent: {
      timestamp: '2026-07-18T09:30:00Z',
      description: 'Container loaded on vessel',
      location: 'Rotterdam, NL',
    },
  },
  events: [
    { timestamp: '2026-07-18T09:30:00Z', description: 'Container loaded on vessel', location: 'Rotterdam, NL', status: 'LOADED' },
    { timestamp: '2026-07-16T14:00:00Z', description: 'Gate in at terminal', location: 'Rotterdam, NL', status: 'GATE_IN' },
    { timestamp: '2026-07-15T08:00:00Z', description: 'Empty container released', location: 'Rotterdam, NL', status: 'EMPTY_RELEASED' },
  ],
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Return demo tracking data
    // Live API integration will be enabled once Maersk credentials are configured.
    return Response.json(DEMO_TRACKING);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});