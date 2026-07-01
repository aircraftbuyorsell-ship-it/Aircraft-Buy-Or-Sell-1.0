import {
  LayoutDashboard, Plane, Scale, Radar, Map, BarChart2, FileText,
  TrendingUp, Calculator, Shield, Zap, FileBarChart, CheckCircle,
  User, Users, GitBranch, Code
} from "lucide-react";

/**
 * 3 main sections — Carvago-style family tree.
 * Each section has categories (groups) with leaf items.
 */
export const NAV_TREE = [
  {
    label: "Discover",
    path: "/",
    icon: LayoutDashboard,
    categories: [
      {
        label: "Browse",
        items: [
          { path: "/listings", label: "Aircraft Listings", icon: Plane },
          { path: "/compare", label: "Compare Aircraft", icon: Scale },
          { path: "/deal-radar", label: "Deal Radar", icon: Radar },
        ],
      },
      {
        label: "Market Data",
        items: [
          { path: "/traffic", label: "Traffic Maps", icon: Plane },
          { path: "/faa-map", label: "FAA Registry", icon: Map },
          { path: "/analytics", label: "Analytics", icon: BarChart2 },
          { path: "/market-reports", label: "Market Reports", icon: FileText },
        ],
      },
      {
        label: "Value Tools",
        items: [
          { path: "/valuation", label: "Valuation", icon: TrendingUp },
          { path: "/opex-calculator", label: "OPEX Calculator", icon: Calculator },
          { path: "/insurance-calculator", label: "Insurance Calculator", icon: Shield },
          { path: "/leasing-calculator", label: "Leasing Calculator", icon: Calculator },
          { path: "/avionics-upgrade-calculator", label: "Avionics Upgrade", icon: Zap },
          { path: "/exterior-refurbishment-calculator", label: "Exterior Refurb", icon: TrendingUp },
          { path: "/interior-refurbishment-calculator", label: "Interior Refurb", icon: Calculator },
        ],
      },
    ],
  },
  {
    label: "Transact",
    path: "/escrow",
    icon: Shield,
    categories: [
      {
        label: "Deal Execution",
        items: [
          { path: "/escrow", label: "Escrow", icon: Shield },
          { path: "/pre-buy-inspection", label: "Pre-buy Inspection", icon: CheckCircle },
        ],
      },
      {
        label: "ATI Suite",
        items: [
          { path: "/ati-quick-score", label: "Quick Score", icon: Zap },
          { path: "/ati-standard", label: "Standard", icon: Shield },
          { path: "/ati-full-report", label: "Full Report", icon: FileBarChart },
          { path: "/ati-verify", label: "Verification", icon: CheckCircle },
          { path: "/ati-passport", label: "Passport", icon: Shield },
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
          { path: "/developers", label: "API & SDK", icon: Code },
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