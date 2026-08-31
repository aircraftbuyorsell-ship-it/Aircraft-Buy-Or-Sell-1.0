import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const CHRONOS_URL = 'https://api-inference.huggingface.co/models/amazon/chronos-bolt-base';
const FINBERT_URL = 'https://api-inference.huggingface.co/models/ProsusAI/finbert';
const CACHE_HOURS = 6;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const make = (body.make || '').trim();
    const model = (body.model || '').trim();
    const horizon_days = body.horizon_days || 30;

    if (!make) return Response.json({ error: 'make is required' }, { status: 400 });

    const cache_key = `${make}_${model}_${horizon_days}`;

    // ── Check cache ──
    const now = new Date();
    const cached = await base44.asServiceRole.entities.MarketForecast.filter(
      { cache_key },
      '-created_date',
      1
    );
    if (cached.length > 0) {
      const rec = cached[0];
      const expires = rec.expires_at ? new Date(rec.expires_at) : null;
      if (expires && expires > now) {
        return Response.json({
          cached: true,
          make: rec.hf_make,
          model: rec.hf_model,
          horizon_days: rec.hf_horizon_days,
          forecast: rec.hf_forecast || [],
          history: rec.hf_history || [],
          sentiment: rec.hf_sentiment || { label: 'neutral', score: 0.5 },
          signal: rec.hf_signal || 'HOLD',
          ai_commentary: rec.hf_ai_commentary || '',
          current_price: rec.hf_current_price,
          forecast_change_pct: rec.hf_forecast_change_pct
        });
      }
    }

    // ── Load historical prices from AircraftListing ──
    const query = model ? { make: { $regex: make, $options: 'i' }, model: { $regex: model, $options: 'i' } } : { make: { $regex: make, $options: 'i' } };
    const listings = await base44.asServiceRole.entities.AircraftListing.filter(
      query,
      'created_date',
      200
    );

    // Build time series: group by date, average asking_price
    const priceMap = {};
    for (const l of listings) {
      if (!l.asking_price || l.asking_price <= 0) continue;
      const d = l.created_date ? l.created_date.substring(0, 10) : null;
      if (!d) continue;
      if (!priceMap[d]) priceMap[d] = [];
      priceMap[d].push(l.asking_price);
    }
    const dates = Object.keys(priceMap).sort();
    const history = dates.map(d => ({ date: d, price: Math.round(priceMap[d].reduce((a, b) => a + b, 0) / priceMap[d].length) }));
    const priceSeries = history.map(h => h.price);

    if (priceSeries.length < 3) {
      return Response.json({
        error: 'Insufficient historical data',
        detail: `Only ${priceSeries.length} data points found for ${make} ${model}. Need at least 3.`,
        make, model, horizon_days
      }, { status: 422 });
    }

    const current_price = priceSeries[priceSeries.length - 1];

    // ── Call Chronos for forecasting ──
    const hfKey = Deno.env.get('HUGGINGFACE_API_KEY');
    const headers = { 'Content-Type': 'application/json' };
    if (hfKey) headers['Authorization'] = `Bearer ${hfKey}`;

    let forecast = [];
    let chronosUsed = false;

    try {
      const chronosRes = await fetch(CHRONOS_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          inputs: { context: priceSeries, prediction_length: horizon_days }
        })
      });
      if (chronosRes.ok) {
        const data = await chronosRes.json();
        // Chronos returns quantile forecasts; parse into low/mid/high
        const forecasts = data.forecasts || data.quantile_forecasts || data;
        if (Array.isArray(forecasts) && forecasts.length > 0) {
          // If it's a 2D array [quantiles][steps], extract
          if (Array.isArray(forecasts[0])) {
            const numSteps = forecasts[0].length;
            for (let i = 0; i < numSteps; i++) {
              const stepVals = forecasts.map(q => q[i]).filter(v => typeof v === 'number');
              if (stepVals.length >= 3) {
                stepVals.sort((a, b) => a - b);
                forecast.push({
                  day: i + 1,
                  price_low: Math.round(stepVals[0]),
                  price_mid: Math.round(stepVals[Math.floor(stepVals.length / 2)]),
                  price_high: Math.round(stepVals[stepVals.length - 1])
                });
              } else if (stepVals.length > 0) {
                forecast.push({
                  day: i + 1,
                  price_low: Math.round(stepVals[0] * 0.97),
                  price_mid: Math.round(stepVals[0]),
                  price_high: Math.round(stepVals[0] * 1.03)
                });
              }
            }
          } else {
            // 1D array — single forecast line
            forecast = forecasts.map((v, i) => ({
              day: i + 1,
              price_low: Math.round(v * 0.96),
              price_mid: Math.round(v),
              price_high: Math.round(v * 1.04)
            }));
          }
          chronosUsed = true;
        }
      }
    } catch (e) {
      console.warn('Chronos call failed:', e.message);
    }

    // ── Fallback: local linear regression forecast ──
    if (!chronosUsed || forecast.length === 0) {
      const n = priceSeries.length;
      const xs = priceSeries.map((_, i) => i);
      const ys = priceSeries;
      const xMean = xs.reduce((a, b) => a + b, 0) / n;
      const yMean = ys.reduce((a, b) => a + b, 0) / n;
      let num = 0, den = 0;
      for (let i = 0; i < n; i++) {
        num += (xs[i] - xMean) * (ys[i] - yMean);
        den += (xs[i] - xMean) ** 2;
      }
      const slope = den === 0 ? 0 : num / den;
      const intercept = yMean - slope * xMean;
      forecast = [];
      for (let d = 1; d <= horizon_days; d++) {
        const mid = intercept + slope * (n - 1 + d);
        forecast.push({
          day: d,
          price_low: Math.round(mid * 0.96),
          price_mid: Math.round(mid),
          price_high: Math.round(mid * 1.04)
        });
      }
    }

    const forecast_end_price = forecast.length > 0 ? forecast[forecast.length - 1].price_mid : current_price;
    const forecast_change_pct = current_price > 0 ? Math.round(((forecast_end_price - current_price) / current_price) * 1000) / 10 : 0;

    // ── Call FinBERT for sentiment ──
    // Build text from recent listing descriptions + market context
    const recentListings = listings.slice(-10);
    const textParts = recentListings
      .map(l => [l.make, l.model, l.year, l.description].filter(Boolean).join(' '))
      .filter(t => t.length > 10);
    const sentimentText = textParts.join('. ') || `${make} ${model} aircraft market analysis`;

    let sentiment = { label: 'neutral', score: 0.5 };
    try {
      const finRes = await fetch(FINBERT_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ inputs: sentimentText.substring(0, 4000) })
      });
      if (finRes.ok) {
        const finData = await finRes.json();
        // FinBERT returns array of {label, score} objects
        if (Array.isArray(finData) && finData.length > 0) {
          const sorted = [...finData].sort((a, b) => b.score - a.score);
          sentiment = { label: sorted[0].label.toLowerCase(), score: Math.round(sorted[0].score * 100) / 100 };
        }
      }
    } catch (e) {
      console.warn('FinBERT call failed:', e.message);
    }

    // ── Derive signal ──
    let signal = 'HOLD';
    if (forecast_change_pct > 3 && sentiment.label === 'positive') signal = 'BUY';
    else if (forecast_change_pct > 5 && sentiment.label === 'neutral') signal = 'BUY';
    else if (forecast_change_pct < -3 || sentiment.label === 'negative') signal = 'WATCH';
    else signal = 'HOLD';

    // ── Generate AI commentary via InvokeLLM ──
    let ai_commentary = '';
    try {
      const llmRes = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an aviation market analyst. Based on the following data, write a concise 3-4 sentence market intelligence commentary for a broker/dealer.

Aircraft: ${make} ${model}
Current average price: $${current_price.toLocaleString()}
${horizon_days}-day forecast: $${forecast_end_price.toLocaleString()} (${forecast_change_pct > 0 ? '+' : ''}${forecast_change_pct}%)
Confidence band: $${forecast[forecast.length-1]?.price_low?.toLocaleString() ?? '—'} – $${forecast[forecast.length-1]?.price_high?.toLocaleString() ?? '—'}
Market sentiment (FinBERT): ${sentiment.label} (${Math.round(sentiment.score * 100)}% confidence)
Trading signal: ${signal}

Write in a professional, data-driven tone. Explain WHY the signal is ${signal} based on the price trend and sentiment. Do not use markdown.`,
        response_json_schema: {
          type: 'object',
          properties: { commentary: { type: 'string' } }
        }
      });
      ai_commentary = llmRes.commentary || '';
    } catch (e) {
      ai_commentary = `${make} ${model} shows a ${forecast_change_pct > 0 ? 'projected increase' : 'projected decrease'} of ${forecast_change_pct > 0 ? '+' : ''}${forecast_change_pct}% over ${horizon_days} days. Market sentiment is ${sentiment.label} (${Math.round(sentiment.score * 100)}% confidence). Signal: ${signal}.`;
    }

    // ── Save to cache ──
    const expires_at = new Date(now.getTime() + CACHE_HOURS * 3600000).toISOString();
    const cacheRecord = {
      cache_key,
      expires_at,
      hf_make: make,
      hf_model: model,
      hf_horizon_days: horizon_days,
      hf_forecast: forecast,
      hf_history: history,
      hf_sentiment: sentiment,
      hf_signal: signal,
      hf_ai_commentary: ai_commentary,
      hf_current_price: current_price,
      hf_forecast_change_pct: forecast_change_pct,
      // Fill required fields with defaults for legacy schema
      overall_sentiment: sentiment.label === 'positive' ? 'positive' : sentiment.label === 'negative' ? 'negative' : 'neutral',
      key_factors: [`${horizon_days}-day forecast: ${forecast_change_pct > 0 ? '+' : ''}${forecast_change_pct}%`, `Sentiment: ${sentiment.label}`],
      aircraft_trends: [],
      price_changes_forecast: [{ category: `${make} ${model}`, percentage_change: forecast_change_pct, timeframe: `${horizon_days} days` }],
      time_on_market_forecast: [],
      opportunities: signal === 'BUY' ? ['Favorable price trend detected'] : [],
      risks: signal === 'WATCH' ? ['Price decline projected'] : [],
      forecast_date: now.toISOString().substring(0, 10),
      model_version: 'chronos-bolt-base + finbert'
    };

    try {
      await base44.asServiceRole.entities.MarketForecast.create(cacheRecord);
    } catch (e) {
      console.warn('Cache save failed:', e.message);
    }

    return Response.json({
      cached: false,
      make, model, horizon_days,
      forecast, history,
      sentiment, signal,
      ai_commentary,
      current_price,
      forecast_change_pct
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});