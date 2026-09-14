import { Info } from "lucide-react";

const REASONS = [
  {
    title: "Deregistered or re-registered aircraft",
    body: "The tail number may be historical — sold aircraft are often re-registered abroad or given a new marking, and the old number is removed from the active registry.",
  },
  {
    title: "Reserved but not yet assigned",
    body: "N-Numbers can be reserved before an aircraft is registered to them, so no aircraft record exists yet.",
  },
  {
    title: "Non-US registry",
    body: "Only US (N-) marks are in the FAA registry. For other countries enter the full marking with its dash, e.g. OK-ABC, D-EABC, G-ABCD.",
  },
  {
    title: "Typo or wrong format",
    body: "Check for a confused 0/O or 1/I, a missing suffix letter, or a serial number entered as a registration.",
  },
  {
    title: "Registry snapshot lag",
    body: "Our FAA mirror is refreshed periodically. A very recent registration may not appear until the next sync.",
  },
];

export default function NoRegistryMatch({ message, registration }) {
  return (
    <section role="status" className="rounded-xl border border-border bg-card text-card-foreground p-4 mb-6 break-words">
      <div className="flex items-start gap-2.5">
        <Info aria-hidden="true" className="w-5 h-5 shrink-0 mt-0.5 text-primary" />
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground">{message}</p>
          <p className="text-sm text-muted-foreground mt-1">This does not prove the aircraft does not exist. Possible explanations below are not confirmed findings for this aircraft.</p>
        </div>
      </div>
      <ul className="mt-3 space-y-2.5">
        {REASONS.map((reason) => (
          <li key={reason.title}>
            <p className="text-sm font-bold text-foreground">{reason.title}</p>
            <p className="text-sm text-muted-foreground">{reason.body}</p>
          </li>
        ))}
      </ul>
      {registration && <p className="mt-3 text-sm text-muted-foreground">Searched for <span className="font-mono font-bold text-foreground">{registration}</span>. Check the current marking with the seller, or try a serial-number or registered-owner search; a match is not guaranteed.</p>}
    </section>
  );
}