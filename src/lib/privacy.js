/**
 * Owner privacy protection — masks registered owner names from public
 * registry data before display (e.g. "JOHN SMITH" → "J*** S***").
 * Corporate entities (LLC, Inc, banks, trusts) are shown as-is since
 * they are public business records, not private individuals.
 */
const CORPORATE_TOKENS = [
  "LLC", "INC", "CORP", "CO", "LTD", "TRUST", "TRUSTEE", "BANK",
  "AVIATION", "AIRLINES", "AIRWAYS", "LEASING", "HOLDINGS", "GROUP",
  "PARTNERS", "COMPANY", "CLUB", "ASSOCIATION", "UNIVERSITY", "FLYING",
];

export function isCorporateOwner(name) {
  const upper = (name || "").toUpperCase();
  return CORPORATE_TOKENS.some((t) => new RegExp(`\\b${t}\\b`).test(upper));
}

export function maskOwnerName(name) {
  if (!name) return null;
  if (isCorporateOwner(name)) return name;
  return name
    .trim()
    .split(/\s+/)
    .map((word) => (word.length <= 1 ? word : word[0] + "***"))
    .join(" ");
}