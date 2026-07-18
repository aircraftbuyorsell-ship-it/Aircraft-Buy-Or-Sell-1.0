import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import GridSignalNodes from "@/components/homepage/GridSignalNodes";
import GridConnectionLines from "@/components/homepage/GridConnectionLines";
import IntraZonePortalWindow from "@/components/homepage/IntraZonePortalWindow";

// Light → dark intelligence transition: #fbfaf7 → champagne → blue-gray → deep navy.
const NODES = [
  { top: "38%", left: "12%", color: "#F5C842", delay: 0 },
  { top: "46%", left: "82%", color: "#F5C842", delay: 0.8, desktopOnly: true },
  { top: "56%", left: "26%", color: "#63c7ed", delay: 1.4 },
  { top: "63%", left: "70%", color: "#49d7c6", delay: 0.4, desktopOnly: true },
  { top: "70%", left: "48%", color: "#63c7ed", delay: 2.0 },
  { top: "52%", left: "55%", color: "#F5C842", size: 4, delay: 1.1, desktopOnly: true },
];

const LINES = [
  { x1: 12, y1: 38, x2: 55, y2: 52, color: "#c8b06a", opacity: 0.35 },
  { x1: 55, y1: 52, x2: 82, y2: 46, color: "#c8b06a", opacity: 0.3 },
  { x1: 26, y1: 56, x2: 48, y2: 70, color: "#7f96b8", opacity: 0.4 },
  { x1: 48, y1: 70, x2: 70, y2: 63, color: "#7f96b8", opacity: 0.4 },
];

export default function DotGridTransition() {
  return (
    <section className="intelligence-transition relative overflow-hidden">
      <div className="homepage-grid-layer" aria-hidden="true" />
      <GridConnectionLines lines={LINES} />
      <GridSignalNodes nodes={NODES} />

      {/* Watermark intensifies as the section darkens */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-[8%] select-none text-center text-[16vw] font-black leading-none tracking-tighter text-[#F5C842] opacity-[0.05]"
        aria-hidden="true"
      >
        ABOS
      </div>

      <div className="relative mx-auto max-w-5xl px-5 pb-24 pt-28 sm:px-8 sm:pb-32 sm:pt-40">
        <div className="mb-16 text-center sm:mb-24">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.24em] text-[#A67C00]">Enter ABOS IntraZone</p>
          <h2 className="mx-auto mb-4 max-w-2xl text-2xl font-semibold tracking-tight text-[#1a1a1a] sm:text-4xl">
            Professional aircraft verification, intelligence and execution.
          </h2>
          <p className="mx-auto max-w-xl text-sm leading-relaxed text-[#4a4f58]">
            Every aircraft becomes a connected digital object combining identity, evidence, valuation, documents, workflow and transaction intelligence.
          </p>
          <Link to="/intrazone" className="mt-6 inline-flex items-center gap-2 rounded-lg border border-[#A67C00]/30 bg-white/60 px-5 py-2.5 text-xs font-bold text-[#A67C00] backdrop-blur hover:bg-white/80">
            Explore IntraZone <ArrowRight size={14} />
          </Link>
        </div>

        {/* Dark portal window — deeper than the surrounding gradient */}
        <IntraZonePortalWindow />
      </div>
    </section>
  );
}