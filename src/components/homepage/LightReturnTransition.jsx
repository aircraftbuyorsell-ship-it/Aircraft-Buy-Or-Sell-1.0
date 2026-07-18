import GridSignalNodes from "@/components/homepage/GridSignalNodes";
import GridConnectionLines from "@/components/homepage/GridConnectionLines";

// Dark → light return transition: deep navy → blue-gray → silver/champagne → #fbfaf7.
// Workflow lines dissolve into plain dots; gold highlights linger briefly as a bridge.
const NODES = [
  { top: "18%", left: "30%", color: "#60a5fa", size: 5, delay: 0.3 },
  { top: "26%", left: "68%", color: "#F5C842", size: 5, delay: 1.0, desktopOnly: true },
  { top: "44%", left: "45%", color: "#F5C842", size: 4, delay: 0.6 },
  { top: "58%", left: "22%", color: "#c8b06a", size: 4, delay: 1.6, desktopOnly: true },
  { top: "66%", left: "74%", color: "#c8b06a", size: 3, delay: 2.1 },
];

const LINES = [
  { x1: 30, y1: 18, x2: 68, y2: 26, color: "#7f96b8", opacity: 0.3 },
  { x1: 68, y1: 26, x2: 45, y2: 44, color: "#a9a08a", opacity: 0.22 },
  { x1: 45, y1: 44, x2: 22, y2: 58, color: "#a9a08a", opacity: 0.14 },
];

export default function LightReturnTransition() {
  return (
    <section className="light-return-transition relative min-h-[340px] overflow-hidden sm:min-h-[420px]">
      <div className="homepage-grid-layer" aria-hidden="true" />
      <GridConnectionLines lines={LINES} dissolve />
      <GridSignalNodes nodes={NODES} />
      <div className="relative mx-auto flex min-h-[340px] max-w-4xl items-center justify-center px-5 py-20 text-center sm:min-h-[420px] sm:px-8">
        <h2 className="text-xl font-semibold tracking-tight text-white/85 [text-shadow:0_1px_8px_rgba(0,0,0,0.35)] sm:text-3xl">
          One intelligence layer. Multiple interfaces.
        </h2>
      </div>
    </section>
  );
}