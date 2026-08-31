// ABOS Guide, Suggestions & FAQ for MCP clients.
// Returns role-aware next-action suggestions, intent-based tool routing,
// and FAQ answers so an AI agent can guide users through the platform.

Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const role = (body.role || '').toLowerCase();
    const intent = (body.user_intent || '').toLowerCase().trim();

    // ── FAQ ──
    const FAQ = [
      {
        q: "Co je ATI skóre?",
        a: "Aircraft Transparency Index — 120bodové skóre (8 dimenzí × 15 bodů): dokumentace, maintenance, engine health, avionics, usage/mission, storage, config clarity, market readiness. Vyšší = transparentnější letadlo. Skóre 96+ = EXCELLENT, 76+ = GOOD, 56+ = FAIR.",
        related_tools: ["public_twin_lookup", "ati_quick_score"]
      },
      {
        q: "Co je OMVM?",
        a: "Off-Market Value Model v5 — AI tržní ocenění letadla kombinující depreciation curve, engine remaining life, avionics premium, ATI transparency discount a live market intelligence z Controller.com/Trade-A-Plane. Vrací omvm_value, deal_score, deal_label a confidence.",
        related_tools: ["omvm_valuation"]
      },
      {
        q: "Co je Digital Twin?",
        a: "Nezávislá digitální reprezentace letadla z FAA registru, ADS-B traffic a engine spec — s 3-source integrity cross-checkem. Veřejný lookup je FREE (public_twin_lookup), plný ATI report je PRO.",
        related_tools: ["public_twin_lookup", "registry_lookup"]
      },
      {
        q: "Jaké funkce jsou FREE a které PRO?",
        a: "FREE: registry_lookup, public_twin_lookup, aircraft_photo, easa_ad_lookup, list_abos_capabilities. PRO (vyžaduje kredit/subscription): omvm_valuation, market_report, registry_comparator, global_compliance, engine_maintenance, invoke_skill (18 finance/upgrade skillů), ATI full report.",
        related_tools: ["list_abos_capabilities"]
      },
      {
        q: "Jak založím alert na nová letadla?",
        a: "V appce přejdi na /aircraft-alerts a nastav filtry (make, model, year, max price, min ATI, deal_only). Jakmile nový inzerát odpovídá, dostaneš email. Aktuálně nelze alert založit přímo přes MCP — nasměruj uživatele na /aircraft-alerts.",
        related_tools: []
      },
      {
        q: "Jaké EASA Airworthiness Directives platí pro mé letadlo?",
        a: "Zavolej easa_ad_lookup s registrací nebo make/model — vrátí aktuální ADs, PADs a SIBs z ad.easa.europa.eu. FREE.",
        related_tools: ["easa_ad_lookup"]
      },
      {
        q: "Jak zjistím, jestli je letadlo grounded?",
        a: "Zavolej registry_comparator — křížově ověří registraci napříč FAA/CAA/EASA a porovná s ADS-B tracking historií. 90+ dní bez sighting = grounded alert.",
        related_tools: ["registry_comparator"]
      },
      {
        q: "Kolik stojí roční provoz letadla?",
        a: "Zavolej invoke_skill se skill_id 'abos.skill.opex.v1' — spočítá fuel, maintenance reserves, hangar, insurance a hourly rate. PRO (1 kredit).",
        related_tools: ["invoke_skill"]
      },
      {
        q: "Jak získám PRO funkce / kredity?",
        a: "Přejdi na https://aircraftbuyorsell.com/plans — Starter/Pro pro individuální sellers, Growth/Scale/Enterprise pro marketplace volume. EU 14denní odstoupení platí.",
        related_tools: []
      },
      {
        q: "Jak propojím ChatGPT/Claude s ABOS?",
        a: "MCP endpoint: https://abos-widget-gateway.aircraftbuyorsell.workers.dev/mcp. OAuth 2.1 + PKCE — při prvním použití se otevře consent screen. Více na /developers/core-api.",
        related_tools: []
      }
    ];

    // ── Intent → tool routing ──
    // Multi-word phrases match on substring; single short words (≤3 chars)
    // are skipped to avoid false positives like "ad" inside "letadlo".
    const INTENT_ROUTING = [
      { keywords: ["cena", "ocenění", "hodnota", "ocenit", "price", "value", "kolik stojí", "worth", "market value"], tool: "omvm_valuation", label: "Ocenění letadla (OMVM)" },
      { keywords: ["prověř", "lookup", "registrace", "n-number", "kdo vlastní", "vyhledat letadlo", "registry", "n-reg"], tool: "registry_lookup", label: "Registry lookup" },
      { keywords: ["digital twin", "twin", "veřejné", "je na prodej", "ati report existuje", "public twin"], tool: "public_twin_lookup", label: "Digital Twin public lookup" },
      { keywords: ["fotka", "photo", "foto", "obrázek", "fotku"], tool: "aircraft_photo", label: "Aircraft photo" },
      { keywords: ["easa", "airworthiness", "směrnice", "easa ad", "pad", "sib", "directive"], tool: "easa_ad_lookup", label: "EASA AD lookup" },
      { keywords: ["grounded", "aktivní", "inactive", "revoked", "tracking", "ads-b", "adsb"], tool: "registry_comparator", label: "Registry comparator (grounded detection)" },
      { keywords: ["compliance", "gcr", "audit", "triple check", "compliance report"], tool: "global_compliance", label: "Global Compliance Report" },
      { keywords: ["tbo", "smoh", "engine hours", "service bulletin", "motor", "zbývá do"], tool: "engine_maintenance", label: "Engine maintenance & SBs" },
      { keywords: ["tržní report", "market report", "outlook", "makro", "tržní zpráva", "predikce", "market intel"], tool: "market_report", label: "Market report" },
      { keywords: ["opex", "provozní náklady", "fuel", "hangar", "insurance cost", "leasing", "tax benefit", "roi", "refurb", "avionics upgrade", "fractional", "mro", "přestavba", "renovace"], tool: "invoke_skill", label: "Finance/upgrade skill (invoke_skill)" },
      { keywords: ["ati skóre", "ati score", "transparency", "ati report", "ati quick", "ati full"], tool: "ati_quick_score", label: "ATI Quick Score" },
      { keywords: ["negotiation", "vyjednávání", "negotační", "negocia", "deal brief", "kupce prodejce"], tool: "negotiation_brief", label: "Negotiation brief" },
      { keywords: ["zprávy", "news", "letecké zprávy", "co je nového", "aviation news"], tool: "aviation_news", label: "Aviation news" },
      { keywords: ["help", "nápověda", "co umíš", "guide", "faq", "jak na"], tool: "abos_guide", label: "ABOS guide & FAQ" }
    ];

    let matchedIntent = null;
    if (intent) {
      // Match multi-word phrases on substring; single tokens need word boundary.
      const words = intent.split(/\s+/).filter((w) => w.length > 0);
      const hit = INTENT_ROUTING.find((r) =>
        r.keywords.some((k) => {
          if (k.includes(" ")) return intent.includes(k);            // phrase: substring
          if (k.length <= 3) return words.includes(k);               // short word: exact token only
          return intent.includes(k);                                 // longer word: substring
        })
      );
      if (hit) matchedIntent = hit;
    }

    // ── Role-based suggestions ──
    const SUGGESTIONS_BY_ROLE = {
      buyer: [
        "Prověř letadlo podle registrace — co to je za kus?",
        "Jaké má ATI skóre a je na prodej?",
        "Ukaž mi fotku letadla",
        "Jaká EASA AD na něj platí?",
        "Oceň ho — jaká je tržní cena (OMVM)?",
        "Je grounded nebo aktivní?",
        "Založ si alert na podobná letadla (v appce)"
      ],
      seller: [
        "Oceň moje letadlo (OMVM) — na kolik?",
        "Jaké má ATI skóre?",
        "Spočítej roční provoz (OPEX) pro kupce",
        "Vyplatí se generálka motoru / avionics upgrade?",
        "Jaké EASA AD musím vyřešit před prodejem?",
        "Je moje letadlo grounded podle ADS-B?"
      ],
      broker: [
        "Oceň letadlo pro klienta (OMVM)",
        "Vygeneruj tržní report pro region/kategorii",
        "Spočítej investment brief pro klienta",
        "Negotační brief pro deal (buyer/seller side)",
        "Compliance audit letadla (GCR)",
        "Spočítej finder's fee / leasing pro klienta"
      ]
    };

    const suggestions = SUGGESTIONS_BY_ROLE[role] || [
      "Prověř letadlo podle registrace",
      "Jaká je tržní cena (OMVM)?",
      "Co je ATI skóre?",
      "Ukaž mi fotku letadla",
      "Jaké EASA AD platí pro Cessnu 172?",
      "Vygeneruj tržní report"
    ];

    // ── Guided flow: common workflows ──
    const GUIDED_FLOWS = [
      {
        name: "Due diligence před koupí",
        steps: [
          { step: "1", tool: "registry_lookup", action: "Ověř registraci — make, model, rok, vlastník" },
          { step: "2", tool: "public_twin_lookup", action: "Zjisti, zda existuje ATI report a zda je na prodej" },
          { step: "3", tool: "aircraft_photo", action: "Stáhni fotku pro vizuální kontrolu" },
          { step: "4", tool: "easa_ad_lookup", action: "Zkontroluj EASA Airworthiness Directives" },
          { step: "5", tool: "registry_comparator", action: "Ověř, že není grounded (ADS-B tracking)" },
          { step: "6", tool: "omvm_valuation", action: "Oceň letadlo — porovnej asking price vs. trh [PRO]" },
          { step: "7", tool: "invoke_skill", action: "Spočítej roční provoz a insurance pro rozpočet [PRO]" }
        ]
      },
      {
        name: "Příprava na prodej",
        steps: [
          { step: "1", tool: "omvm_valuation", action: "Oceň letadlo pro listing price [PRO]" },
          { step: "2", tool: "easa_ad_lookup", action: "Vyřeš otevřené EASA AD před prodejem" },
          { step: "3", tool: "registry_comparator", action: "Potvrď aktivní status (kupce se ptá)" },
          { step: "4", tool: "engine_maintenance", action: "Zjisti remaining TBO pro marketing [PRO]" },
          { step: "5", tool: "invoke_skill", action: "Spočítej ROI případných upgrade před prodejem [PRO]" }
        ]
      },
      {
        name: "Market intelligence pro brokera",
        steps: [
          { step: "1", tool: "market_report", action: "Vygeneruj weekly/monthly tržní report [PRO]" },
          { step: "2", tool: "omvm_valuation", action: "Oceň konkrétní letadlo pro klienta [PRO]" },
          { step: "3", tool: "global_compliance", action: "Compliance audit letadla pro lender [PRO]" }
        ]
      }
    ];

    return Response.json({
      role: role || null,
      matched_intent: matchedIntent
        ? { suggested_tool: matchedIntent.tool, label: matchedIntent.label }
        : null,
      suggestions,
      guided_flows: GUIDED_FLOWS,
      faq: FAQ,
      faq_search: intent
        ? FAQ.filter((f) => {
            const hay = (f.q + " " + f.a).toLowerCase();
            return intent.split(/\s+/).some((w) => w.length > 3 && hay.includes(w));
          }).slice(0, 5)
        : FAQ.slice(0, 4),
      instructions_for_assistant:
        "Použij tohoto nástroje, když uživatel potřebuje nápovědu, neví kterým nástrojem začít, nebo se ptá na FAQ (ATI, OMVM, Digital Twin, FREE vs PRO). Pokud matched_intent existuje, navrhni konkrétní tool. Pro komplexní úkol (due diligence, příprava prodeje) nabídnutí guided_flows. Odpovídej v jazyce uživatele.",
      upgrade_url: "https://aircraftbuyorsell.com/plans"
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});