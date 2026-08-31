import { scoreBand } from '../theme.js';
import { useTenantTheme } from '../TenantThemeProvider.jsx';

const SIZE = 180;
const STROKE = 14;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

/**
 * Tenant-brandable ATI score ring.
 *
 * Adapted from src/components/ati/ATIScoreRing.jsx, which is hardcoded to
 * ABOS's own dark palette. The difference that matters: surfaces and type here
 * come from tenant tokens, but the SCORE BAND COLOR DOES NOT — a score's
 * meaning must read identically in every deployment, so a tenant can't recolor
 * "Poor" to green. See SCORE_BANDS in ../theme.js.
 *
 * Renders an explicit attribution line: white-labelling covers presentation,
 * not provenance — the buyer of an aircraft is entitled to know whose
 * assessment they're reading.
 */
export function AtiScoreCard({ score, registration, attribution = 'Powered by ABOS ATI', className = '' }) {
  const theme = useTenantTheme();
  const numeric = Number(score);
  const hasScore = Number.isFinite(numeric);
  const pct = hasScore ? Math.min(100, Math.max(0, numeric)) : 0;
  const band = scoreBand(pct);
  const dash = (pct / 100) * CIRC;

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 p-6 ${className}`}
      style={{
        background: 'var(--abos-wl-surface)',
        border: '1px solid var(--abos-wl-border)',
        borderRadius: 'var(--abos-wl-radius)',
      }}
    >
      <p
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: 'var(--abos-wl-text-muted)' }}
      >
        ATI Total Score
      </p>

      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg
          width={SIZE}
          height={SIZE}
          className="-rotate-90"
          role="img"
          aria-label={hasScore ? `ATI score ${pct} out of 100, rated ${band.label}` : 'ATI score not available'}
        >
          <circle
            cx={SIZE / 2} cy={SIZE / 2} r={R}
            fill="none" stroke="var(--abos-wl-track)" strokeWidth={STROKE}
          />
          {hasScore && (
            <circle
              cx={SIZE / 2} cy={SIZE / 2} r={R}
              fill="none" stroke={band.color} strokeWidth={STROKE}
              strokeDasharray={`${dash} ${CIRC}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.8s ease' }}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {/* An absent score renders as an explicit em dash, never as 0 — a
              missing assessment must not look like a terrible one. */}
          <span className="text-5xl font-black" style={{ color: 'var(--abos-wl-text)' }}>
            {hasScore ? pct : '—'}
          </span>
          <span className="text-xs mt-1" style={{ color: 'var(--abos-wl-text-muted)' }}>
            {hasScore ? '/ 100' : 'not scored'}
          </span>
        </div>
      </div>

      {hasScore && (
        <span
          className="text-sm font-semibold px-3 py-1 rounded-full"
          style={{ background: `${band.color}20`, color: band.color }}
        >
          {band.label}
        </span>
      )}

      {registration && (
        <span className="text-xs font-mono" style={{ color: 'var(--abos-wl-text-muted)' }}>
          {registration}
        </span>
      )}

      {attribution && (
        <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--abos-wl-text-muted)' }}>
          {attribution}
        </span>
      )}
    </div>
  );
}

export default AtiScoreCard;
