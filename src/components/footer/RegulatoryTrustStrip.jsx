import { Database, Scale, ShieldCheck } from "lucide-react";

const DATA_PORTALS = [
  { mark: "FAA", name: "FAA regulations and Airworthiness Directives", href: "https://www.faa.gov/regulations_policies/airworthiness_directives" },
  { mark: "EASA", name: "EASA Safety Publications and Airworthiness Directives", href: "https://ad.easa.europa.eu/" },
  { mark: "ICAO", name: "International Civil Aviation Organization", href: "https://www.icao.int/" },
  { mark: "NTSB", name: "NTSB aviation safety data", href: "https://www.ntsb.gov/safety/data/Pages/Data_Stats.aspx" },
  { mark: "OpenSky", name: "The OpenSky Network", href: "https://opensky-network.org/" },
  { mark: "ADSBdb", name: "ADSBdb aircraft and route data", href: "https://www.adsbdb.com/" },
  { mark: "ADSB.lol", name: "ADSB.lol open flight data", href: "https://adsb.lol/" },
];

const LEGAL_PORTALS = [
  { mark: "EU AI Act", name: "Regulation (EU) 2024/1689 — Artificial Intelligence Act", href: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj" },
  { mark: "EU DSA", name: "Regulation (EU) 2022/2065 — Digital Services Act", href: "https://eur-lex.europa.eu/eli/reg/2022/2065/oj" },
  { mark: "EUR-Lex", name: "Official European Union law portal", href: "https://eur-lex.europa.eu/" },
];

function PortalGroup({ icon: Icon, title, portals }) {
  return <div><p className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase text-[var(--brand-footer-gold)]"><Icon className="h-4 w-4" aria-hidden="true"/>{title}</p><div className="flex flex-wrap gap-2">{portals.map(portal=><a key={portal.mark} href={portal.href} target="_blank" rel="noopener noreferrer" title={portal.name} aria-label={`${portal.name} official portal`} className="inline-flex min-h-0 items-center rounded-md border border-[var(--brand-border)] bg-[var(--brand-surface)] px-3 py-1.5 font-mono text-xs font-bold text-[var(--brand-text)] transition-colors hover:border-[var(--brand-footer-gold)] hover:text-[var(--brand-footer-gold)]">{portal.mark}</a>)}</div></div>;
}

export default function RegulatoryTrustStrip() {
  return <section className="border-t border-[var(--brand-border)] pt-5" aria-label="Official data and regulatory references">
    <div className="grid gap-5 lg:grid-cols-[1.4fr_.8fr]"><PortalGroup icon={Database} title="Official data & safety references" portals={DATA_PORTALS}/><PortalGroup icon={Scale} title="Digital & AI legislation" portals={LEGAL_PORTALS}/></div>
    <div className="mt-5 flex items-start gap-2 border-t border-[var(--brand-border)] pt-4"><ShieldCheck className="mt-0.5 h-4 w-4 flex-none text-[var(--brand-footer-gold)]"/><p className="text-[10px] leading-relaxed text-[var(--brand-footer-muted)]">ABOS combines information from public and licensed sources through APIs. Source availability, scope and update timing vary. References do not imply affiliation, endorsement or certification. ABOS reports are informational tools—not airworthiness determinations, legal advice or a substitute for qualified professional inspection.</p></div>
  </section>;
}