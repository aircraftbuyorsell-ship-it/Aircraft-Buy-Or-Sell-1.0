import {
  Plane, Shield, Calculator, Briefcase, CreditCard, LayoutDashboard,
  Search, Scale, Radar, BarChart2, TrendingUp, FileText, Map, Globe,
  Zap, FileBarChart, Brain, Users, CheckCircle, BadgeCheck,
  DollarSign, Wrench, PaintBucket, Armchair, Sparkles, Landmark,
  GitBranch, User, Banknote, Award, Layers,
} from "lucide-react";

/**
 * ABOS Navigation — 4 core sections:
 *
 *  1. Intelligence       → market data, analytics, registry, ATI scoring
 *  2. Buyer Seller       → listings, compare, deal radar, solutions by role
 *  3. Financial Services → OPEX, insurance, leasing, investment, fractional
 *  4. MRO/CFO            → upgrades, refurb, pre-buy, escrow, pipeline
 *
 *  + Pricing + Dashboard (direct links)
 */
export const NAV_TREE = [
  {
    label: "Intelligence",
    mobileLabel: "Intel",
    path: "/analytics",
    icon: BarChart2,
    categories: [
      {
        label: "Market & Traffic",
        items: [
          { path: "/analytics", label: "Market Analytics", icon: BarChart2 },
          { path: "/valuation", label: "OMVM Valuation", icon: TrendingUp },
          { path: "/market-reports", label: "Market Reports", icon: FileText },
          { path: "/traffic", label: "Live Traffic Map", icon: Plane },
          { path: "/faa-map", label: "FAA Registry Map", icon: Map },
        ],
      },
      {
        label: "Registry & ATI",
        items: [
          { path: "/n-lookup", label: "Registry Lookup", icon: Search },
          { path: "/registry-comparator", label: "Registry Comparator", icon: Layers },
          { path: "/ati-passport", label: "ATI Passport", icon: Shield },
          { path: "/ati-standard", label: "ATI Standard", icon: Award },
          { path: "/ati-quick-score", label: "ATI Quick Score", icon: Zap },
          { path: "/ati-full-report", label: "ATI Full Report", icon: FileBarChart },
          { path: "/ati-verify", label: "Verification Center", icon: CheckCircle },
          { path: "/experts", label: "Verified Experts", icon: BadgeCheck },
        ],
      },
    ],
  },
  {
    label: "Buyer Seller",
    mobileLabel: "Buy/Sell",
    path: "/listings",
    icon: Plane,
    categories: [
      {
        label: "Browse & Compare",
        items: [
          { path: "/listings", label: "Aircraft Listings", icon: Plane },
          { path: "/compare", label: "Compare Aircraft", icon: Scale },
          { path: "/deal-radar", label: "Deal Radar", icon: Radar },
        ],
      },
      {
        label: "By Role",
        items: [
          { path: "/solutions/buyers", label: "For Buyers", icon: User },
          { path: "/solutions/sellers", label: "For Sellers", icon: Plane },
          { path: "/solutions/brokers", label: "For Brokers", icon: Briefcase },
          { path: "/solutions/lenders", label: "For Lenders", icon: Banknote },
          { path: "/leads", label: "Leads", icon: Users },
        ],
      },
    ],
  },
  {
    label: "Financial Services",
    mobileLabel: "Finance",
    path: "/calculators",
    icon: Calculator,
    categories: [
      {
        label: "Ownership Calculators",
        items: [
          { path: "/calculators", label: "All Calculators", icon: Calculator },
          { path: "/opex-calculator", label: "OPEX Calculator", icon: Calculator },
          { path: "/insurance-calculator", label: "Insurance", icon: Shield },
          { path: "/leasing-calculator", label: "Leasing + Tax", icon: DollarSign },
        ],
      },
      {
        label: "Investment",
        items: [
          { path: "/investment-brief", label: "Investment Brief", icon: Brain },
          { path: "/fractional-calculators", label: "Fractional Ownership", icon: Users },
        ],
      },
    ],
  },
  {
    label: "MRO/CFO",
    mobileLabel: "MRO/CFO",
    path: "/avionics-upgrade-calculator",
    icon: Wrench,
    categories: [
      {
        label: "MRO & Upgrades",
        items: [
          { path: "/avionics-upgrade-calculator", label: "Avionics Upgrade", icon: Zap },
          { path: "/exterior-refurbishment-calculator", label: "Exterior Refurb", icon: PaintBucket },
          { path: "/interior-refurbishment-calculator", label: "Interior Refurb", icon: Armchair },
          { path: "/aircraft-detailing-calculator", label: "Detailing (Free)", icon: Sparkles },
          { path: "/upgrade-comparison", label: "Upgrade Compare", icon: Scale },
        ],
      },
      {
        label: "Deal & Transaction",
        items: [
          { path: "/pre-buy-inspection", label: "Pre-buy Inspection", icon: CheckCircle },
          { path: "/cross-border-bridge", label: "Cross-Border", icon: Globe },
          { path: "/escrow", label: "Escrow Transactions", icon: Landmark },
          { path: "/sales-pipeline", label: "Sales Pipeline", icon: GitBranch },
        ],
      },
    ],
  },
  {
    label: "Pricing",
    path: "/pricing",
    icon: CreditCard,
    direct: true,
  },
  {
    label: "Dashboard",
    mobileLabel: "Home",
    path: "/",
    icon: LayoutDashboard,
    direct: true,
  },
];

/** Flatten all leaf paths for active-state matching. */
export function isPathInSection(section, pathname) {
  if (section.direct) return pathname === section.path;
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
    if (section.direct) {
      out.push({ path: section.path, label: section.label, icon: section.icon, section: section.label });
      continue;
    }
    for (const cat of section.categories || []) {
      for (const item of cat.items) {
        out.push({ ...item, section: section.label });
      }
    }
  }
  return out;
}