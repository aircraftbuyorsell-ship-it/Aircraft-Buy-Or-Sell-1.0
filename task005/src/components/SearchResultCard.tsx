import { useState } from "react";
import type { AircraftListing, Price } from "../contract.js";
import { sanitizePrimaryImageUrl } from "../image-policy.js";

export interface SearchResultCardProps {
  listing: AircraftListing;
  approvedImageHosts: readonly string[];
  onOpen?: (listing: AircraftListing) => void;
}

const formatPrice = (price: Price | null): string => {
  if (!price) return "Price unavailable";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: price.currency,
    maximumFractionDigits: 0,
  }).format(price.value);
};

const locationLabel = (listing: AircraftListing): string => {
  const parts = [listing.location?.city, listing.location?.region, listing.location?.country].filter(Boolean);
  return parts.length ? parts.join(", ") : "Location unavailable";
};

export function SearchResultCard({ listing, approvedImageHosts, onOpen }: SearchResultCardProps) {
  const aircraftName = [listing.aircraft.manufacturer, listing.aircraft.model].filter(Boolean).join(" ") || "Aircraft details unavailable";
  const intelligence = listing.intelligence;
  const sanitizedImageUrl = sanitizePrimaryImageUrl(listing.primary_image_url, approvedImageHosts);
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const imageUrl = sanitizedImageUrl === failedImageUrl ? null : sanitizedImageUrl;

  return (
    <article className="abos-result-card" aria-labelledby={`${listing.listing_id}-title`}>
      <div className="abos-result-card__media" aria-hidden="true">
        {imageUrl
          ? <img src={imageUrl} alt={aircraftName} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailedImageUrl(imageUrl)} />
          : <span>Aircraft image unavailable</span>}
      </div>
      <div className="abos-result-card__body">
        <div className="abos-result-card__identity">
          <div>
            <p className="abos-eyebrow">{listing.aircraft.year ?? "Year unavailable"}</p>
            <h2 id={`${listing.listing_id}-title`}>{aircraftName}</h2>
          </div>
          <span className="abos-status">{listing.status}</span>
        </div>
        <p className="abos-result-card__price">{formatPrice(listing.asking_price)}</p>
        <p className="abos-result-card__location">{locationLabel(listing)}</p>
        {listing.summary && <p className="abos-result-card__summary">{listing.summary}</p>}
        <section className="abos-intelligence" aria-label="Aircraft intelligence">
          <div className="abos-intelligence__heading">
            <strong>Aircraft intelligence</strong>
            <span>Fixture — not live</span>
          </div>
          <dl>
            <div><dt>ATI score</dt><dd>{intelligence.ati_score ?? "Unavailable"}</dd></div>
            <div><dt>Observed market value</dt><dd>{formatPrice(intelligence.observed_market_value)}</dd></div>
            <div><dt>Deal score</dt><dd>{intelligence.deal_score ?? "Unavailable"}</dd></div>
          </dl>
          {intelligence.limitations.length > 0 && (
            <details>
              <summary>Limitations</summary>
              <ul>{intelligence.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}</ul>
            </details>
          )}
        </section>
        {onOpen && <button className="abos-result-card__action" type="button" onClick={() => onOpen(listing)}>View listing</button>}
      </div>
    </article>
  );
}
