import {
  Plane, Shield, Code, CreditCard, LayoutDashboard, Search, Radar, Scale,
  GitBranch, Users, Bell, Globe, BarChart2, SlidersHorizontal, FileText,
  Brain, Calculator, Wrench, BadgeCheck, Map, Wallet, Plug, Bot, Sparkles,
  Download, CheckCircle, ShieldCheck, Award,
} from "lucide-react";

/**
 * ABOS Navigation — 4 Mega-Hub Structure
 *
 *  4 main pages (each with tabs embedding all tools):
 *    1. Marketspace  → listings, sales pipeline, escrow, leads, deals
 *    2. Intelligence  → valuations, analytics, calculators, reports
 *    3. Verify        → registry, digital twin, pre-buy, experts
 *    4. API           → core api, mcp, sdk, marketplace, developers
 *
 *  + Direct links: Home, Pricing
 */
export const NAV_TREE = [
  {
    label: "Home", mobileLabel: "Home", path: "/", icon: LayoutDashboard, direct: true,
  },
  {
    label: "Marketspace", mobileLabel: "Market", path: "/marketspace", icon: Plane,
    categories: [
      { label: "Find", items: [
        { label: "Aircraft Listings", path: "/listings", icon: Plane },
        { label: "Compare", path: "/compare", icon: Scale },
        { label: "Aircraft Alerts", path: "/aircraft-alerts", icon: Bell },
      ]},
      { label: "Evaluate", items: [
        { label: "Deal Radar", path: "/deal-radar", icon: Radar },
        { label: "Deal Intelligence", path: "/deal-intelligence", icon: Search },
        { label: "Aircraft Passport", path: "/verify?tab=passport", icon: ShieldCheck },
      ]},
      { label: "Transact", items: [
        { label: "Deal Room", path: "/sales-pipeline", icon: GitBranch },
        { label: "Escrow / Settlement", path: "/sales-pipeline?stage=escrow", icon: Wallet },
        { label: "Cross-Border", path: "/cross-border-bridge", icon: Globe },
      ]},
      { label: "Manage", items: [
        { label: "Leads", path: "/leads", icon: Users },
        { label: "Community", path: "/community", icon: Users },
      ]},
    ],
  },
  {
    label: "Intelligence", mobileLabel: "Intel", path: "/intelligence", icon: BarChart2,
    categories: [
      { label: "Value", items: [
        { label: "OMVM Valuation", path: "/valuation-studio", icon: SlidersHorizontal },
        { label: "Market Analytics", path: "/analytics", icon: BarChart2 },
        { label: "Market Reports", path: "/market-reports", icon: FileText },
      ]},
      { label: "Cost", items: [
        { label: "OPEX", path: "/opex-calculator", icon: Calculator },
        { label: "Insurance", path: "/insurance-calculator", icon: Shield },
        { label: "Leasing + Tax", path: "/leasing-calculator", icon: CreditCard },
      ]},
      { label: "Invest", items: [
        { label: "Investment Brief", path: "/investment-brief", icon: Brain },
        { label: "Pricing Assistant", path: "/finance-advisor", icon: Brain },
        { label: "Calculators", path: "/calculators", icon: Calculator },
      ]},
      { label: "Improve", items: [
        { label: "Avionics Upgrade", path: "/avionics-upgrade-calculator", icon: Wrench },
        { label: "Upgrade Comparison", path: "/upgrade-comparison", icon: Scale },
        { label: "Service Intelligence", path: "/service-intelligence", icon: Wrench },
      ]},
    ],
  },
  {
    label: "Verify", mobileLabel: "Verify", path: "/verify", icon: Shield,
    categories: [
      { label: "Identity", items: [
        { label: "Registry Lookup", path: "/n-lookup", icon: Search },
        { label: "FAA Registry Map", path: "/faa-map", icon: Map },
        { label: "Digital Twin", path: "/verify?tab=twin", icon: Shield },
      ]},
      { label: "ATI", items: [
        { label: "ATI Score", path: "/ati-quick-score", icon: Award },
        { label: "ATI Report", path: "/ati-full-report", icon: FileText },
        { label: "ATI Passport", path: "/verify?tab=passport", icon: ShieldCheck },
        { label: "ATI Standard", path: "/ati-standard", icon: BadgeCheck },
      ]},
      { label: "Inspect", items: [
        { label: "Pre-Buy Inspection", path: "/pre-buy-inspection", icon: CheckCircle },
        { label: "Live Traffic", path: "/traffic", icon: Radar },
        { label: "Verified Experts", path: "/experts", icon: BadgeCheck },
      ]},
      { label: "Verify", items: [
        { label: "Verification Center", path: "/ati-verify", icon: ShieldCheck },
        { label: "ATI Center", path: "/ati-center", icon: ShieldCheck },
      ]},
    ],
  },
  {
    label: "Platform", mobileLabel: "API", path: "/api", icon: Code,
    categories: [
      { label: "API", items: [
        { label: "API Overview", path: "/api", icon: Code },
        { label: "Developer Portal", path: "/developers", icon: Wallet },
        { label: "Self-Hosted Installer", path: "/install", icon: Download },
      ]},
      { label: "Agents", items: [
        { label: "Agent Connect", path: "/connect", icon: Bot },
        { label: "Skills", path: "/skills", icon: Sparkles },
        { label: "Workflows", path: "/workflows", icon: GitBranch },
      ]},
      { label: "Build", items: [
        { label: "Integration Kit", path: "/integration-kit", icon: Plug },
        { label: "Core API", path: "/developers/core-api", icon: Code },
        { label: "Marketplace", path: "/marketplace", icon: Plane },
      ]},
      { label: "Partners", items: [
        { label: "Partner Portal", path: "/partner-portal", icon: Users },
        { label: "Developer Earnings", path: "/developer-earnings", icon: Wallet },
      ]},
    ],
  },
  { label: "Pricing", path: "/pricing", icon: CreditCard, direct: true },
];

/**
 * Gradient weight — Analytics (index 2) is the peak (1.0),
 * items to its left and right gradually diminish toward 0.
 * Used for font-size and opacity scaling across the nav bar.
 */
export function navGradientWeight(index, total = NAV_TREE.length) {
  const peakIndex = 2; // Intelligence
  const maxDist = Math.max(peakIndex, total - 1 - peakIndex);
  const dist = Math.abs(index - peakIndex);
  return Math.max(0, 1 - dist / maxDist);
}

/** Flatten all leaf paths for active-state matching. */
export function isPathInSection(section, pathname) {
  if (section.direct) {
    if (pathname === section.path) return true;
    // Also match sub-paths that belong to this hub
    if (section.path !== "/") {
      return pathname === section.path || pathname.startsWith(section.path + "/");
    }
    return false;
  }
  return (section.categories || []).some((cat) =>
    cat.items.some(
      (item) => pathname === item.path || pathname.startsWith(item.path + "/")
    )
  );
}

/** All navigable leaf pages — used by UniversalSearchBar. */
export function flattenNavPages() {
  const out = [];
  for (const section of NAV_TREE) {
    out.push({ path: section.path, label: section.label, icon: section.icon, section: section.label });
  }
  return out;
}