Deno.serve(async (req) => {
  try {
    const { role } = await req.json().catch(() => ({}));

    const catalog = {
      guide_and_help: {
        label: "🧭 Guide & Help (FREE)",
        items: [
          { name: "abos_guide", tier: "FREE", description: "Nápověda, role-aware suggestions, intent → tool routing, guided flows (due diligence / prodej / market intel) a FAQ. Volej společně s list_abos_capabilities při prvním kontaktu.", example_query: "Co umíš? / Jak ocením letadlo? / Help", tool: "abos_guide" }
        ]
      },
      buyer_tools: {
        label: "🔍 Buyer Tools (FREE)",
        items: [
          { name: "registry_lookup", tier: "FREE", description: "Vyhledání letadla podle registrace (N-Number / OK- / D- atd.) v FAA, adsbdb.com a Supabase. Vrací make/model, rok, sériové číslo, engine specs, případný ABOS inzerát.", example_query: "Prověř letadlo N123AB", tool: "registry_lookup" },
          { name: "public_twin_lookup", tier: "FREE", description: "Veřejný anonymní Digital Twin lookup — maskovaný vlastník, zda existuje ATI report, zda je na prodej. Skóre zamčené.", example_query: "Je N456CD na prodej a má ATI report?", tool: "public_twin_lookup" },
          { name: "aircraft_photo", tier: "FREE", description: "Fotografie letadla z planespotters.net / adsbdb podle registrace nebo hex kódu.", example_query: "Ukaž mi fotku N123AB", tool: "aircraft_photo" },
          { name: "easa_ad_lookup", tier: "FREE", description: "Aktuální EASA Airworthiness Directives, PADs a SIBs pro daný typ letadla z ad.easa.europa.eu.", example_query: "Jaké EASA AD platí pro Cessnu 172?", tool: "easa_ad_lookup" },
          { name: "ati_quick_score", tier: "FREE", description: "ATI transparency skóre (0–120, 8 dimenzí) pro letadlo z listing textu nebo listingId.", example_query: "Jaké má N456CD ATI skóre?", tool: "ati_quick_score" },
          { name: "registry_comparator", tier: "PRO", description: "Cross-registry ověření (FAA/CAA/EASA) + ADS-B tracking historie — detekuje grounded/revoked letadla (90+ dní bez sighting).", example_query: "Je OK-LAD aktivní nebo grounded?", tool: "registry_comparator", upgrade_url: "https://aircraftbuyorsell.com/plans" },
          { name: "global_compliance", tier: "PRO", description: "Global Compliance Report — triple-check (registry + fotky + flight traffic) → Compliance Score 0–100.", example_query: "Spočítej GCR compliance pro N123AB", tool: "global_compliance", upgrade_url: "https://aircraftbuyorsell.com/plans" },
          { name: "ati_full_report", tier: "PRO", description: "Plný 8-dimenzionální ATI due-diligence report s LLM analýzou, strengths/risks/recommendations a verdict (EXCEPTIONAL…AVOID).", example_query: "Vygeneruj plný ATI report pro N123AB", tool: "ati_full_report", upgrade_url: "https://aircraftbuyorsell.com/plans" }
        ]
      },
      seller_tools: {
        label: "🏷️ Seller & Valuation Tools",
        items: [
          { name: "omvm_valuation", tier: "PRO", description: "OMVM v5 — AI tržní ocenění s deal skóre, confidence levelem a live market intelligence z Controller.com/Trade-A-Plane.", example_query: "Jaká je tržní cena mého Piper PA-28?", tool: "omvm_valuation", upgrade_url: "https://aircraftbuyorsell.com/plans" },
          { name: "ati_quick_score", tier: "FREE", description: "ATI transparency skóre pro můj inzerát — zjisti ATI PASS badge připravenost.", example_query: "Jaké má můj inzerát ATI skóre?", tool: "ati_quick_score" },
          { name: "ati_full_report", tier: "PRO", description: "Plný 8-dimenzionální ATI report pro sales-ready prezentaci kupci.", example_query: "Vygeneruj ATI full report pro prodej", tool: "ati_full_report", upgrade_url: "https://aircraftbuyorsell.com/plans" },
          { name: "engine_maintenance", tier: "PRO", description: "Engine remaining hours do TBO, remaining % a aktuální Service Bulletins (až 50 registrací batch).", example_query: "Kolik zbývá do TBO na N789EF?", tool: "engine_maintenance", upgrade_url: "https://aircraftbuyorsell.com/plans" },
          { name: "negotiation_brief", tier: "PRO", description: "Data-backed negotiation strategie (BUYER/SELLER side) pomocí ATI + OMVM + comps — stance, arguments, target price.", example_query: "Negotační brief pro prodej N789EF (seller side)", tool: "negotiation_brief", upgrade_url: "https://aircraftbuyorsell.com/plans" },
          { name: "Expert Crosscheck", tier: "PRO", description: "Ověření údajů certifikovaným leteckým expertem (A&P/IA/EASA). Placená služba.", example_query: "Chci expertní crosscheck pro OK-LAD", upgrade_url: "https://aircraftbuyorsell.com/plans" }
        ]
      },
      market_intelligence: {
        label: "📊 Market Intelligence",
        items: [
          { name: "aviation_news", tier: "FREE", description: "Kurátorovaný aviation news pipeline (FAA, AOPA, industry) s ABOS editorial voice a themed images.", example_query: "Co je nového na trhu s letadly?", tool: "aviation_news" },
          { name: "market_report", tier: "PRO", description: "Personalizovaný tržní report — makro, politické/regulatorní signály, regionální analýza, falzifikovatelné predikce. Scope: hourly/daily/weekly/monthly.", example_query: "Vygeneruj weekly tržní report pro single-engine pistons v Evropě", tool: "market_report", upgrade_url: "https://aircraftbuyorsell.com/plans" }
        ]
      },
      finance_and_upgrade_skills: {
        label: "💰 Finance & Upgrade Skills (PRO — via invoke_skill gateway)",
        items: [
          { name: "abos.skill.opex.v1", tier: "PRO", description: "Roční provozní náklady — fuel, maintenance, hangar, insurance, reserves.", example_query: "Kolik stojí roční provoz Cessny 182?", tool: "invoke_skill" },
          { name: "abos.skill.insurance_estimate.v1", tier: "PRO", description: "Odhad hull + liability pojištění.", example_query: "Oceň pojištění pro Cirrus SR22", tool: "invoke_skill" },
          { name: "abos.skill.leasing.v1", tier: "PRO", description: "Leasing splátky a residual value.", example_query: "Spočítej leasing na letadlo za $250k", tool: "invoke_skill" },
          { name: "abos.skill.lease_rate.v1", tier: "PRO", description: "Dry lease rate odhad.", example_query: "Jaká dry lease rate pro Baron 58?", tool: "invoke_skill" },
          { name: "abos.skill.tax_benefit.v1", tier: "PRO", description: "Daňové výhody ownership.", example_query: "Jaké daňové výhody pro $200k letadlo?", tool: "invoke_skill" },
          { name: "abos.skill.engine_overhaul.v1", tier: "PRO", description: "ROI generálky motoru.", example_query: "Vyplatí se generálka motoru při 1800 SMOH?", tool: "invoke_skill" },
          { name: "abos.skill.prop_overhaul.v1", tier: "PRO", description: "ROI generálky vrtule.", example_query: "Kdy přeládat vrtuli?", tool: "invoke_skill" },
          { name: "abos.skill.rebuild_roi.v1", tier: "PRO", description: "Celkové ROI rekonstrukce.", example_query: "ROI kompletní rekonstrukce", tool: "invoke_skill" },
          { name: "abos.skill.avionics_upgrade.v1", tier: "PRO", description: "Cena glass panel retrofit.", example_query: "Cena Garmin GFC700 autopilotu?", tool: "invoke_skill" },
          { name: "abos.skill.exterior_refurb.v1", tier: "PRO", description: "Cena repainting/polish.", example_query: "Cena exterior repaint Cessny 172", tool: "invoke_skill" },
          { name: "abos.skill.interior_refurb.v1", tier: "PRO", description: "Cena seat/cabin refurb.", example_query: "Cena interior refurb", tool: "invoke_skill" },
          { name: "abos.skill.detailing.v1", tier: "PRO", description: "Cena wash/wax/deep clean.", example_query: "Cena detailing", tool: "invoke_skill" },
          { name: "abos.skill.upgrade_compare.v1", tier: "PRO", description: "Porovnání upgrade opcí + ROI.", example_query: "Porovnej avionics vs. interior", tool: "invoke_skill" },
          { name: "abos.skill.mro_schedule.v1", tier: "PRO", description: "MRO maintenance schedule.", example_query: "MRO schedule pro King Air", tool: "invoke_skill" },
          { name: "abos.skill.fractional_ownership.v1", tier: "PRO", description: "Fractional ownership cost split.", example_query: "Fractional 1/4 share Cessna 172", tool: "invoke_skill" },
          { name: "abos.skill.timebuilding_buy.v1", tier: "PRO", description: "Timebuilding purchase analysis.", example_query: "Vyplatí se koupit letadlo na timebuilding?", tool: "invoke_skill" },
          { name: "abos.skill.fleet_change.v1", tier: "PRO", description: "Fleet change cost analysis.", example_query: "Cena výměny fleet", tool: "invoke_skill" },
          { name: "abos.skill.investment_health.v1", tier: "PRO", description: "Investment brief — health, ROI, risk score.", example_query: "Investment brief pro 2018 Cirrus SR22", tool: "invoke_skill" }
        ]
      }
    };

    const chipsByRole = {
      buyer: [
        "Prověřit letadlo podle registrace",
        "Zjistit tržní cenu letadla",
        "Co je ATI skóre?",
        "Aktuální letecké zprávy"
      ],
      seller: [
        "Zvalidovat můj inzerát (N-Reg)",
        "Ocenit moje letadlo (OMVM)",
        "Jak získám ATI PASS badge?",
        "Expertní crosscheck údajů"
      ],
      broker: [
        "Prověřit letadlo pro klienta",
        "Tržní report pro region",
        "Porovnat cenu vs. OMVM",
        "Investment brief pro klienta"
      ]
    };

    const suggestionChips = chipsByRole[role] || [
      "Prověřit letadlo podle registrace",
      "Zjistit tržní cenu",
      "Co je ATI skóre?",
      "Co všechno umíš?"
    ];

    const welcomeMessage = [
      "✈️ **Vítej v ABOS MarketSpace!** Jsem tvůj letecký asistent. K dispozici mám 15 nástrojů:",
      "🧭 **Guide (FREE)** — abos_guide (nápověda, suggestions, FAQ, guided flows)",
      "🔍 **Buyer (FREE)** — registry_lookup, public_twin_lookup, aircraft_photo, easa_ad_lookup, ati_quick_score",
      "🏷️ **Valuation & Seller (PRO)** — omvm_valuation, ati_full_report, registry_comparator, global_compliance, engine_maintenance, negotiation_brief",
      "📊 **Market (FREE/PRO)** — aviation_news (FREE), market_report (PRO)",
      "💰 **Finance & Upgrades (PRO)** — invoke_skill gateway (18 skillů: OPEX, insurance, leasing, tax, ROI, avionics, refurb, MRO, fractional)",
      "",
      "Napiš třeba: *„Prověř letadlo N123AB“*, *„Jaká je tržní cena Piper PA-28?“* nebo *„Help“*",
      "🔓 PRO funkce odemkneš na https://aircraftbuyorsell.com/plans"
    ].join("\n");

    return Response.json({
      welcome_message: welcomeMessage,
      suggestion_chips: suggestionChips,
      catalog,
      instructions_for_assistant: "Při prvním kontaktu s uživatelem zobraz welcome_message a nabídni suggestion_chips jako klikatelné návrhy. Když uživatel požádá o PAID/[PRO] funkci, vysvětli že vyžaduje ABOS Pro nebo kredit a nabídni odkaz na https://aircraftbuyorsell.com/plans. FREE funkce prováděj rovnou. Odpovídej v jazyce uživatele.",
      upgrade_url: "https://aircraftbuyorsell.com/plans"
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});