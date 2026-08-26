import { createContext, useContext, useMemo } from 'react';
import { resolveTenantTheme, themeToCssVariables } from './theme.js';

const TenantThemeContext = createContext(null);

/**
 * Provides tenant branding to the White-Label UI Kit.
 *
 * Tokens are applied to a scoped wrapper element rather than :root, so an
 * embedded ABOS widget can never bleed its branding into the host page's own
 * styles (or be broken by them).
 */
export function TenantThemeProvider({ tenant, children, className = '', style = {} }) {
  const theme = useMemo(() => resolveTenantTheme(tenant), [tenant]);
  const cssVars = useMemo(() => themeToCssVariables(theme), [theme]);

  return (
    <TenantThemeContext.Provider value={theme}>
      <div
        className={`abos-wl-root ${className}`}
        style={{
          ...cssVars,
          ...style,
          background: 'var(--abos-wl-background)',
          color: 'var(--abos-wl-text)',
          fontFamily: 'var(--abos-wl-font)',
        }}
      >
        {children}
      </div>
    </TenantThemeContext.Provider>
  );
}

/**
 * Returns the active tenant theme. Falls back to resolved defaults when used
 * outside a provider, so a component never crashes for want of branding.
 */
export function useTenantTheme() {
  const theme = useContext(TenantThemeContext);
  return theme || resolveTenantTheme({});
}

export default TenantThemeProvider;
