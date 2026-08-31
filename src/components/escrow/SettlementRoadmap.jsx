import { Handshake, CircleDollarSign, Link2 } from "lucide-react";

const stages = [
  { icon: Handshake, status: "Available Now", title: "Managed Deal Workflow", text: "Create transactions, define parties and fees, track inspections, and manage closing states with internal or Escrow.com options." },
  { icon: CircleDollarSign, status: "Pilot Ready", title: "Polygon USDC Monitoring", text: "The backend can create encrypted escrow wallets and verify native USDC balances on Polygon. User-facing funding and release remain in rollout." },
  { icon: Link2, status: "Planned Roadmap", title: "Production Polygon Vault", text: "Production on-chain document anchoring and APL-controlled settlement are planned. Current document anchoring is simulated and is not presented as live blockchain proof." },
];

export default function SettlementRoadmap() {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 text-card-foreground md:p-6">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">21st-Century Settlement</p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight">Secure aircraft transactions, without overstating the technology.</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">ABOS combines an operational deal workflow with a staged path toward Polygon USDC settlement and APL-based release conditions.</p>
      <div className="mt-6 grid gap-3 lg:grid-cols-3">
        {stages.map(({ icon: Icon, status, title, text }) => (
          <article key={title} className="rounded-xl border border-border bg-background p-4">
            <div className="flex items-center justify-between gap-2"><Icon className="h-5 w-5 text-primary" /><span className="rounded-full border border-border px-2 py-1 text-xs font-semibold text-muted-foreground">{status}</span></div>
            <h3 className="mt-4 text-base font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}