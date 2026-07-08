import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    // Public spec — no auth required, but initialize client for platform context.
    createClientFromRequest(req);

    const endpointParam = (name, props, required) => ({
      type: 'object',
      required: ['endpoint'],
      properties: {
        endpoint: { type: 'string', enum: [name] },
        api_key: { type: 'string', description: 'Alternative to the x-abos-key header.' },
        params: { type: 'object', properties: props, required: required || [] },
      },
    });

    const spec = {
      openapi: '3.0.3',
      info: {
        title: 'ABOS Core API',
        version: '1.0.0',
        description:
          'Aviation Intelligence Platform API — chat-first search, OMVM valuation, listing extraction and marketplace listings. ' +
          'All calls go through a single gateway endpoint (abosCoreApi) with an `endpoint` discriminator in the JSON body. ' +
          'Authenticate with the `x-abos-key` header (API key with scopes) or a logged-in ABOS user session.',
      },
      servers: [{ url: '/functions', description: 'ABOS platform function gateway' }],
      security: [{ ApiKeyAuth: [] }],
      paths: {
        '/abosCoreApi': {
          post: {
            operationId: 'abosCoreApi',
            summary: 'ABOS Core API gateway (endpoint discriminator in body)',
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    oneOf: [
                      endpointParam('search', {
                        query: { type: 'string', example: 'Find me a Citation Latitude under 8 million USD in Europe' },
                      }, ['query']),
                      endpointParam('valuate', {
                        manufacturer: { type: 'string', example: 'Pilatus' },
                        model: { type: 'string', example: 'PC-12 NGX' },
                        year: { type: 'number', example: 2021 },
                        hours: { type: 'number', example: 450 },
                      }, ['manufacturer', 'model']),
                      endpointParam('intelligence.extract', {
                        text: { type: 'string', example: '2019 PC12 NGX 4500000 EUR Germany' },
                      }, ['text']),
                      endpointParam('listings.get', { id: { type: 'string' } }, ['id']),
                      endpointParam('listings.list', {
                        manufacturer: { type: 'string' },
                        model: { type: 'string' },
                        max_price: { type: 'number' },
                        limit: { type: 'number', maximum: 50 },
                      }),
                      endpointParam('listings.create', {
                        manufacturer: { type: 'string' },
                        model: { type: 'string' },
                        year: { type: 'number' },
                        registration: { type: 'string' },
                        price: { type: 'number' },
                        currency: { type: 'string', enum: ['USD', 'EUR', 'GBP', 'CZK', 'CHF'] },
                        hours: { type: 'number' },
                        source_url: { type: 'string' },
                      }, ['manufacturer', 'model']),
                    ],
                  },
                },
              },
            },
            responses: {
              '200': {
                description: 'Success envelope',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        status: { type: 'string', enum: ['success'] },
                        data: { type: 'object' },
                      },
                    },
                  },
                },
              },
              '401': { description: 'Missing/invalid/expired API key' },
              '403': { description: 'Insufficient scope' },
            },
          },
        },
      },
      components: {
        securitySchemes: {
          ApiKeyAuth: { type: 'apiKey', in: 'header', name: 'x-abos-key' },
        },
        schemas: {
          Listing: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              registration: { type: 'string', nullable: true },
              aircraft: {
                type: 'object',
                properties: {
                  manufacturer: { type: 'string' },
                  model: { type: 'string' },
                  year: { type: 'number', nullable: true },
                },
              },
              price: {
                type: 'object', nullable: true,
                properties: { value: { type: 'number' }, currency: { type: 'string' } },
              },
              status: { type: 'string' },
              intelligence: {
                type: 'object',
                properties: {
                  ati_score: { type: 'number', nullable: true, description: 'ATI transparency score 0-120' },
                  omvm_value: { type: 'number', nullable: true },
                  deal_score: { type: 'number', nullable: true },
                  deal_label: { type: 'string', nullable: true },
                  discount_pct: { type: 'number', nullable: true },
                },
              },
              summary: { type: 'string', nullable: true },
              photo_url: { type: 'string', nullable: true },
            },
          },
        },
      },
      'x-abos-scopes': {
        'search:read': ['search'],
        'intelligence:read': ['valuate', 'intelligence.extract'],
        'listing:read': ['listings.get', 'listings.list'],
        'listing:write': ['listings.create'],
      },
      'x-chatgpt-tools': [
        { name: 'search_aircraft', endpoint: 'search', description: 'Natural-language aircraft marketplace search' },
        { name: 'market_value', endpoint: 'valuate', description: 'OMVM market valuation for an aircraft' },
        { name: 'analyze_listing', endpoint: 'listings.get', description: 'Full listing detail with ABOS intelligence block' },
      ],
    };

    return Response.json(spec);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});