export const NAV_DESCRIPTIONS = {
  "/listings": "Browse aircraft currently offered across the marketplace.",
  "/compare": "Compare aircraft specifications, costs and market position.",
  "/deal-radar": "Surface promising aircraft opportunities and pricing signals.",
  "/analytics": "Explore market trends, pricing activity and demand signals.",
  "/valuation-studio": "Estimate a market-supported aircraft value with OMVM.",
  "/market-reports": "Open structured market intelligence and research reports.",
  "/traffic": "Monitor current aircraft activity on the live map.",
  "/faa-map": "Search and explore FAA registry aircraft data.",
  "/ati-quick-score": "Screen transparency across eight ATI dimensions.",
  "/ati-full-report": "Review a detailed aircraft transparency assessment.",
  "/opex-calculator": "Calculate ownership, operating costs and reserves.",
  "/insurance-calculator": "Estimate insurance exposure from aircraft and usage.",
  "/leasing-calculator": "Compare lease payments and total commitment.",
  "/avionics-upgrade-calculator": "Model avionics investment and upgrade economics.",
  "/exterior-refurbishment-calculator": "Budget paint and exterior refurbishment.",
  "/interior-refurbishment-calculator": "Estimate cabin interior renewal costs.",
  "/aircraft-detailing-calculator": "Plan detailing scope and expected expense.",
  "/upgrade-comparison": "Compare upgrade scenarios side by side.",
  "/ati-verify": "Start independent aircraft data verification.",
  "/n-lookup": "Verify aircraft identity through registry records.",
  "/ati-passport": "Open the aircraft Digital Twin and ATI Passport.",
  "/ati-standard": "Review the ATI scoring and verification standard.",
  "/experts": "Find verified aviation specialists for review.",
  "/service-intelligence": "Find aviation services and provider intelligence.",
  "/pre-buy-inspection": "Plan an independent pre-purchase inspection.",
  "/cross-border-bridge": "Navigate international aircraft transfer requirements.",
  "/escrow": "Manage protected transaction and settlement workflows.",
  "/sales-pipeline": "Run the aircraft Deal Room from qualification through closing.",
  "/deal-intelligence": "Combine aircraft, market, valuation and risk signals before a deal.",
  "/aircraft-alerts": "Monitor saved aircraft and market changes automatically.",
  "/leads": "Track buyer interest and sales opportunities.",
  "/solutions/buyers": "Open tools designed for aircraft buyers.",
  "/solutions/sellers": "Open tools designed for aircraft sellers.",
  "/solutions/brokers": "Open broker sales and intelligence workflows.",
  "/solutions/lenders": "Open valuation tools for aviation lenders.",
  "/verify?tab=twin": "Open the aircraft Digital Twin workspace.",
  "/verify?tab=passport": "Open the live Aircraft Passport and ATI record.",
  "/sales-pipeline?stage=escrow": "Open the transaction workspace at the escrow and settlement stage.",
  "/api": "Connect to ABOS APIs, agents, SDKs and platform services.",
  "/developers": "Manage developer access, API usage and integrations.",
  "/install": "Install ABOS into a supported server-side application.",
  "/connect": "Connect agents and external AI workflows to ABOS.",
  "/skills": "Explore reusable ABOS aviation intelligence skills.",
  "/workflows": "Build and manage repeatable ABOS workflows.",
  "/integration-kit": "Connect ABOS intelligence to your product or marketplace.",
  "/developers/core-api": "Read the ABOS Core API developer surface.",
  "/marketplace": "Explore tools and integrations in the ABOS developer marketplace.",
  "/partner-portal": "Manage partner integrations, licensing and intelligence exchange.",
  "/developer-earnings": "Track eligible developer marketplace earnings.",
};

const DEFAULT_PRIORITY = {
  Intelligence: ["/valuation-studio", "/ati-quick-score", "/opex-calculator"],
  Marketspace: ["/listings", "/compare", "/deal-radar"],
  Verification: ["/ati-verify", "/n-lookup", "/ati-passport"],
  Services: ["/service-intelligence", "/pre-buy-inspection", "/sales-pipeline"],
};

export function sortByGuidance(items, sectionLabel, usage) {
  const defaults = DEFAULT_PRIORITY[sectionLabel] || [];
  return [...items].sort((a, b) => {
    const usageDelta = (usage[b.path] || 0) - (usage[a.path] || 0);
    if (usageDelta) return usageDelta;
    const aRank = defaults.indexOf(a.path);
    const bRank = defaults.indexOf(b.path);
    return (aRank < 0 ? 99 : aRank) - (bRank < 0 ? 99 : bRank);
  });
}