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
  // Nothing to show — hide the whole section instead of an empty shell
  if (!isLoading && listings.length === 0) return null;

  const action = actionTo ? (
    <Link
      to={actionTo}
      style={{
        fontSize: 12,
        color: "#D4A017",
        textDecoration: "none",
        display: "flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      {actionLabel} <ArrowRight size={14} />
    </Link>
  ) : null;

  return (
    <SectionShell eyebrow={eyebrow} title={title} action={action}>
      {listings.length > 0 ? (
        layout === "carousel" ? (
          <div
            style={{
              display: "flex",
              gap: 16,
              overflowX: "auto",
              paddingBottom: 16,
              scrollbarWidth: "none",
            }}
          >
            {listings.map((l) => (
              <div key={l.id} style={{ minWidth: 280, flexShrink: 0 }}>
                <ListingCard listing={l} />
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 16,
            }}
          >
            {listings.slice(0, 6).map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )
      ) : (
        <div
          style={{
            display: "flex",
            gap: 16,
            overflowX: "hidden",
            paddingBottom: 16,
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{ minWidth: 280, height: 300, flexShrink: 0 }}
              className="animate-pulse bg-muted border border-border rounded-xl"
            />
          ))}
        </div>
      )}
    </SectionShell>
  );
}