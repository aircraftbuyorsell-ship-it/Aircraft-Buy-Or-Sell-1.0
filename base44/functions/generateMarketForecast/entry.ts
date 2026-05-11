import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * generateMarketForecast
 * Generates comprehensive market behavior forecast using Gemini 3.1 Pro with internet context
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    // Allow only admins to trigger forecast generation
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Generate forecast using Gemini 3.1 Pro with internet context
    const forecastData = await base44.integrations.Core.InvokeLLM({
      prompt: `Jste expertní analytik trhu s letectvím. Analyzujte současné globální i regionální tržní trendy (se zaměřením na Evropu a USA), makroekonomické ukazatele a specifické zprávy o letectví, abyste vytvořili komplexní předpověď tržního chování pro různé typy letadel.

Zahrňte následující body:
1. Celkový sentiment trhu: Pozitivní, neutrální, negativní.
2. Klíčové faktory ovlivňující trh: Ekonomické změny, regulace, ceny paliva, nové technologie, geopolitické vlivy, úrokové sazby.
3. Trendové typy letadel: Které kategorie letadel (SEP, Turboprop, Light Jet, Very Light Jet) získávají nebo ztrácejí na popularitě a proč.
4. Očekávané změny cen: Odhadněte průměrné procentuální změny cen pro klíčové kategorie letadel v následujících 6-12 měsících.
5. Očekávaný čas prodeje: Odhadněte průměrný čas prodeje pro různé kategorie letadel a jeho předpokládané změny.
6. Příležitosti a rizika: Identifikujte hlavní příležitosti a rizika.`,
      add_context_from_internet: true,
      model: 'gemini_3_1_pro',
      response_json_schema: {
        type: 'object',
        properties: {
          overall_sentiment: {
            type: 'string',
            enum: ['positive', 'neutral', 'negative'],
            description: 'Celkový sentiment trhu'
          },
          key_factors: {
            type: 'array',
            items: { type: 'string' },
            description: 'Klíčové faktory ovlivňující trh'
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

    // Save forecast to database
    const forecast = await base44.entities.MarketForecast.create({
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
      message: 'Market forecast generated successfully'
    });
  } catch (error) {
    console.error('Market forecast generation failed:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});