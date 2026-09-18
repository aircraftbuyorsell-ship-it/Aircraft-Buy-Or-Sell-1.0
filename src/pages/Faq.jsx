import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQ = [
  {
    q: "What is the ATI score?",
    a: "The Aircraft Trust Index is a 0–120 score across 8 dimensions — documentation, technical condition, transparency, transaction readiness, usage/mission, storage exposure, configuration clarity and market readiness. Each dimension is worth up to 15 points. A score above 100 is EXCEPTIONAL; below 50 signals RED FLAGS or AVOID. When evidence is thin, the report returns INSUFFICIENT_DATA rather than a misleading number.",
  },
  {
    q: "Which registries do you cover?",
    a: "We federate FAA (US), EASA member states, UK CAA, Ireland IAA, Germany LBA, Czech CAA, Transport Canada, Australia CASA and 100+ smaller authorities. For US N-numbers we read the FAA registry directly. International registrations are resolved via ADS-BDB and official-registry research, then cached for speed.",
  },
  {
    q: "How fresh is the data?",
    a: "Registry identity is typically current to the latest published authority update (FAA updates nightly). ADS-B traffic is near-real-time when the aircraft is transmitting. Market comparables refresh as new listings appear. Every fact in the report carries a source timestamp so you can judge freshness yourself.",
  },
  {
    q: "What does the Data Integrity Shield do?",
    a: "When two independent sources disagree on a core identity field (ICAO hex, serial number, registration), the Shield flags the conflict, lists the disagreeing fields, and downgrades the data-confidence badge from 'verified' (3 agreeing sources) to 'caution' or 'unverified'. We never silently pick one source over another.",
  },
  {
    q: "Is my private evidence shared?",
    a: "No. Documents and listing text you upload are stored in your private ReportInputDraft and used only to refine your own report. They are never shown to other users, brokers, or the seller. You can delete a draft at any time.",
  },
  {
    q: "How much does a report cost?",
    a: "The base ATI report is €29 and the valuation-inclusive report is €49. One-time purchases, per aircraft. If you analyse aircraft regularly, report packs and subscription tiers reduce the per-report cost. See the Plans page for detail.",
  },
  {
    q: "What if no registry match exists?",
    a: "Some international registrations are not yet in our federated sources. In that case the lookup returns 'No connected registry match yet' — this is not a negative finding, just an absence of evidence. You can attach private evidence to build a report manually, or check the registration format and retry.",
  },
  {
    q: "Are you a broker or marketplace?",
    a: "No. ABOS is an intelligence layer. We do not broker aircraft, hold escrow, or take a commission on sales. Our only revenue is report sales and subscriptions, which keeps our incentives aligned with objective verification.",
  },
];

function Item({ q, a, open, onToggle }) {
  return (
    <div className="output-panel overflow-hidden">
      <button onClick={onToggle} className="flex w-full items-center justify-between gap-4 p-5 text-left">
        <span className="text-base font-bold">{q}</span>
        <ChevronDown className={`h-5 w-5 flex-none text-[var(--brand-primary)] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <p className="border-t border-[var(--brand-border)] px-5 pb-5 pt-4 text-sm leading-7 text-[var(--brand-muted-foreground)]">{a}</p>}
    </div>
  );
}

export default function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <div className="output-shell">
      <div className="mx-auto max-w-3xl px-5 py-14 md:px-8 md:py-20">
        <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(212,160,23,0.20)] bg-[rgba(212,160,23,0.06)] px-3 py-1.5 text-[10px] font-black uppercase tracking-[1.6px] text-[var(--brand-primary)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-primary)]" /> FAQ
        </span>
        <h1 className="mt-5 text-4xl font-bold tracking-tight md:text-6xl">Questions, answered.</h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[rgba(243,244,246,0.72)]">
          Everything about ATI reports, data sources, pricing and privacy.
        </p>

        <div className="mt-12 space-y-3">
          {FAQ.map((item, i) => (
            <Item key={item.q} q={item.q} a={item.a} open={open === i} onToggle={() => setOpen(open === i ? -1 : i)} />
          ))}
        </div>
      </div>
    </div>
  );
}