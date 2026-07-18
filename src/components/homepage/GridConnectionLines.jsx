// Thin data connection lines drawn as SVG inside a transition layer.
// lines: [{ x1, y1, x2, y2, color, opacity }] — coordinates in % of the viewBox (0–100).
export default function GridConnectionLines({ lines = [], dissolve = false }) {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {lines.map((line, index) => (
        <line
          key={index}
          x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
          stroke={line.color || "#8f9aab"}
          strokeWidth="0.14"
          strokeOpacity={line.opacity ?? 0.45}
          strokeDasharray={dissolve ? "0.6 2.2" : "2.5 1.5"}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}