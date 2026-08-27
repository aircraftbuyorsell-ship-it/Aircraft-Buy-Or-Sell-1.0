import { PLATFORMS } from '../../installer/lib/platform.mjs';

/**
 * Order the install wizard offers platforms in — most common first, with the
 * browser-only option last since it needs an extra warning.
 *
 * Kept out of the wizard component so it stays importable without React, and
 * so a test can pin that the UI offers every platform the installer supports.
 * A platform missing here is silently unreachable in the wizard.
 */
export const PLATFORM_ORDER = Object.freeze([
  PLATFORMS.NEXT_APP,
  PLATFORMS.NEXT_PAGES,
  PLATFORMS.REMIX,
  PLATFORMS.EXPRESS,
  PLATFORMS.CLOUDFLARE_WORKER,
  PLATFORMS.GENERIC_NODE,
  PLATFORMS.VITE_SPA,
]);
