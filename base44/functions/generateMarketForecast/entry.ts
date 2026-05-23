import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * generateMarketForecast
 * Generates comprehensive market behavior forecast using Gemini 3.1 Pro with internet context.
 * Respects AppConfig.freezeAbosDataInfluence — if true, ignores internal ABOS listing data.
 */

async function getAppConfig(base44) {
  const configs = await base44.asServiceRole.entities.AppConfig.filter({ key: "global" }, "-created_date", 1);
  if (configs.length) return configs[0];
  return { freezeAbosDataInfluence: true, abosDataFreezeMessage: "" };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const appConfig = await getAppConfig(base44);
    const freezeAbosData = appConfig.freezeAbosDataInfluence === true;

    const internalDataInstruction = freezeAbosData
      ? `Do NOT use or reference any internal platform listing database or proprietary sales data. Base all forecasts exclusively on publicly available external data: macroeconomic indicators, aviation industry reports, regulatory announcements, geopolitical events, fuel price trends, and manufacturer production data.`
      : `You may incorporate publicly available aviation market signals alongside general industry data.`;

    const forecastData = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are an expert aviation market analyst. Analyze current global and regional market trends (with focus on Europe and USA), macroeconomic indicators, and specific aviation industry news to generate a comprehensive market behavior forecast for various aircraft types.

${internalDataInstruction}

Include the following:
1. Overall market sentiment: Positive, neutral, or negative.
2. Key market-driving factors: Economic changes, regulation, fuel prices, new technology, geopolitical influences, interest rates.
3. Aircraft category trends: Which categories (SEP, Turboprop, Light Jet, Very Light Jet, Helicopter) are gaining or losing popularity and why.
4. Expected price changes: Estimated average percentage price changes for key aircraft categories over the next 6–12 months.
5. Expected time on market: Estimated average selling time for different aircraft categories and projected direction of change.
6. Opportunities and risks: Identify major market opportunities and risks.

Return strict JSON only.`,
      add_context_from_internet: true,
      model: 'gemini_3_1_pro',
      response_json_schema: {
        type: 'object',
        properties: {
          overall_sentiment: {
            type: 'string',
            enum: ['positive', 'neutral', 'negative']
          },
          key_factors: {
            type: 'array',
            items: { type: 'string' }
          },
          aircraft_trends: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                category: { type: 'string' },
                popularity_trend: { type: 'string', enum: ['growing', 'stable', 'declining'] },
                reason: { type: 'string' }
              },
              required: ['category', 'popularity_trend']
            }
          },
          price_changes_forecast: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                category: { type: 'string' },
                percentage_change: { type: 'number' },
                timeframe: { type: 'string' }
              },
              required: ['category', 'percentage_change', 'timeframe']
            }
          },
          time_on_market_forecast: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                category: { type: 'string' },
                average_days: { type: 'number' },
                trend: { type: 'string', enum: ['shortening', 'stable', 'lengthening'] }
              },
              required: ['category', 'average_days', 'trend']
            }
          },
          opportunities: {
            type: 'array',
            items: { type: 'string' }
          },
          risks: {
            type: 'array',
            items: { type: 'string' }
          },
          forecast_date: {
            type: 'string',
            format: 'date'
          }
        },
        required: ['overall_sentiment', 'key_factors', 'aircraft_trends', 'price_changes_forecast', 'time_on_market_forecast', 'opportunities', 'risks', 'forecast_date']
      }
    });

    const forecast = await base44.asServiceRole.entities.MarketForecast.create({
      overall_sentiment: forecastData.overall_sentiment,
      key_factors: forecastData.key_factors,
      aircraft_trends: forecastData.aircraft_trends,
      price_changes_forecast: forecastData.price_changes_forecast,
      time_on_market_forecast: forecastData.time_on_market_forecast,
      opportunities: forecastData.opportunities,
      risks: forecastData.risks,
      forecast_date: forecastData.forecast_date || new Date().toISOString().split('T')[0],
      model_version: 'gemini_3_1_pro'
    });

    return Response.json({
      ok: true,
      forecast_id: forecast.id,
      overall_sentiment: forecast.overall_sentiment,
      aircraft_trends_count: forecast.aircraft_trends.length,
      abos_data_frozen: freezeAbosData,
      message: `Market forecast generated successfully${freezeAbosData ? ' (external data only — ABOS internal data excluded)' : ''}`
    });
  } catch (error) {
    console.error('Market forecast generation failed:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});