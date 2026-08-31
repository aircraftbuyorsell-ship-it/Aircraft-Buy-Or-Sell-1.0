import { scoreBand } from '../theme.js';
import { useTenantTheme } from '../TenantThemeProvider.jsx';

function formatPrice(price) {
  if (!price || typeof price.value !== 'number') return null;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: price.currency || 'USD',
      maximumFractionDigits: 0,
    }).format(price.value);
  } catch (_e) {
    return `${price.value} ${price.currency || 'USD'}`;
  }
}

/**
 * Compact aircraft intelligence summary for a tenant's listing page.
 *
 * Takes a listing in the ABOS Core API v1 shape (see _shared/listingMapper.mjs)
 * so what a tenant renders is exactly what the API documents.
 *
 * Every intelligence field is optional and renders as an explicit "—" when
 * absent: a listing ABOS hasn't scored must never be presented as though it
 * scored badly, and an unknown valuation must not read as $0.
 */
export function AircraftIntelligenceCard({ listing, onSelect, className = '' }) {
  useTenantTheme();
  if (!listing) return null;

  const { aircraft = {}, intelligence = {}, price } = listing;
  const title = [aircraft.year, aircraft.manufacturer, aircraft.model].filter(Boolean).join(' ') || 'Aircraft';
  const hasScore = Number.isFinite(Number(intelligence.ati_score));
  const band = hasScore ? scoreBand(intelligence.ati_score) : null;
  const formattedPrice = formatPrice(price);
  const omvm = Number.isFinite(Number(intelligence.omvm_value)) ? Number(intelligence.omvm_value) : null;

  const interactive = typeof onSelect === 'function';

  return (
    <article
      className={`p-5 flex flex-col gap-3 ${interactive ? 'cursor-pointer' : ''} ${className}`}
      style={{
        background: 'var(--abos-wl-surface)',
        border: '1px solid var(--abos-wl-border)',
        borderRadius: 'var(--abos-wl-radius)',
      }}
      onClick={interactive ? () => onSelect(listing) : undefined}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onSelect(listing);
              }
            }
          : undefined
      }
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold truncate" style={{ color: 'var(--abos-wl-text)' }}>
            {title}
          </h3>
          {listing.registration && (
            <p className="text-xs font-mono" style={{ color: 'var(--abos-wl-text-muted)' }}>
              {listing.registration}
            </p>
          )}
        </div>
        {hasScore ? (
          <span
            className="shrink-0 text-sm font-bold px-2.5 py-1 rounded-full"
            style={{ background: `${band.color}20`, color: band.color }}
            title={`ATI ${intelligence.ati_score}/100 — ${band.label}`}
          >
            {intelligence.ati_score}
          </span>
        ) : (
          <span
            className="shrink-0 text-xs px-2.5 py-1 rounded-full"
            style={{ background: 'var(--abos-wl-track)', color: 'var(--abos-wl-text-muted)' }}
            title="This aircraft has not been scored"
          >
            Not scored
          </span>
        )}
      </header>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs" style={{ color: 'var(--abos-wl-text-muted)' }}>Asking price</dt>
          <dd style={{ color: 'var(--abos-wl-text)' }}>{formattedPrice || '—'}</dd>
        </div>
        <div>
          <dt className="text-xs" style={{ color: 'var(--abos-wl-text-muted)' }}>ABOS market value</dt>
          <dd style={{ color: 'var(--abos-wl-text)' }}>
            {omvm !== null
              ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(omvm)
              : '—'}
          </dd>
        </div>
      </dl>

      {intelligence.deal_label && (
        <p className="text-xs" style={{ color: 'var(--abos-wl-text-muted)' }}>
          {intelligence.deal_label}
        </p>
      )}

      {listing.summary && (
        <p className="text-sm line-clamp-3" style={{ color: 'var(--abos-wl-text-muted)' }}>
          {listing.summary}
        </p>
      )}

      <footer className="text-[10px] uppercase tracking-wider pt-1" style={{ color: 'var(--abos-wl-text-muted)' }}>
        Intelligence by ABOS
      </footer>
    </article>
  );
}

export default AircraftIntelligenceCard;
