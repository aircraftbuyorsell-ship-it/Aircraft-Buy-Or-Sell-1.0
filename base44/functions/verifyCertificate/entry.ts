import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * AI-powered certificate extraction from uploaded scan.
 * Uses LLM vision to read cert type, number, expiry, issuer, holder name.
 *
 * Input: { file_url }
 * Returns: { cert_type, cert_number, expiry_date, issuer, holder_name }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { file_url } = await req.json().catch(() => ({}));
    if (!file_url) return Response.json({ error: 'file_url required' }, { status: 400 });

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an aviation compliance assistant. Analyze this uploaded certificate scan and extract the following information:

1. cert_type — The type of certification (e.g., "Airframe & Powerplant (A&P)", "Inspection Authorization (IA)", "EASA Part-66 B1 License", "FAA Part 145 Repair Station Certificate", etc.)
2. cert_number — The certificate/license number printed on the document
3. expiry_date — Expiration date if visible (ISO format YYYY-MM-DD, or null if none/lifetime)
4. issuer — The issuing authority (e.g., "FAA", "EASA", "Transport Canada", "CAA")
5. holder_name — The name of the certificate holder

If any field cannot be determined from the document, return null for that field.
Return only the extracted data, no commentary.`,
      file_urls: [file_url],
      response_json_schema: {
        type: 'object',
        properties: {
          cert_type: { type: 'string' },
          cert_number: { type: 'string' },
          expiry_date: { type: 'string' },
          issuer: { type: 'string' },
          holder_name: { type: 'string' },
        },
      },
    });

    return Response.json({ extracted: result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});