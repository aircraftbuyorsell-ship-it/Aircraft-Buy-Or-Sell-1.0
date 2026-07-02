import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action, icao, category, lat, lon } = body;

    /* ── FUEL PRICES: live lookup by airport ICAO ── */
    if (action === "fuel_prices") {
      const targetIcao = (icao || "KJFK").toUpperCase();
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Search for current aviation fuel prices at ${targetIcao} airport. Find all FBOs (Fixed Base Operators) at this airport and their current fuel prices per gallon for 100LL and Jet-A. Include any volume discounts or contract pricing. Return accurate, real data from FBO websites and fuel price reporting services like AirNav, GlobalAir, or 100LL.com.`,
        add_context_from_internet: true,
        model: "gemini_3_flash",
        response_json_schema: {
          type: "object",
          properties: {
            airport: { type: "string", description: "Airport name and ICAO code" },
            location: { type: "string" },
            fbos: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  price_100ll: { type: "number", description: "Price per gallon USD" },
                  price_jeta: { type: "number", description: "Price per gallon USD" },
                  price_jeta1: { type: "number", description: "Price per gallon USD" },
                  services: { type: "array", items: { type: "string" } },
                  phone: { type: "string" },
                  notes: { type: "string" }
                }
              }
            },
            avg_100ll: { type: "number" },
            avg_jeta: { type: "number" },
            national_avg_100ll: { type: "number" },
            national_avg_jeta: { type: "number" },
            last_updated: { type: "string" }
          }
        }
      });
      return Response.json(result);
    }

    /* ── SEARCH SERVICES: find nearby aviation services ── */
    if (action === "search_services") {
      const catMap = {
        mechanic: "certified aircraft mechanics and maintenance repair organizations (MROs)",
        ap_mechanic: "FAA-certified A&P (Airframe & Powerplant) mechanics and Inspection Authorization (IA) holders",
        flight_school: "flight schools (Part 61 and Part 141) offering pilot training",
        refueling_fbo: "FBOs (Fixed Base Operators) providing refueling and ground services",
        dealer: "aircraft dealers and sales organizations",
        broker: "aircraft brokers and brokerage firms",
        paint_shop: "aircraft paint shops and refinishing specialists"
      };
      const catLabel = catMap[category] || category || "aviation services";
      const locationDesc = icao
        ? `at or near ${icao.toUpperCase()} airport`
        : (lat != null && lon != null)
          ? `near coordinates ${lat}, ${lon}`
          : "across the United States";

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Find real, verified ${catLabel} ${locationDesc}. For each business, provide: name, full address, city, state, phone number, website URL, certifications (FAA Part 145, EASA, A&P, IA, Part 141, etc.), services offered, and any available rating. Return at least 5-10 real businesses with accurate contact information. Do not fabricate businesses — only return real, verifiable companies.`,
        add_context_from_internet: true,
        model: "gemini_3_flash",
        response_json_schema: {
          type: "object",
          properties: {
            location_searched: { type: "string" },
            services: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  category: { type: "string" },
                  address: { type: "string" },
                  city: { type: "string" },
                  state: { type: "string" },
                  country: { type: "string" },
                  phone: { type: "string" },
                  website: { type: "string" },
                  certifications: { type: "array", items: { type: "string" } },
                  services_offered: { type: "array", items: { type: "string" } },
                  rating: { type: "number" },
                  icao_code: { type: "string" }
                }
              }
            },
            total_found: { type: "number" }
          }
        }
      });
      return Response.json(result);
    }

    /* ── MARKET INTEL: category-level intelligence report ── */
    if (action === "market_intel") {
      const catMap = {
        mechanic: "aircraft maintenance and mechanic services",
        ap_mechanic: "A&P mechanic and inspection services",
        flight_school: "flight training and pilot schools",
        refueling_fbo: "FBO and aircraft refueling services",
        dealer: "aircraft dealer and sales",
        broker: "aircraft brokerage",
        paint_shop: "aircraft paint and refinishing shops"
      };
      const catLabel = catMap[category] || category || "aviation services";

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Provide a comprehensive market intelligence report on the ${catLabel} industry in 2025-2026. Include: estimated market size in USD, key industry trends, average pricing for services, regional distribution (US, Europe, Asia), growth outlook, major players, barriers to entry, and technology disruptions. Be specific with numbers and cite sources where possible.`,
        add_context_from_internet: true,
        model: "gemini_3_flash",
        response_json_schema: {
          type: "object",
          properties: {
            category: { type: "string" },
            market_size_usd: { type: "string" },
            market_size_number: { type: "number" },
            key_trends: { type: "array", items: { type: "string" } },
            avg_pricing: { type: "string" },
            regional_distribution: { type: "string" },
            growth_outlook: { type: "string" },
            growth_rate_pct: { type: "number" },
            major_players: { type: "array", items: { type: "string" } },
            barriers_to_entry: { type: "array", items: { type: "string" } },
            technology_disruptions: { type: "array", items: { type: "string" } },
            opportunities: { type: "array", items: { type: "string" } },
            risks: { type: "array", items: { type: "string" } },
            summary: { type: "string" }
          }
        }
      });
      return Response.json(result);
    }

    return Response.json({ error: "Unknown action. Use: fuel_prices, search_services, or market_intel" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});