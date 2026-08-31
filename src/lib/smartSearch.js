const REGISTRATION_RE = /^(N[0-9]{1,5}[A-Z]{0,2}|[A-Z]{1,2}-[A-Z0-9]{1,5})$/i;

const clean = (query) => query.trim();
const url = (path, params) => `${path}?${new URLSearchParams(params).toString()}`;

export function detectSearchIntent(query) {
  const value = clean(query);
  const upper = value.replace(/\s/g, "").toUpperCase();
  const lower = value.toLowerCase();
  if (REGISTRATION_RE.test(upper)) return { type: "registration", label: "N-Reg Lookup", value: upper };
  if (/^(s\/n|sn|serial)[:\s-]/i.test(value)) return { type: "serial", label: "S/N Check", value: value.replace(/^(s\/n|sn|serial)[:\s-]*/i, "") };
  if (/owner|registered to|owned by/.test(lower)) return { type: "owner", label: "Owner Check", value };
  if (/activity|flight|callsign|icao/.test(lower)) return { type: "activity", label: "Activity Check", value };
  if (/dealer|broker|seller/.test(lower)) return { type: "dealer", label: "Dealer Search", value };
  if (/engine|lycoming|continental|tbo|smoh/.test(lower)) return { type: "engine", label: "Engine Check", value };
  if (/cost|opex|calculator|operating/.test(lower)) return { type: "cost", label: "Cost Calculators", value };
  if (/report|full ati/.test(lower)) return { type: "report", label: "ATI Report", value };
  if (/score|ati/.test(lower)) return { type: "score", label: "ATI Score", value };
  return { type: "search", label: "Search Aircraft", value };
}

export function buildSearchActions(query) {
  const detected = detectSearchIntent(query);
  const q = detected.value || clean(query);
  const registration = detected.type === "registration" ? detected.value : q;
  const actions = [
    ["ATI Score", url("/ati-quick-score", { registration })], ["ATI Report", url("/ati-full-report", { registration })],
    ["N-Reg Lookup", url("/n-lookup", { registration })], ["S/N Check", url("/n-lookup", { serial: q, mode: "serial" })],
    ["Owner Check", url("/n-lookup", { owner: q, mode: "owner" })], ["Activity Check", url("/traffic", { registration: q })],
    ["Dealer", url("/service-intelligence", { query: q, category: "dealer" })], ["Engine", url("/opex-calculator", { engine_model: q })],
    ["Cost Calculators", url("/opex-calculator", { make: q })],
  ].map(([label, path]) => ({ label, path }));
  const primaryMap = { registration: 2, serial: 3, owner: 4, activity: 5, dealer: 6, engine: 7, cost: 8, report: 1, score: 0 };
  const primary = detected.type === "search" ? { label: "Search Aircraft", path: url("/listings", { search: q }) } : actions[primaryMap[detected.type]];
  return { detected, primary, actions };
}