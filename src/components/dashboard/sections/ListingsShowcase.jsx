import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import ListingCard from "@/components/listings/ListingCard";
import SectionShell from "./SectionShell";

export default function ListingsShowcase({
  listings = [],
  isLoading = false,
  eyebrow,
  title,
  layout = "grid",
  actionTo,
  actionLabel,
}) {
  if (!isLoading && listings.length === 0) return null;

  const action = actionTo ? (
    <Link to={actionTo} className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-4 py-2 text-[12px] font-bold text-primary no-underline transition-colors hover:bg-primary/20">
      {actionLabel} <ArrowRight size={14} />
    </Link>
  ) : null;

  return (
    <SectionShell eyebrow={eyebrow} title={title} action={action}>
      {listings.length > 0 ? (
        layout === "carousel" ? (
          <div className="flex gap-4 overflow-x-auto pb-4 [scrollbar-width:none]">
            {listings.map((l) => (
              <div key={l.id} className="min-w-[280px] flex-shrink-0">
                <ListingCard listing={l} />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.slice(0, 6).map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )
      ) : (
        <div className="flex gap-4 overflow-x-hidden pb-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="min-w-[280px] h-[300px] flex-shrink-0 rounded-xl bg-muted/40 border border-border animate-pulse" />
          ))}
        </div>
      )}
    </SectionShell>
  );
}