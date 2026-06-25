import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import ListingCard from "@/components/listings/ListingCard";
import SectionShell from "./SectionShell";

export default function ListingsShowcase({
  listings = [],
  eyebrow,
  title,
  layout = "grid",
  actionTo,
  actionLabel,
}) {
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
            background: "#111827",
            border: "0.5px solid rgba(255,255,255,0.08)",
            borderRadius: 12,
            padding: 40,
            textAlign: "center",
            color: "rgba(255,255,255,0.3)",
            fontSize: 13,
          }}
        >
          Loading listings…
        </div>
      )}
    </SectionShell>
  );
}