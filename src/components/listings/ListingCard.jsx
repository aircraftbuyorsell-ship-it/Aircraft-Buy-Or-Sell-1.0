import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, Plane } from "lucide-react";
import ComplianceBadge from "@/components/gcr/ComplianceBadge";
import ATICompactScore from "@/components/listings/ATICompactScore";

function DealPill({ score, label }) {
  if (!label) return null;
  const isHot = label === "hot deal";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${isHot ? "bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/30" : "bg-muted text-muted-foreground border-border"}`}>
      {score != null && <span className="mr-1 font-bold">{score}</span>}
      {label}
    </span>
  );
}

// Deal code badge — shared core ID (LST-XXXXXX) also used by the ATI Score and
// ATI Full Report for this same aircraft, so the three are trivially linkable.
function DealCodeBadge({ code }) {
  if (!code) return null;
  return (
    <span className="absolute top-2 left-2 font-mono text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded-full text-white"
      style={{ background: "rgba(10,8,30,0.72)", backdropFilter: "blur(2px)" }}>
      LST-{code}
    </span>
  );
}

export default function ListingCard({ listing: l, onClick, onOpen, intent }) {
  const navigate = useNavigate();
  // Listings can store uploaded media under several legacy/current fields.
  // Normalize the first usable image so an uploaded photo is always shown on the card.
  const photoCandidates = [
    l.photo_url,
    l.image_url,
    l.cover_image,
    ...(Array.isArray(l.image_attachments) ? l.image_attachments : []),
    ...(Array.isArray(l.images) ? l.images : []),
    ...(Array.isArray(l.photos) ? l.photos : []),
  ];
  const photo = photoCandidates
    .map((item) => (typeof item === "string" ? item : item?.url || item?.file_url || item?.src))
    .find((url) => typeof url === "string" && url.trim().length > 0);

  const engineHours = Number(l.engine_hours);
  const tbo = Number(l.tbo);
  const enginePct = tbo > 0 && Number.isFinite(engineHours)
    ? Math.max(0, Math.min(100, Math.round(((tbo - engineHours) / tbo) * 100)))
    : null;
  const detailPath = `/ati-passport/${l.id}`;
  const contextualAction = intent === "seller"
    ? { label: "Improve ATI profile", to: detailPath }
    : intent === "research"
    ? { label: "Compare market value", to: `/compare?listing=${l.id}` }
    : { label: "Review due diligence", to: detailPath };
  const discountPct = l.discount_pct != null
    ? Number(l.discount_pct)
    : l.omvm_value > 0 && l.asking_price != null
    ? Math.round(((l.omvm_value - l.asking_price) / l.omvm_value) * 100)
    : null;
  const openPassport = () => {
    onOpen?.(l);
    if (onClick) onClick(l);
    else navigate(detailPath);
  };

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={openPassport}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openPassport();
        }
      }}
      aria-label={`View ATI Passport for ${l.make || "aircraft"} ${l.model || ""}`.trim()}
      className="group rounded-xl border border-border bg-card p-4 flex flex-col gap-3 cursor-pointer transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="relative w-full rounded-lg overflow-hidden bg-muted" style={{ aspectRatio: "16/9" }}>
        {photo ? (
          <img
            src={photo}
            alt={`${l.make || "Aircraft"} ${l.model || ""}`.trim()}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              // Keep the card usable if a stale/deleted upload URL is encountered.
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <Plane className="w-8 h-8 text-muted-foreground/30" />
          </div>
        )}
        <DealCodeBadge code={l.deal_code} />
        {photo && (
          <span className="absolute bottom-1.5 right-1.5 text-[7px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full text-white"
            style={{ background: l.photo_source === "hf_generated" ? "rgba(148,163,184,0.85)" : "rgba(34,197,94,0.85)" }}>
            {l.photo_source === "hf_generated" ? "AI Render" : "Photo"}
          </span>
        )}
      </div>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-bold text-foreground">
            {[l.make, l.model].filter(Boolean).join(" ") || "Aircraft listing"}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {l.year && <span>{l.year} · </span>}
            <span className="font-mono font-semibold">{l.registration || "—"}</span>
          </p>
          <div className="mt-2"><ComplianceBadge registration={l.registration} /></div>
        </div>
        <ATICompactScore score={l.ati_score} />
      </div>

      <div className="rounded-lg border border-border bg-muted/40 p-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Asking price</p>
            <p className="mt-1 text-lg font-bold text-foreground">
              {l.asking_price != null ? `$${l.asking_price.toLocaleString()}` : "—"}
            </p>
          </div>
          <div className="border-l border-border pl-3">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">OMVM estimate</p>
            <p className="mt-1 text-lg font-bold text-primary">
              {l.omvm_value ? `$${l.omvm_value.toLocaleString()}` : "—"}
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
          {discountPct != null && (
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${discountPct > 0 ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : discountPct < 0 ? "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400" : "border-border bg-card text-muted-foreground"}`}>
              {discountPct > 0 ? `${Math.abs(discountPct)}% below OMVM` : discountPct < 0 ? `${Math.abs(discountPct)}% above OMVM` : "At OMVM"}
            </span>
          )}
          <DealPill score={l.deal_score} label={l.deal_label} />
        </div>
      </div>

      {l.engine_hours != null && (
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Engine Hrs</span>
            <span className="font-mono">
              {l.engine_hours} / {l.tbo ?? "—"} hrs
            </span>
          </div>
          {enginePct != null && (
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${enginePct > 50 ? "bg-emerald-500" : enginePct > 25 ? "bg-amber-500" : "bg-red-500"}`}
                style={{ width: `${enginePct}%` }}
              />
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-1 border-t border-border">
        {l.fresh_annual ? (
          <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Fresh annual
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/50">No fresh annual</span>
        )}
        <Link
          to={contextualAction.to}
          onClick={(event) => { event.stopPropagation(); onOpen?.(l); }}
          className="inline-flex min-h-11 items-center gap-1 text-xs font-bold text-navy no-underline hover:underline dark:text-primary"
        >
          {contextualAction.label} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}