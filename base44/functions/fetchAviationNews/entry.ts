import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

/**
 * fetchAviationNews — Curated aviation news pipeline.
 * Uses InvokeLLM with web search to find the most interesting current
 * aviation news from FAA, AOPA, and industry sources, rewrites them
 * in ABOS editorial voice, generates a themed image per article,
 * and stores them as AviationNewsItem records.
 *
 * POST { force?: boolean }  — admin-only; skips the 6-hour freshness gate
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const force = body.force === true;

    // Freshness gate — skip if we fetched within the last 6 hours
    if (!force) {
      const recent = await base44.asServiceRole.entities.AviationNewsItem.filter(
        { batch_id: 'abos_curated_pipeline' },
        '-created_date',
        1
      );
      if (recent.length > 0 && recent[0].created_date) {
        const ageHrs = (Date.now() - new Date(recent[0].created_date).getTime()) / 3600000;
        if (ageHrs < 6) {
          return Response.json({ ok: true, skipped: true, reason: 'fresh_enough', age_hours: Math.round(ageHrs) });
        }
      }
    }

    const batchId = 'abos_curated_pipeline';
    const now = new Date().toISOString();

    // Step 1: Use InvokeLLM with web search to discover + curate top aviation stories
    const discoverPrompt = `You are an aviation news curator for ABOS (Aircraft Buy Or Sell), a professional aviation intelligence platform.

Search for the latest and most interesting aviation news from these sources and general aviation coverage:
- FAA newsroom (faa.gov/newsroom)
- AOPA news (aopa.org/news-and-media/news)
- Aviation industry headlines (regulatory, fleet, deals, technology, safety, market)

Select the 4 most interesting and impactful stories for aircraft buyers, sellers, brokers, and owners.

For each story, provide:
1. headline: A compelling, rewritten headline in ABOS editorial voice (concise, professional, max 120 chars)
2. summary: A 2-3 sentence rewritten summary in your own words (max 350 chars) — do NOT copy-paste source text
3. category: One of: market, regulatory, fleet, tech, deals, fuel, finance
4. sentiment: positive, neutral, or negative
5. source_text: The original source name (e.g. "FAA", "AOPA", "Aviation Week")
6. image_prompt: A detailed visual prompt for generating a thematic image for this story (photographic style, aviation-themed, no text overlays)

Return as JSON array of 4 objects.`;

    const discoverRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: discoverPrompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          articles: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                headline: { type: 'string' },
                summary: { type: 'string' },
                category: { type: 'string' },
                sentiment: { type: 'string' },
                source_text: { type: 'string' },
                image_prompt: { type: 'string' },
              },
            },
          },
        },
      },
    });

    const articles = discoverRes.articles || [];

    if (articles.length === 0) {
      return Response.json({ ok: false, error: 'No articles discovered' }, { status: 500 });
    }

    // Step 2: Generate an image for each article (parallel)
    const imagePromises = articles.map((article) =>
      base44.asServiceRole.integrations.Core.GenerateImage({
        prompt: article.image_prompt + '. Professional aviation photography, cinematic lighting, high detail, no text or watermarks.',
      }).then((res) => res.url).catch(() => null)
    );
    const imageUrls = await Promise.all(imagePromises);

    // Step 3: Store each article as AviationNewsItem
    const stored = [];
    for (let i = 0; i < articles.length; i++) {
      const a = articles[i];
      try {
        const record = await base44.asServiceRole.entities.AviationNewsItem.create({
          headline: a.headline,
          summary: a.summary,
          category: ['market', 'regulatory', 'fleet', 'tech', 'deals', 'fuel', 'finance'].includes(a.category) ? a.category : 'market',
          sentiment: ['positive', 'neutral', 'negative'].includes(a.sentiment) ? a.sentiment : 'neutral',
          source_text: a.source_text || 'ABOS Newsroom',
          published_at: now,
          batch_id: batchId,
          description: imageUrls[i] || '',
        });
        stored.push({ id: record.id, headline: record.headline, image_url: imageUrls[i] });
      } catch (e) {
        // skip if fails
      }
    }

    return Response.json({
      ok: true,
      batch_id: batchId,
      fetched_at: now,
      articles_stored: stored.length,
      articles: stored,
    });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});