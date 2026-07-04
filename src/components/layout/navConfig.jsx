import {
  LayoutDashboard, Plane, Scale, Radar, Map, BarChart2, FileText,
  TrendingUp, Calculator, Shield, ShieldCheck, Zap, FileBarChart, CheckCircle,
  User, Users, GitBranch, Code, Globe, BadgeCheck, Search, Landmark, Sparkles
} from "lucide-react";

/**
 * Navigation tree — organized by the user journey:
 * Discover (find & research) → Verify (trust & ATI) → Transact (execute) → Manage (account & platform)
 */
export const NAV_TREE = [
  {
    label: "Discover",
    path: "/",
    icon: LayoutDashboard,
    categories: [
      {
        label: "Browse Aircraft",
        items: [
          { path: "/listings", label: "Aircraft Listings", icon: Plane },
          { path: "/compare", label: "Compare Aircraft", icon: Scale },
          { path: "/deal-radar", label: "Deal Radar", icon: Radar },
        ],
      },
      {
        label: "Market Intelligence",
        items: [
          { path: "/analytics", label: "Analytics", icon: BarChart2 },
          { path: "/market-reports", label: "Market Reports", icon: FileText },
          { path: "/traffic", label: "Live Traffic Map", icon: Plane },
          { path: "/faa-map", label: "FAA Registry", icon: Map },
          { path: "/service-intelligence", label: "Service Intelligence", icon: Zap },
        ],
      },
      {
        label: "Cost & Value Tools",
        items: [
          { path: "/valuation", label: "Valuation", icon: TrendingUp },
          { path: "/opex-calculator", label: "OPEX Calculator", icon: Calculator },
          { path: "/insurance-calculator", label: "Insurance", icon: Shield },
          { path: "/leasing-calculator", label: "Leasing", icon: Calculator },
        ],
      },
      {
        label: "Refurb & Upgrades",
        items: [
          { path: "/avionics-upgrade-calculator", label: "Avionics Upgrade", icon: Zap },
          { path: "/exterior-refurbishment-calculator", label: "Exterior Refurb", icon: TrendingUp },
          { path: "/interior-refurbishment-calculator", label: "Interior Refurb", icon: Calculator },
          { path: "/aircraft-detailing-calculator", label: "Detailing", icon: Sparkles },
          { path: "/upgrade-comparison", label: "Upgrade Comparison", icon: Scale },
        ],
      },
    ],
  },
  {
    label: "Verify",
    path: "/n-lookup",
    icon: ShieldCheck,
    categories: [
      {
        label: "Aircraft Lookup",
        items: [
          { path: "/n-lookup", label: "N-Number Lookup", icon: Search },
          { path: "/ati-passport", label: "ATI Passport", icon: Shield },
        ],
      },
      {
        label: "ATI Scoring",
        items: [
          { path: "/ati-quick-score", label: "Quick Score", icon: Zap },
          { path: "/ati-standard", label: "Standard Report", icon: Shield },
          { path: "/ati-full-report", label: "Full Report", icon: FileBarChart },
          { path: "/ati-verify", label: "Live Verification", icon: CheckCircle },
        ],
      },
      {
        label: "Expert Network",
        items: [
          { path: "/experts", label: "Verified Experts", icon: BadgeCheck },
          { path: "/expert-dashboard", label: "Expert Dashboard", icon: User },
        ],
      },
    ],
  },
  {
    label: "Transact",
    path: "/sales-pipeline",
    icon: Landmark,
    categories: [
      {
        label: "Deal Flow",
        items: [
          { path: "/sales-pipeline", label: "Sales Pipeline", icon: GitBranch },
          { path: "/escrow", label: "Escrow", icon: Landmark },
          { path: "/pre-buy-inspection", label: "Pre-buy Inspection", icon: CheckCircle },
          { path: "/leads", label: "Leads", icon: Users },
        ],
      },
      {
        label: "Cross-Border",
        items: [
          { path: "/cross-border-bridge", label: "Bureaucratic Bridges", icon: Globe },
        ],
      },
    ],
  },
  {
    label: "Manage",
    path: "/my-account",
    icon: User,
    categories: [
      {
        label: "My Account",
        items: [
          { path: "/my-account", label: "Profile & Settings", icon: User },
          { path: "/pricing", label: "Credits & Benefits", icon: Shield },
        ],
      },
      {
        label: "Community",
        items: [
          { path: "/community", label: "ABOS Community", icon: Users },
          { path: "/weekly-briefing", label: "Weekly Briefings", icon: FileText },
          { path: "/feature-requests", label: "Feature Requests", icon: GitBranch },
        ],
      },
      {
        label: "Platform",
        items: [
          { path: "/skills", label: "Skills Library", icon: Sparkles },
          { path: "/developers", label: "API & SDK", icon: Code },
          { path: "/integration-kit", label: "Integration Kit", icon: Code },
          { path: "/admin/settings", label: "Admin Settings", icon: Shield },
          { path: "/admin/listings", label: "Admin Listings", icon: Shield },
        ],
      },
    ],
  },
];

/** Flatten all leaf paths for active-state matching. */
export function isPathInSection(section, pathname) {
  return section.categories.some((cat) =>
    cat.items.some(
      (item) => pathname === item.path || pathname.startsWith(item.path + "/")
    )
  );
}