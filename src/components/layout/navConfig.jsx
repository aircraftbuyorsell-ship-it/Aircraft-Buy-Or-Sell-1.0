import {
  Plane, Scale, Radar, Map, BarChart2, FileText,
  TrendingUp, Calculator, Shield, Zap, FileBarChart, CheckCircle,
  User, Users, GitBranch, Code, Globe, BadgeCheck, Search, Landmark,
  Sparkles, Briefcase, CreditCard, Banknote,
} from "lucide-react";

/**
 * Public product navigation — organized by product, not by feature:
 * Marketplace · ABOS Intelligence · Solutions · Developers · Pricing
 * Admin / internal tools live in the role-based AccountMenu, not here.
 */
export const NAV_TREE = [
  {
    label: "Marketplace",
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
      {
        label: "Deal Flow",
        items: [
          { path: "/sales-pipeline", label: "Sales Pipeline", icon: GitBranch },
          { path: "/escrow", label: "Transactions", icon: Landmark },
          { path: "/pre-buy-inspection", label: "Pre-buy Inspection", icon: CheckCircle },
          { path: "/leads", label: "Leads", icon: Users },
          { path: "/cross-border-bridge", label: "Cross-Border", icon: Globe },
        ],
      },
    ],
  },
  {
    label: "ABOS Intelligence",
    mobileLabel: "Intelligence",
    path: "/n-lookup",
    icon: Sparkles,
    categories: [
      {
        label: "Verify & Score",
        items: [
          { path: "/n-lookup", label: "N-Number Lookup", icon: Search },
          { path: "/ati-passport", label: "ATI Passport", icon: Shield },
          { path: "/ati-quick-score", label: "Quick Score", icon: Zap },
          { path: "/ati-full-report", label: "Full Report", icon: FileBarChart },
          { path: "/ati-verify", label: "Live Verification", icon: CheckCircle },
          { path: "/experts", label: "Verified Experts", icon: BadgeCheck },
        ],
      },
      {
        label: "Market Intelligence",
        items: [
          { path: "/valuation", label: "OMVM Valuation", icon: TrendingUp },
          { path: "/analytics", label: "Analytics", icon: BarChart2 },
          { path: "/market-reports", label: "Market Reports", icon: FileText },
          { path: "/traffic", label: "Live Traffic Map", icon: Plane },
          { path: "/faa-map", label: "FAA Registry", icon: Map },
          { path: "/service-intelligence", label: "Service Intel", icon: Zap },
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
    label: "Solutions",
    path: "/solutions/buyers",
    icon: Briefcase,
    categories: [
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
    label: "Developers",
    path: "/developers",
    icon: Code,
    categories: [
      {
        label: "Platform",
        items: [
          { path: "/developers", label: "API & SDK", icon: Code },
          { path: "/developers/core-api", label: "Core API v1", icon: Zap },
          { path: "/integration-kit", label: "Integration Kit", icon: Globe },
          { path: "/skills", label: "Skills Library", icon: Sparkles },
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

/** Flatten all leaf paths for active-state matching. */
export function isPathInSection(section, pathname) {
  if (section.direct) return pathname === section.path;
  return (section.categories || []).some((cat) =>
    cat.items.some(
      (item) => pathname === item.path || pathname.startsWith(item.path + "/")
    )
  );
}