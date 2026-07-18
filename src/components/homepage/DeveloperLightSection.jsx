import { Link } from "react-router-dom";

const CAPABILITIES = "Aircraft Search · Identity · Listings · ATI · Valuation · Verification · Documents · Matching · Reports · Workflow Execution";

export default function DeveloperLightSection() {
  return (
    <section
      className="relative"
      style={{ background: "#fbfaf7", "--grid-dot-color": "rgba(0,0,0,0.045)", "--grid-opacity": 1 }}
    >
      <div className="homepage-grid-layer" style={{ backgroundSize: "36px 36px" }} aria-hidden="true" />
      <div className="relative mx-auto max-w-5xl px-5 py-20 sm:px-8 sm:py-28">
        <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-[0.24em] text-[#A67C00]">Platform & Developer Layer</p>
        <h2 className="mb-10 text-center text-2xl font-semibold tracking-tight text-foreground sm:text-4xl">Build aviation applications on ABOS</h2>

        <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-6 text-center shadow-sm sm:p-8">
          <h3 className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-foreground">ABOS Core API</h3>
          <p className="text-[11px] leading-relaxed text-muted-foreground">{CAPABILITIES}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2 text-[10px] font-semibold">
            {["JavaScript SDK", "Python SDK", "MCP Layer"].map((item) => (
              <span key={item} className="rounded-full border border-border bg-background px-3.5 py-1.5 text-muted-foreground">{item}</span>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/developers" className="rounded-lg bg-primary px-6 py-3 text-xs font-bold text-primary-foreground hover:opacity-90">View Developer Platform</Link>
          <Link to="/developers/core-api" className="rounded-lg border border-border bg-card px-6 py-3 text-xs font-semibold text-foreground hover:bg-muted">Read API Documentation</Link>
        </div>
      </div>
    </section>
  );
}