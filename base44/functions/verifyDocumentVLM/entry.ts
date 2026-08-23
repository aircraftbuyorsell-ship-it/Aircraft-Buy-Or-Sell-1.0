import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const DOC_SCHEMA = {
  type: 'object',
  properties: {
    document_type: { type: 'string' },
    registration: { type: 'string' },
    make: { type: 'string' },
    model: { type: 'string' },
    serial_number: { type: 'string' },
    issue_date: { type: 'string' },
    expiry_date: { type: 'string' },
    issuer: { type: 'string' },
    holder_name: { type: 'string' },
    legible: { type: 'boolean' },
    completeness_score: { type: 'number' },
    authenticity_score: { type: 'number' },
    verdict: { type: 'string', enum: ['pass', 'review', 'fail'] },
    findings: { type: 'array', items: { type: 'string' } },
    red_flags: { type: 'array', items: { type: 'string' } },
    summary: { type: 'string' },
  },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { file_urls, registration, expected_document_type } = await req.json();
    const urls = Array.isArray(file_urls) ? file_urls : (file_urls ? [file_urls] : []);
    if (!urls.length) return Response.json({ error: 'Provide at least one file_url (image or PDF of the document).' }, { status: 400 });

    const prompt = [
      'You are an aviation documentation examiner. Inspect the attached aircraft document image(s) visually.',
      expected_document_type && `The document is expected to be: ${expected_document_type}.`,
      registration && `It should relate to aircraft registration ${registration}.`,
      'Extract identifying data, judge legibility and completeness, and flag anything suspicious:',
      'missing signatures or stamps, altered or overwritten values, mismatched registration/serial,',
      'expired validity, inconsistent fonts or misaligned text, cropped or obscured fields.',
      'completeness_score and authenticity_score are 0-100. verdict: pass (clean), review (needs human check), fail (invalid or unusable).',
      'Never invent values you cannot read — leave those fields empty.',
    ].filter(Boolean).join('\n');

    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt,
      file_urls: urls,
      response_json_schema: DOC_SCHEMA,
    });

    const mismatch = registration && analysis?.registration &&
      analysis.registration.toUpperCase().replace(/[^A-Z0-9]/g, '') !== registration.toUpperCase().replace(/[^A-Z0-9]/g, '');

    return Response.json({
      ...analysis,
      registration_mismatch: !!mismatch,
      verdict: mismatch ? 'review' : (analysis?.verdict || 'review'),
      files_checked: urls.length,
      ai_notice: 'Visual AI assessment for informational use only — it does not replace a professional records review or pre-buy inspection.',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});