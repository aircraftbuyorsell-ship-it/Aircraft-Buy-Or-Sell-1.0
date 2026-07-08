import {
  Plane, Scale, Radar, Map, BarChart2, FileText,
  TrendingUp, Calculator, Shield, Zap, FileBarChart, CheckCircle,
  User, Users, GitBranch, Globe, BadgeCheck, Search, Landmark,
  Sparkles, Briefcase, CreditCard, Banknote, LayoutDashboard, Award,
} from "lucide-react";

/**
 * Public product navigation — workflow thinking, four products:
 * Marketspace · Intelligence · Verification · Services (+ Pricing, Dashboard)
 * Developers moved to the footer; admin / internal tools live in the AccountMenu.
 * No routes were deleted — deep links stay intact (Design Sprint 1, §2).
 */
export const NAV_TREE = [
  {
    label: "Marketspace",
    mobileLabel: "Market",
    path: "/listings",
    icon: Plane,
    categories: [
      {
        label: "Browse & Discover",
        items: [
          { path: "/listings", label: "Aircraft Listings", icon: Plane },
          { path: "/compare", label: "Compare Aircraft", icon: Scale },
          { path: "/deal-radar", label: "Deal Radar", icon: Radar },
        ],
      },
    ],
  },
  {
    label: "Intelligence",
    mobileLabel: "Intel",
    path: "/analytics",
    icon: Sparkles,
    categories: [
      {
        label: "Market Intelligence",
        items: [
          { path: "/analytics", label: "Analytics", icon: BarChart2 },
          { path: "/valuation", label: "OMVM Valuation", icon: TrendingUp },
          { path: "/market-reports", label: "Market Reports", icon: FileText },
          { path: "/traffic", label: "Live Traffic Map", icon: Plane },
          { path: "/faa-map", label: "FAA Registry", icon: Map },
        ],
      },
      {
        label: "ATI Reports",
        items: [
          { path: "/ati-quick-score", label: "Quick Score", icon: Zap },
          { path: "/ati-full-report", label: "Full Report", icon: FileBarChart },
        ],
      },
      {
        label: "Cost Calculators",
        items: [
          { path: "/opex-calculator", label: "Operating Cost", icon: Calculator },
          { path: "/insurance-calculator", label: "Insurance", icon: Shield },
          { path: "/leasing-calculator", label: "Leasing", icon: Calculator },
          { path: "/avionics-upgrade-calculator", label: "Avionics Upgrade", icon: Zap },
          { path: "/exterior-refurbishment-calculator", label: "Exterior Refurb", icon: TrendingUp },
          { path: "/interior-refurbishment-calculator", label: "Interior Refurb", icon: Calculator },
          { path: "/aircraft-detailing-calculator", label: "Detailing", icon: Sparkles },
          { path: "/upgrade-comparison", label: "Upgrade Compare", icon: Scale },
        ],
      },
    ],
  },
  {
    label: "Verification",
    mobileLabel: "Verify",
    path: "/ati-verify",
    icon: Shield,
    categories: [
      {
        label: "Trust & Verify",
        items: [
          { path: "/ati-verify", label: "Verification Center", icon: CheckCircle },
          { path: "/n-lookup", label: "Registry Lookup", icon: Search },
          { path: "/ati-passport", label: "ATI Passport", icon: Shield },
          { path: "/ati-standard", label: "ATI Standard", icon: Award },
          { path: "/experts", label: "Verified Experts", icon: BadgeCheck },
        ],
      },
    ],
  },
  {
    label: "Services",
    mobileLabel: "Services",
    path: "/service-intelligence",
    icon: Briefcase,
    categories: [
      {
        label: "Professional Services",
        items: [
          { path: "/service-intelligence", label: "Service Directory", icon: Zap },
          { path: "/pre-buy-inspection", label: "Pre-buy Inspection", icon: CheckCircle },
          { path: "/cross-border-bridge", label: "Cross-Border", icon: Globe },
        ],
      },
      {
        label: "Transaction Support",
        items: [
          { path: "/escrow", label: "Transactions", icon: Landmark },
          { path: "/sales-pipeline", label: "Sales Pipeline", icon: GitBranch },
          { path: "/leads", label: "Leads", icon: Users },
        ],
      },
      {
        label: "By Role",
        items: [
          { path: "/solutions/buyers", label: "For Buyers", icon: User },
          { path: "/solutions/sellers", label: "For Sellers", icon: Plane },
          { path: "/solutions/brokers", label: "For Brokers", icon: Briefcase },
          { path: "/solutions/lenders", label: "For Lenders", icon: Banknote },
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