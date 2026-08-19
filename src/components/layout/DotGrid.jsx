/**
 * DotGrid — global dot-grid overlay for the Core Platform aesthetic.
 * Fixed full-screen layer, pointer-events none, sits behind all content.
 * Subtle in dark mode, near-invisible in light mode.
 */
export default function DotGrid({ opacity = 1, size = 24 }) {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0"
      style={{
        backgroundImage:
          "radial-gradient(circle, var(--grid-color) 1px, transparent 1px)",
        backgroundSize: `${size}px ${size}px`,
        opacity,
      }}
    />
  );
}