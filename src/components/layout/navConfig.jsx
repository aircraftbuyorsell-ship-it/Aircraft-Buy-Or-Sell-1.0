import {
  Plane, Shield, Code, CreditCard, LayoutDashboard,
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
    label: "Home",
    mobileLabel: "Home",
    path: "/",
    icon: LayoutDashboard,
    direct: true,
  },
  {
    label: "Marketspace",
    mobileLabel: "Market",
    path: "/marketspace",
    icon: Plane,
    direct: true,
  },
  {
    label: "Intelligence",
    mobileLabel: "Intel",
    path: "/intelligence",
    icon: Shield,
    direct: true,
  },
  {
    label: "Verify",
    mobileLabel: "Verify",
    path: "/verify",
    icon: Shield,
    direct: true,
  },
  {
    label: "API",
    mobileLabel: "API",
    path: "/api",
    icon: Code,
    direct: true,
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