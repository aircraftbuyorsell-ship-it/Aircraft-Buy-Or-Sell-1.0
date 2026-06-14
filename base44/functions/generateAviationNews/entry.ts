import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const batchId = crypto.randomUUID();
    const now = new Date().toISOString();

    const prompt = `You are a Bloomberg Aviation Desk analyst. Generate 8-10 concise aviation market news headlines with brief data-driven summaries. Cover these categories: market trends, regulatory, fleet movements, tech/innovation, M&A deals, fuel costs, and aviation finance.

Rules:
- Each item must be a real, current aviation industry development (use your knowledge of June 2026)
- Bloomberg terminal style: factual, data-driven, no fluff
- Include specific numbers, percentages, or dollar amounts where credible
- Short headline (max 120 chars), 1-2 sentence summary with data point

Return a JSON array of objects with these fields:
- headline: string (max 120 chars, Bloomberg-style factual)
- summary: string (1-2 sentences with a data point, max 300 chars)
- category: one of "market", "regulatory", "fleet", "tech", "deals", "fuel", "finance"
- sentiment: one of "positive", "neutral", "negative"
- source_text: string (brief source attribution like "IATA Q2 Report", "FAA AD 2026-14", "Jet-A Spot Index")

Focus on: general aviation (SEP/MEP/turboprops), business jets, regional aviation. Avoid commercial airline news unless it impacts GA markets.`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                headline: { type: "string" },
                summary: { type: "string" },
                category: { type: "string" },
                sentiment: { type: "string" },
                source_text: { type: "string" }
              },
              required: ["headline", "category", "sentiment"]
            }
          }
        },
        required: ["items"]
      },
      model: "gemini_3_1_pro"
    });

    const items = response.items || [];

    // Delete old news from previous batch to keep the feed fresh
    const existingNews = await base44.asServiceRole.entities.AviationNewsItem.list('-created_date', 50);
    if (existingNews.length > 20) {
      const toDelete = existingNews.slice(20);
      for (const item of toDelete) {
        await base44.asServiceRole.entities.AviationNewsItem.delete(item.id);
      }
    }

    // Insert new items
    const created = [];
    for (const item of items) {
      const record = await base44.asServiceRole.entities.AviationNewsItem.create({
        headline: item.headline,
        summary: item.summary || '',
        category: item.category,
        sentiment: item.sentiment || 'neutral',
        source_text: item.source_text || '',
        published_at: now,
        batch_id: batchId,
      });
      created.push(record);
    }

    return Response.json({
      success: true,
      batch_id: batchId,
      count: created.length,
      published_at: now,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});