Deno.serve(async (req) => {
  try {
    const { role } = await req.json().catch(() => ({}));

    const catalog = {
      buyer_tools: {
        label: "🔍 Buyer Tools",
        items: [
          { name: "N-Reg Lookup", tier: "FREE", description: "Vyhledání letadla podle registrace (N-Number / OK- / D- atd.) v FAA a globálních registrech.", example_query: "Prověř letadlo N123AB" },
          { name: "Registry Lookup", tier: "FREE", description: "Základní údaje z leteckého registru — vlastník, typ, sériové číslo, rok výroby.", example_query: "Kdo vlastní OK-LAD?" },
          { name: "ATI Quick Score Preview", tier: "FREE", description: "Rychlý náhled ATI transparency skóre (0–120) pro dané letadlo.", example_query: "Jaké má N456CD ATI skóre?" },
          { name: "Aircraft Photo", tier: "FREE", description: "Fotografie letadla podle registrace.", example_query: "Ukaž mi fotku N123AB" },
          { name: "ATI Full Report", tier: "PRO", description: "Kompletní 8-dimenzionální analýza rizik s AI doporučeními. Vyžaduje ABOS Pro kredit.", example_query: "Vygeneruj plný ATI report pro N123AB", upgrade_url: "https://aircraftbuyorsell.com/plans" },
          { name: "Investment Brief", tier: "PRO", description: "Investiční brief s exekutivním souhrnem a finančním snapshotem. Vyžaduje kredit.", example_query: "Připrav investment brief pro Cessna 172 z roku 2005", upgrade_url: "https://aircraftbuyorsell.com/plans" }
        ]
      },
      seller_tools: {
        label: "🏷️ Seller Tools",
        items: [
          { name: "Listing Validation", tier: "FREE", description: "Automatická N-Reg validace inzerátu proti FAA/EASA datasetu — ATI PASS badge.", example_query: "Zvaliduj můj inzerát s registrací N789EF" },
          { name: "OMVM Valuation", tier: "PRO", description: "Off-Market Value Model — tržní ocenění letadla s deal skóre. Vyžaduje kredit.", example_query: "Jaká je tržní cena mého Piper PA-28?", upgrade_url: "https://aircraftbuyorsell.com/plans" },
          { name: "Expert Crosscheck", tier: "PRO", description: "Ověření údajů certifikovaným leteckým expertem. Placená služba.", example_query: "Chci expertní crosscheck pro OK-LAD", upgrade_url: "https://aircraftbuyorsell.com/plans" }
        ]
      },
      market_intelligence: {
        label: "📊 Market Intelligence",
        items: [
          { name: "Aviation News", tier: "FREE", description: "Aktuální letecké zprávy a tržní signály.", example_query: "Co je nového na trhu s letadly?" },
          { name: "Market Report", tier: "PRO", description: "Personalizovaný tržní report s makro signály, regionální analýzou a predikcemi. Vyžaduje kredit.", example_query: "Vygeneruj tržní report pro single-engine pistons v Evropě", upgrade_url: "https://aircraftbuyorsell.com/plans" }
        ]
      },
      finance_skills: {
        label: "💰 Finance Skills",
        items: [
          { name: "OPEX Calculator", tier: "PRO", description: "Roční provozní náklady letadla. Vyžaduje kredit.", example_query: "Kolik stojí roční provoz Cessny 182?", upgrade_url: "https://aircraftbuyorsell.com/plans" },
          { name: "Insurance / Leasing / Tax Benefit", tier: "PRO", description: "Pojištění, leasing splátky a daňové výhody. Vyžaduje kredit.", example_query: "Spočítej leasing na letadlo za $250k", upgrade_url: "https://aircraftbuyorsell.com/plans" },
          { name: "Engine Overhaul / Avionics / Refurb ROI", tier: "PRO", description: "Návratnost investic do motoru, avioniky a renovací. Vyžaduje kredit.", example_query: "Vyplatí se generálka motoru při 1800 SMOH?", upgrade_url: "https://aircraftbuyorsell.com/plans" }
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
      "✈️ **Vítej v ABOS MarketSpace!** Jsem tvůj letecký asistent. Umím:",
      "🔍 **Buyer Tools** — prověření letadla, registry lookup, ATI skóre (FREE)",
      "🏷️ **Seller Tools** — validace inzerátu (FREE), OMVM ocenění [PRO]",
      "📊 **Market Intelligence** — letecké zprávy (FREE), tržní reporty [PRO]",
      "💰 **Finance Skills** — OPEX, leasing, pojištění, ROI kalkulace [PRO — vyžaduje kredit]",
      "",
      "Napiš třeba: *„Prověř letadlo N123AB“* — nebo se zeptej *„Co umíš?“*",
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