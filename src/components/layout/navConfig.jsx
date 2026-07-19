import {
  Plane, Shield, Calculator, Briefcase, CreditCard, LayoutDashboard, Wallet,
  Search, Scale, Radar, BarChart2, TrendingUp, FileText, Map, Globe,
  Zap, FileBarChart, Brain, Users, CheckCircle, BadgeCheck,
  DollarSign, Landmark, GitBranch, User, Banknote, Award, Layers,
  Activity, Sparkles, Wrench, PaintBucket, Armchair, Fuel, Gauge, Ship, Truck,
  FileSignature,
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
    path: "/dashboard",
    icon: LayoutDashboard,
    direct: true,
  },
  {
    label: "Marketspace",
    mobileLabel: "Market",
    path: "/listings",
    icon: Plane,
    categories: [
      {
        label: "For Buyers",
        items: [
          { path: "/listings", label: "Aircraft Listings", icon: Plane },
          { path: "/compare", label: "Compare Aircraft", icon: Scale },
          { path: "/deal-radar", label: "Deal Radar", icon: Radar },
          { path: "/sales-pipeline", label: "Sales Pipeline", icon: GitBranch },
          { path: "/cross-border-bridge", label: "Cross-Border Bridge", icon: Globe },
          { path: "/ocean-freight", label: "Ocean Freight (Maersk)", icon: Ship },
          { path: "/dhl-api", label: "DHL API Hub", icon: Truck },
          { path: "/solutions/buyers", label: "Buyer Solutions", icon: User },
        ],
      },
      {
        label: "For Sellers",
        items: [
          { path: "/solutions/sellers", label: "Seller Solutions", icon: Plane },
          { path: "/solutions/brokers", label: "Broker Solutions", icon: Briefcase },
          { path: "/escrow", label: "Escrow Transactions", icon: Landmark },
          { path: "/bill-of-sale", label: "Bill of Sale Autofill", icon: FileText },
          { path: "/docusign", label: "DocuSign Agreements", icon: FileSignature },
          { path: "/leads", label: "Leads", icon: Users },
          { path: "/community", label: "Community", icon: Users },
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
          { path: "/market-reports", label: "Market Reports", icon: FileText },
          { path: "/valuation", label: "OMVM Valuation", icon: TrendingUp },
          { path: "/investment-brief", label: "Investment Brief", icon: Brain },
          { path: "/abos-intelligence", label: "ABOS Intelligence", icon: Brain },
          { path: "/calculators", label: "All Calculators", icon: Calculator },
          { path: "/opex-calculator", label: "OPEX Calculator", icon: Calculator },
          { path: "/insurance-calculator", label: "Insurance", icon: Shield },
          { path: "/leasing-calculator", label: "Leasing + Tax", icon: DollarSign },
          { path: "/fractional-calculators", label: "Fractional Ownership", icon: Users },
        ],
      },
      {
        label: "For Sellers",
        items: [
          { path: "/traffic", label: "Live Traffic Map", icon: Plane },
          { path: "/faa-map", label: "FAA Registry Map", icon: Map },
          { path: "/avionics-upgrade-calculator", label: "Avionics Upgrade", icon: Zap },
          { path: "/exterior-refurbishment-calculator", label: "Exterior Refurb", icon: PaintBucket },
          { path: "/interior-refurbishment-calculator", label: "Interior Refurb", icon: Armchair },
          { path: "/aircraft-detailing-calculator", label: "Detailing Calculator", icon: Sparkles },
          { path: "/upgrade-comparison", label: "Upgrade Comparison", icon: TrendingUp },
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
          { path: "/registry-comparator", label: "Registry Comparator", icon: Layers },
          { path: "/pre-buy-inspection", label: "Pre-buy Inspection", icon: CheckCircle },
          { path: "/ati-passport", label: "ATI Passport", icon: Shield },
          { path: "/ati-quick-score", label: "ATI Quick Score", icon: Zap },
          { path: "/ati-full-report", label: "ATI Full Report", icon: FileBarChart },
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
    label: "IntraZone",
    mobileLabel: "Intra",
    path: "/intrazone",
    icon: Globe,
    direct: true,
  },
  {
    label: "Pricing",
    path: "/pricing",
    icon: CreditCard,
    direct: true,
  },
  {
    label: "Wallet",
    path: "/wallet",
    icon: Wallet,
    direct: true,
  },
];

/**
 * Gradient weight — Intelligence (index 2) is the peak (1.0),
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