import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "@/lib/useTheme";
import { COLORS } from "@/theme/glassmorphism";

/**
 * iOS 26 (Liquid Glass) mobile shell — production port of the Claude Design
 * `ios-frame.jsx` prototype.
 *
 * Only the parts a real screen renders are ported: glass pill buttons, the
 * navigation bar with large title, and inset grouped lists. The prototype's
 * bezel, status bar, Dynamic Island, home indicator and keyboard are supplied
 * by the device itself, so they are replaced by safe-area insets here.
 *
 * Light values follow the iOS 26 UI kit; dark values use the ABOS ink scale.
 */

const FONT = '-apple-system, "SF Pro", system-ui, sans-serif';

function palette(isDark) {
  return isDark
    ? {
        text: COLORS.w1,
        muted: "rgba(255,255,255,0.6)",
        secondary: "rgba(235,235,245,0.6)",
        tertiary: "rgba(235,235,245,0.3)",
        separator: "rgba(84,84,88,0.65)",
        listBg: COLORS.ink1,
        pageBg: COLORS.ink,
        pillTint: "rgba(120,120,128,0.28)",
        pillShadow: "0 2px 6px rgba(0,0,0,0.35), 0 6px 16px rgba(0,0,0,0.2)",
        pillShine: "inset 1.5px 1.5px 1px rgba(255,255,255,0.15), inset -1px -1px 1px rgba(255,255,255,0.08)",
        pillBorder: "0.5px solid rgba(255,255,255,0.15)",
        pressed: "rgba(255,255,255,0.03)",
      }
    : {
        text: "#000",
        muted: "#404040",
        secondary: "rgba(60,60,67,0.6)",
        tertiary: "rgba(60,60,67,0.3)",
        separator: "rgba(60,60,67,0.12)",
        listBg: "#fff",
        pageBg: "#F2F2F7",
        pillTint: "rgba(255,255,255,0.5)",
        pillShadow: "0 1px 3px rgba(0,0,0,0.07), 0 3px 10px rgba(0,0,0,0.06)",
        pillShine: "inset 1.5px 1.5px 1px rgba(255,255,255,0.7), inset -1px -1px 1px rgba(255,255,255,0.4)",
        pillBorder: "0.5px solid rgba(0,0,0,0.06)",
        pressed: "rgba(0,0,0,0.04)",
      };
}

// ─────────────────────────────────────────────────────────────
// Liquid glass pill — blur + tint + shine
// ─────────────────────────────────────────────────────────────
export function IOSGlassPill({ children, onClick, ariaLabel, style = {} }) {
  const isDark = useTheme();
  const p = palette(isDark);
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      aria-label={ariaLabel}
      className="relative flex items-center justify-center overflow-hidden rounded-full transition-opacity active:opacity-70"
      style={{ height: 44, minWidth: 44, boxShadow: p.pillShadow, ...style }}
    >
      <span
        aria-hidden
        className="absolute inset-0 rounded-full"
        style={{
          backdropFilter: "blur(12px) saturate(180%)",
          WebkitBackdropFilter: "blur(12px) saturate(180%)",
          background: p.pillTint,
        }}
      />
      <span
        aria-hidden
        className="absolute inset-0 rounded-full"
        style={{ boxShadow: p.pillShine, border: p.pillBorder }}
      />
      <span className="relative z-[1] flex items-center" style={{ padding: "0 4px" }}>
        {children}
      </span>
    </Tag>
  );
}

function PillIcon({ children, onClick, ariaLabel }) {
  return (
    <IOSGlassPill onClick={onClick} ariaLabel={ariaLabel}>
      <span className="flex items-center justify-center" style={{ width: 36, height: 36 }}>
        {children}
      </span>
    </IOSGlassPill>
  );
}

// ─────────────────────────────────────────────────────────────
// Navigation bar — glass pills + large title
// ─────────────────────────────────────────────────────────────
/**
 * @param title       Large title (34/41 bold). Omit to render pills only.
 * @param onBack      Back handler. Defaults to history back; pass `false` to hide.
 * @param onMore      Trailing ellipsis handler. Omit to hide the pill.
 * @param trailing    Custom trailing node — replaces the ellipsis pill.
 */
export function IOSNavBar({ title, onBack, onMore, trailing }) {
  const isDark = useTheme();
  const navigate = useNavigate();
  const p = palette(isDark);
  const handleBack = onBack === undefined ? () => navigate(-1) : onBack;

  return (
    <header
      className="relative z-[5] flex flex-col"
      style={{
        gap: 10,
        paddingTop: "calc(env(safe-area-inset-top) + 8px)",
        paddingBottom: 10,
      }}
    >
      <div className="flex items-center justify-between" style={{ padding: "0 16px", minHeight: 44 }}>
        {handleBack ? (
          <PillIcon onClick={handleBack} ariaLabel="Back">
            <svg width="12" height="20" viewBox="0 0 12 20" fill="none" style={{ marginLeft: -1 }}>
              <path d="M10 2L2 10l8 8" stroke={p.muted} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </PillIcon>
        ) : (
          <span />
        )}
        {trailing ??
          (onMore && (
            <PillIcon onClick={onMore} ariaLabel="More">
              <svg width="22" height="6" viewBox="0 0 22 6">
                <circle cx="3" cy="3" r="2.5" fill={p.muted} />
                <circle cx="11" cy="3" r="2.5" fill={p.muted} />
                <circle cx="19" cy="3" r="2.5" fill={p.muted} />
              </svg>
            </PillIcon>
          ))}
      </div>
      {title !== undefined && (
        <h1
          style={{
            padding: "0 16px",
            fontFamily: FONT,
            fontSize: 34,
            fontWeight: 700,
            lineHeight: "41px",
            letterSpacing: 0.4,
            color: p.text,
            margin: 0,
          }}
        >
          {title}
        </h1>
      )}
    </header>
  );
}

// ─────────────────────────────────────────────────────────────
// Grouped list (inset card, r:26) + row (52px)
// ─────────────────────────────────────────────────────────────
/**
 * @param icon     A CSS color (renders the 30×30 r7 swatch) or a React node.
 * @param to       Router path — renders the row as a <Link>.
 * @param onClick  Click handler — renders the row as a <button>.
 */
export function IOSListRow({ title, detail, icon, to, onClick, chevron = true, isLast = false }) {
  const isDark = useTheme();
  const p = palette(isDark);
  const hasIcon = icon !== undefined && icon !== null;

  const body = (
    <>
      {hasIcon && (
        <span
          className="flex shrink-0 items-center justify-center overflow-hidden"
          style={{
            width: 30,
            height: 30,
            borderRadius: 7,
            marginRight: 12,
            background: typeof icon === "string" ? icon : undefined,
          }}
        >
          {typeof icon === "string" ? null : icon}
        </span>
      )}
      <span className="flex-1 text-left" style={{ color: p.text }}>
        {title}
      </span>
      {detail && <span style={{ color: p.secondary, marginRight: 6 }}>{detail}</span>}
      {chevron && (
        <svg width="8" height="14" viewBox="0 0 8 14" className="shrink-0" aria-hidden>
          <path d="M1 1l6 6-6 6" stroke={p.tertiary} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {!isLast && (
        <span
          aria-hidden
          className="absolute bottom-0 right-0"
          style={{ left: hasIcon ? 58 : 16, height: 0.5, background: p.separator }}
        />
      )}
    </>
  );

  const className = "relative flex w-full items-center transition-colors";
  const style = {
    minHeight: 52,
    padding: "0 16px",
    fontFamily: FONT,
    fontSize: 17,
    letterSpacing: -0.43,
  };
  const pressHandlers = {
    onPointerDown: (e) => (e.currentTarget.style.background = p.pressed),
    onPointerUp: (e) => (e.currentTarget.style.background = ""),
    onPointerLeave: (e) => (e.currentTarget.style.background = ""),
  };

  if (to) {
    return (
      <Link to={to} className={className} style={style} {...pressHandlers}>
        {body}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className} style={style} {...pressHandlers}>
        {body}
      </button>
    );
  }
  return (
    <div className={className} style={style}>
      {body}
    </div>
  );
}

export function IOSList({ header, children }) {
  const isDark = useTheme();
  const p = palette(isDark);
  return (
    <section>
      {header && (
        <div
          style={{
            fontFamily: FONT,
            fontSize: 13,
            color: p.secondary,
            textTransform: "uppercase",
            padding: "8px 36px 6px",
            letterSpacing: -0.08,
          }}
        >
          {header}
        </div>
      )}
      <div className="overflow-hidden" style={{ background: p.listBg, borderRadius: 26, margin: "0 16px" }}>
        {children}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Screen — page background, nav bar, safe-area bottom inset
// ─────────────────────────────────────────────────────────────
/**
 * Full-height mobile screen. Replaces the prototype's `IOSDevice` wrapper:
 * same props for the nav bar, but the OS provides the chrome.
 */
export function IOSScreen({ title, onBack, onMore, trailing, children, className = "" }) {
  const isDark = useTheme();
  const p = palette(isDark);
  return (
    <div
      className={`min-h-[100dvh] flex flex-col ${className}`}
      style={{ background: p.pageBg, fontFamily: FONT, WebkitFontSmoothing: "antialiased" }}
    >
      {(title !== undefined || onBack !== false || onMore || trailing) && (
        <IOSNavBar title={title} onBack={onBack} onMore={onMore} trailing={trailing} />
      )}
      <div className="flex-1 safe-bottom">{children}</div>
    </div>
  );
}
