// Pulsing verification/signal nodes rendered inside a transition layer.
// nodes: [{ top, left, color, size, delay, desktopOnly }]
export default function GridSignalNodes({ nodes = [] }) {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {nodes.map((node, index) => (
        <span
          key={index}
          className={`grid-signal-node ${node.desktopOnly ? "node-desktop-only" : ""}`}
          style={{
            top: node.top,
            left: node.left,
            width: node.size || 6,
            height: node.size || 6,
            background: node.color || "#F5C842",
            boxShadow: `0 0 12px 2px ${node.color || "#F5C842"}55`,
            animationDelay: `${node.delay || 0}s`,
          }}
        />
      ))}
    </div>
  );
}