import { ShieldCheck } from "lucide-react";

const AUTHORITIES = [
  { mark: "FAA", name: "Federal Aviation Administration", href: "https://www.faa.gov/" },
  { mark: "EASA", name: "European Union Aviation Safety Agency", href: "https://www.easa.europa.eu/" },
  { mark: "ICAO", name: "International Civil Aviation Organization", href: "https://www.icao.int/" },
];

export default function RegulatoryTrustStrip() {
  return (
    <section className="border-t border-[var(--brand-border)] pt-4" aria-label="Aviation standards references">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[var(--brand-footer-gold)]" aria-hidden="true" />
          {AUTHORITIES.map((authority) => (
            <a
              key={authority.mark}
              href={authority.href}
              target="_blank"
              rel="noreferrer"
              title={authority.name}
              aria-label={`${authority.name} official website`}
              className="inline-flex min-h-0 items-center rounded-md border border-[var(--brand-border)] bg-[var(--brand-surface)] px-3 py-1.5 font-mono text-xs font-bold text-[var(--brand-text)] transition-colors hover:border-[var(--brand-footer-gold)] hover:text-[var(--brand-footer-gold)]"
            >
              {authority.mark}
            </a>
          ))}
        </div>
        <p className="max-w-xl text-[10px] leading-relaxed text-[var(--brand-footer-muted)] sm:text-right">
          ABOS references public aviation data and standards from FAA, EASA, and ICAO. ABOS is independent and is not affiliated with, endorsed by, or certified by these authorities.
        </p>
      </div>
    </section>
  );
}