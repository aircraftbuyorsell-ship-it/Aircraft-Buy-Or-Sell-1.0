import {
  Plane, Shield, Calculator, Briefcase, CreditCard, LayoutDashboard,
  Search, Scale, Radar, BarChart2, TrendingUp, FileText, Map, Globe,
  Zap, FileBarChart, Brain, Users, CheckCircle, BadgeCheck,
  DollarSign, Landmark, GitBranch, User, Banknote, Award, Layers,
} from "lucide-react";

/**
 * ABOS Navigation — 3 dropdown sections + 2 direct links:
 *
 *  1. Marketspace  → listings, deals, escrow, solutions by role
 *  2. Intelligence  → analytics, market data, calculators & finance
 *  3. Verify        → registry, compliance, ATI scoring, experts
 *
 *  + Pricing + Dashboard (direct links)
 *
 * Each dropdown has exactly 2 sub-categories.
 */
export const NAV_TREE = [
  {
    label: "Marketspace",
    mobileLabel: "Market",
    path: "/listings",
    icon: Plane,
    categories: [
      {
        label: "Listings & Deals",
        items: [
          { path: "/listings", label: "Aircraft Listings", icon: Plane },
          { path: "/compare", label: "Compare Aircraft", icon: Scale },
          { path: "/deal-radar", label: "Deal Radar", icon: Radar },
          { path: "/sales-pipeline", label: "Sales Pipeline", icon: GitBranch },
          { path: "/escrow", label: "Escrow Transactions", icon: Landmark },
          { path: "/leads", label: "Leads", icon: Users },
        ],
      },
      {
        label: "Solutions",
        items: [
          { path: "/solutions/buyers", label: "For Buyers", icon: User },
          { path: "/solutions/sellers", label: "For Sellers", icon: Plane },
          { path: "/solutions/brokers", label: "For Brokers", icon: Briefcase },
          { path: "/solutions/lenders", label: "For Lenders", icon: Banknote },
          { path: "/cross-border-bridge", label: "Cross-Border Bridge", icon: Globe },
        ],
      },
    ],
  },
  {
    label: "Intelligence",
    mobileLabel: "Intel",
    path: "/analytics",
    icon: BarChart2,
    categories: [
      {
        label: "Analytics & Market",
        items: [
          { path: "/analytics", label: "Market Analytics", icon: BarChart2 },
          { path: "/market-reports", label: "Market Reports", icon: FileText },
          { path: "/traffic", label: "Live Traffic Map", icon: Plane },
          { path: "/faa-map", label: "FAA Registry Map", icon: Map },
          { path: "/valuation", label: "OMVM Valuation", icon: TrendingUp },
        ],
      },
      {
        label: "Calculators & Finance",
        items: [
          { path: "/calculators", label: "All Calculators", icon: Calculator },
          { path: "/opex-calculator", label: "OPEX Calculator", icon: Calculator },
          { path: "/insurance-calculator", label: "Insurance", icon: Shield },
          { path: "/leasing-calculator", label: "Leasing + Tax", icon: DollarSign },
          { path: "/investment-brief", label: "Investment Brief", icon: Brain },
          { path: "/fractional-calculators", label: "Fractional Ownership", icon: Users },
        ],
      },
    ],
  },
  {
    label: "Verify",
    mobileLabel: "Verify",
    path: "/n-lookup",
    icon: Shield,
    categories: [
      {
        label: "Registry & Compliance",
        items: [
          { path: "/n-lookup", label: "Registry Lookup", icon: Search },
          { path: "/registry-comparator", label: "Registry Comparator", icon: Layers },
          { path: "/pre-buy-inspection", label: "Pre-buy Inspection", icon: CheckCircle },
        ],
      },
      {
        label: "ATI & Experts",
        items: [
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