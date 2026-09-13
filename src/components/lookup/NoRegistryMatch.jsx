import { AlertTriangle } from "lucide-react";

const AMBER = "#f5c242";

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

/**
 * Explains WHY a lookup returned nothing. A bare "no record found" leaves the
 * user unsure whether they mistyped or the aircraft genuinely isn't registered.
 */
export default function NoRegistryMatch({ message, registration }) {
  return (
    <div
      className="rounded-xl p-4 mb-6"
      style={{ background: "rgba(226,75,74,0.06)", border: "0.5px solid rgba(226,75,74,0.22)" }}
    >
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#e24b4a" }} />
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#e24b4a]">{message}</p>
          <p className="text-xs text-[rgba(255,255,255,0.55)] mt-1">
            That doesn&apos;t necessarily mean the aircraft doesn&apos;t exist. The most common reasons:
          </p>
        </div>
      </div>

      <ul className="mt-3 space-y-2.5">
        {REASONS.map((reason) => (
          <li key={reason.title} className="flex gap-2.5">
            <span
              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: AMBER }}
            />
            <div>
              <p className="text-xs font-bold text-[rgba(255,255,255,0.85)]">{reason.title}</p>
              <p className="text-[11px] leading-relaxed text-[rgba(255,255,255,0.5)]">{reason.body}</p>
            </div>
          </li>
        ))}
      </ul>

      {registration && (
        <p className="mt-3 text-[11px] text-[rgba(255,255,255,0.45)]">
          Searched as <span className="font-mono font-bold">{registration}</span>. Try the serial
          number or the registered owner name instead — both also resolve to an aircraft record.
        </p>
      )}
    </div>
  );
}