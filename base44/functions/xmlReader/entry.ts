import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { XMLParser } from 'npm:fast-xml-parser@4.5.3';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { xmlContent, preserveAttributes = true } = await req.json();
    if (typeof xmlContent !== 'string' || !xmlContent.trim()) {
      return Response.json({ error: 'xmlContent is required' }, { status: 400 });
    }
    if (new TextEncoder().encode(xmlContent).length > 5 * 1024 * 1024) {
      return Response.json({ error: 'XML file exceeds the 5 MB limit' }, { status: 413 });
    }
    if (/<!DOCTYPE|<!ENTITY/i.test(xmlContent)) {
      return Response.json({ error: 'DTD and ENTITY declarations are not allowed' }, { status: 400 });
    }

    const parser = new XMLParser({
      ignoreAttributes: !preserveAttributes,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      parseTagValue: true,
      parseAttributeValue: true,
      trimValues: true,
      allowBooleanAttributes: true,
    });
    const data = parser.parse(xmlContent);
    const rootElements = Object.keys(data);

    return Response.json({ success: true, rootElements, data });
  } catch (error) {
    return Response.json({ error: error.message || 'XML parsing failed' }, { status: 400 });
  }
});