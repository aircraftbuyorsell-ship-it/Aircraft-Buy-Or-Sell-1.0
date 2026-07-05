import {
  ShieldCheck, TrendingUp, FileText, Scale, CheckCircle,
  DollarSign, Flag, Settings, Plane, Search, Radar, Map, BarChart2,
  FileText as Report, Zap, Calculator, Shield, Sparkles, Globe, Users,
  Landmark, Code, User, GitBranch, LayoutDashboard, Layers,
  Wrench, Eye, PenTool, AlertCircle, Banknote, Stamp, ArrowRightLeft,
} from "lucide-react";

/**
 * n8n-style pipeline navigation — organized by sales pipeline phases.
 * Each phase is a node in a vertical chain; categories are sub-steps within that phase.
 *
 * Pipeline flow:
 * Verification → Valuation → Documents → Legal → Inspection → Financial → Closing
 * + Platform (non-pipeline tools)
 */

export const PIPELINE_PHASES = [
  {
    label: "Verification",
    path: "/n-lookup",
    icon: ShieldCheck,
    color: "#4e8ef7",
    description: "Identity, registry & airworthiness",
    categories: [
      {
        label: "Aircraft Lookup",
        items: [
          { path: "/n-lookup", label: "N-Number Lookup", icon: Search },
          { path: "/ati-passport", label: "ATI Passport", icon: Shield },
          { path: "/faa-map", label: "FAA Registry Map", icon: Map },
        ],
      },
      {
        label: "ATI Scoring",
        items: [
          { path: "/ati-quick-score", label: "Quick Score", icon: Zap },
          { path: "/ati-standard", label: "Standard Report", icon: Shield },
          { path: "/ati-full-report", label: "Full Report", icon: FileText },
          { path: "/ati-verify", label: "Live Verification", icon: CheckCircle },
        ],
      },
    ],
  },
  {
    label: "Valuation",
    path: "/valuation",
    icon: TrendingUp,
    color: "#f5c242",
    description: "Market value & cost analysis",
    categories: [
      {
        label: "Market Value",
        items: [
          { path: "/valuation", label: "Aircraft Valuation", icon: TrendingUp },
          { path: "/deal-radar", label: "Deal Radar", icon: Radar },
        ],
      },
      {
        label: "Cost & Finance",
        items: [
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
    label: "Documents",
    path: "/integration-kit",
    icon: FileText,
    color: "#a78bfa",
    description: "Intake, OCR & vault",
    categories: [
      {
        label: "Integrations",
        items: [
          { path: "/integration-kit", label: "Integration Kit", icon: Code },
          { path: "/developers", label: "API & SDK", icon: Code },
        ],
      },
    ],
  },
  {
    label: "Legal",
    path: "/cross-border-bridge",
    icon: Scale,
    color: "#c084fc",
    description: "Contracts, signatures & compliance",
    categories: [
      {
        label: "Agreements",
        items: [
          { path: "/cross-border-bridge", label: "Cross-Border Bridge", icon: Globe },
          { path: "/escrow-agreement", label: "Escrow Agreement", icon: FileText },
          { path: "/affiliate-agreement", label: "Affiliate Agreement", icon: FileText },
        ],
      },
    ],
  },
  {
    label: "Inspection",
    path: "/pre-buy-inspection",
    icon: CheckCircle,
    color: "#e8a83a",
    description: "Pre-buy & expert network",
    categories: [
      {
        label: "Inspection",
        items: [
          { path: "/pre-buy-inspection", label: "Pre-buy Inspection", icon: CheckCircle },
          { path: "/experts", label: "Verified Experts", icon: ShieldCheck },
          { path: "/expert-dashboard", label: "Expert Dashboard", icon: User },
        ],
      },
    ],
  },
  {
    label: "Financial",
    path: "/escrow",
    icon: DollarSign,
    color: "#5dcaa5",
    description: "Escrow & payments",
    categories: [
      {
        label: "Transactions",
        items: [
          { path: "/escrow", label: "Decentralized Transactions", icon: Landmark },
          { path: "/leads", label: "Leads", icon: Users },
        ],
      },
    ],
  },
  {
    label: "Closing",
    path: "/sales-pipeline",
    icon: Flag,
    color: "#0f7a56",
    description: "Title transfer & deal closure",
    categories: [
      {
        label: "Deal Flow",
        items: [
          { path: "/sales-pipeline", label: "Sales Pipeline", icon: GitBranch },
          { path: "/listings", label: "Aircraft Listings", icon: Plane },
          { path: "/compare", label: "Compare Aircraft", icon: Scale },
          { path: "/marketplace", label: "Marketplace", icon: Layers },
        ],
      },
    ],
  },
  {
    label: "Platform",
    path: "/",
    icon: Settings,
    color: "#6b7280",
    description: "Analytics, community & admin",
    categories: [
      {
        label: "Intelligence",
        items: [
          { path: "/", label: "Dashboard", icon: LayoutDashboard },
          { path: "/analytics", label: "Analytics", icon: BarChart2 },
          { path: "/market-reports", label: "Market Reports", icon: FileText },
          { path: "/traffic", label: "Live Traffic Map", icon: Plane },
          { path: "/service-intelligence", label: "Service Intelligence", icon: Zap },
        ],
      },
      {
        label: "Community",
        items: [
          { path: "/community", label: "ABOS Community", icon: Users },
          { path: "/weekly-briefing", label: "Weekly Briefings", icon: FileText },
          { path: "/feature-requests", label: "Feature Requests", icon: GitBranch },
          { path: "/skills", label: "Skills Library", icon: Sparkles },
        ],
      },
      {
        label: "Account & Admin",
        items: [
          { path: "/my-account", label: "Profile & Settings", icon: User },
          { path: "/pricing", label: "Credits & Benefits", icon: Shield },
          { path: "/workflows", label: "Workflows", icon: Zap },
          { path: "/admin/settings", label: "Admin Settings", icon: Shield },
          { path: "/admin/listings", label: "Admin Listings", icon: Shield },
        ],
      },
    ],
  },
];

/** Flatten all leaf paths for active-state matching. */
export function isPathInPhase(phase, pathname) {
  return phase.categories.some((cat) =>
    cat.items.some(
      (item) => pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path + "/"))
    )
  );
}

// Backward compat — keep old export name for components still referencing NAV_TREE
export const NAV_TREE = PIPELINE_PHASES;
export function isPathInSection(section, pathname) {
  return isPathInPhase(section, pathname);
}