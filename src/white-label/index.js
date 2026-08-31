// ABOS White-Label UI Kit — public entry point.
//
// This is the surface a customer integrates against. Everything exported here
// is safe to import in browser code; note that createServerClient is exported
// too but throws if it actually runs in a browser (see client.js).

export {
  DEFAULT_THEME,
  SCORE_BANDS,
  normalizeHexColor,
  relativeLuminance,
  contrastRatio,
  readableTextColor,
  safeImageUrl,
  resolveTenantTheme,
  themeToCssVariables,
  scoreBand,
} from './theme.js';

export {
  AbosApiError,
  joinUrl,
  unwrapResponse,
  createBrowserClient,
  createServerClient,
} from './client.js';

export { TenantThemeProvider, useTenantTheme } from './TenantThemeProvider.jsx';
export { AtiScoreCard } from './components/AtiScoreCard.jsx';
export { AircraftIntelligenceCard } from './components/AircraftIntelligenceCard.jsx';
