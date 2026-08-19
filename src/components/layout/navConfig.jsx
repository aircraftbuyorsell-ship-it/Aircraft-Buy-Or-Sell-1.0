import {
  Plane, Shield, Briefcase, CreditCard, LayoutDashboard, Wallet,
  Search, Scale, Radar, BarChart2, FileText, Map, Globe,
  Brain, Users, CheckCircle, BadgeCheck, SlidersHorizontal,
  Landmark, GitBranch, User, Banknote, Award, Wrench, Bell, History,
} from "lucide-react";

/**
 * ABOS Navigation — Final Structure
 *
 *  3 Dropdowns (each with For Buyers / For Sellers):
 *    1. Marketspace  → listings, deals, escrow, solutions
 *    2. Intelligence  → analytics, market data, calculators & finance
 *    3. Verify        → registry, compliance, ATI scoring, experts
 *
 *  + Direct links: Pricing, Home, Wallet
 */
export const NAV_TREE = [
  {
    label: "Home",
    mobileLabel: "Home",
    path: "/",
    icon: LayoutDashboard,
    direct: true,
  },
  {
    label: "Marketspace",
    mobileLabel: "More",
    path: "/listings",
    icon: Plane,
    categories: [
      {
        label: "For Buyers",
        items: [
          { path: "/listings", label: "Aircraft Listings", icon: Plane },
          { path: "/compare", label: "Compare Aircraft", icon: Scale },
          { path: "/deal-radar", label: "Deal Radar", icon: Radar },
          { path: "/aircraft-alerts", label: "Aircraft Alerts", icon: Bell },
          { path: "/sales-pipeline", label: "Sales Pipeline", icon: GitBranch },
          { path: "/cross-border-bridge", label: "Cross-Border Bridge", icon: Globe },
          { path: "/solutions/buyers", label: "Buyer Solutions", icon: User },
        ],
      },
      {
        label: "For Sellers",
        items: [
          { path: "/solutions/sellers", label: "Seller Solutions", icon: Plane },
          { path: "/solutions/brokers", label: "Broker Solutions", icon: Briefcase },
          { path: "/escrow", label: "Escrow Transactions", icon: Landmark },
          { path: "/leads", label: "Leads", icon: Users },
          { path: "/community", label: "Community", icon: Users },
          { path: "/wallet", label: "Wallet", icon: Wallet },
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
        label: "For Buyers",
        items: [
          { path: "/analytics", label: "Market Analytics", icon: BarChart2 },
          { path: "/activity", label: "My Activity", icon: History },
          { path: "/market-reports", label: "Market Reports", icon: FileText },
          { path: "/valuation-studio", label: "Valuation Studio", icon: SlidersHorizontal },
          { path: "/investment-brief", label: "Investment Brief", icon: Brain },
          { path: "/finance-advisor", label: "Finance Advisor", icon: Brain },
        ],
      },
      {
        label: "For Sellers",
        items: [
          { path: "/traffic", label: "Live Traffic Map", icon: Plane },
          { path: "/faa-map", label: "FAA Registry Map", icon: Map },
          { path: "/service-intelligence", label: "Service Intelligence", icon: Wrench },
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
        label: "For Buyers",
        items: [
          { path: "/n-lookup", label: "Registry Lookup", icon: Search },
          { path: "/pre-buy-inspection", label: "Pre-buy Inspection", icon: CheckCircle },
          { path: "/ati-passport", label: "ATI Passport", icon: Shield },
        ],
      },
      {
        label: "For Sellers",
        items: [
          { path: "/ati-standard", label: "ATI Standard", icon: Award },
          { path: "/ati-verify", label: "Verification Center", icon: CheckCircle },
          { path: "/experts", label: "Verified Experts", icon: BadgeCheck },
          { path: "/solutions/lenders", label: "Lender Solutions", icon: Banknote },
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
];

/**
 * Gradient weight — Analytics (index 2) is the peak (1.0),
 * items to its left and right gradually diminish toward 0.
 * Used for font-size and opacity scaling across the nav bar.
 */
export function navGradientWeight(index, total = NAV_TREE.length) {
  const peakIndex = 2; // Analytics
  const maxDist = Math.max(peakIndex, total - 1 - peakIndex);
  const dist = Math.abs(index - peakIndex);
  return Math.max(0, 1 - dist / maxDist);
}

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