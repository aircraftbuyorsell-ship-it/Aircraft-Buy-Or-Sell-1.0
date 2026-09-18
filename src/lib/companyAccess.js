export const COMPANY_EMAIL = "aircraftbuyorsell@gmail.com";
export const COMPANY_DOMAIN = "@aircraftbuyorsell.com";

export function isCompanyAccount(email) {
  const normalized = String(email || "").trim().toLowerCase();
  return normalized === COMPANY_EMAIL || normalized.endsWith(COMPANY_DOMAIN);
}

export const INTERNAL_PAGES = [
  { label: "Admin Settings", path: "/admin/settings" },
  { label: "Admin Marketplace", path: "/admin/marketplace" },
  { label: "Admin Marketing", path: "/admin/marketing" },
  { label: "Admin Monetization", path: "/admin/monetization" },
  { label: "Admin Listings", path: "/admin/listings" },
  { label: "Data Cleanup", path: "/admin/data-cleanup" },
  { label: "Supabase Sync", path: "/admin/supabase-sync" },
  { label: "IntraZone", path: "/intrazone" },
  { label: "IntraZone Demo", path: "/demo" },
  { label: "Funnel Dashboard", path: "/funnels" },
  { label: "Search Console", path: "/search-console" },
  { label: "Walkthrough Script", path: "/walkthrough-script" },
];