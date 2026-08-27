import { useState } from "react";
import {
  Film, Clock, Plane, Radar, Scale, GitBranch, Handshake,
  ChevronDown, ChevronUp, Camera, Mic, MonitorPlay, Copy, Check,
} from "lucide-react";

const SHOTS = [
  {
    id: 1,
    section: "Opening",
    icon: Film,
    accent: "#D4A017",
    duration: "0:00 – 0:08",
    route: "/listings",
    screen: "Listings — hero grid",
    action: "Slow zoom-in on the Listings grid as ATI-scored cards populate. Gold accent pulses on a high-score card.",
    narration: "Welcome to ABOS MarketSpace — where every aircraft carries a trust score, and every deal begins with clarity.",
    transition: "Cross-dissolve to Deal Radar",
  },
  {
    id: 2,
    section: "Listings",
    icon: Plane,
    accent: "#D4A017",
    duration: "0:08 – 0:20",
    route: "/listings",
    screen: "Listings — filter & card detail",
    action: "Cursor moves to the ATI score badge on a listing card. Filter slider drags to 'ATI ≥ 80'. Grid refines live.",
    narration: "Every listing is scored across eight dimensions — documentation, maintenance, avionics, and more. Filter by score, and the market sharpens to your standard.",
    transition: "Swipe-right to Deal Radar",
  },
  {
    id: 3,
    section: "Deal Radar",
    icon: Radar,
    accent: "#14B8A6",
    duration: "0:20 – 0:32",
    route: "/deal-radar",
    screen: "Deal Radar — opportunity feed",
    action: "Deal Radar loads. A 'hot deal' card glows teal. Cursor hovers over the discount % badge — tooltip appears.",
    narration: "Deal Radar hunts below-market aircraft in real time. When a price drops 8% under true value, it lights up — and you move first.",
    transition: "Match-cut to Compare table",
  },
  {
    id: 4,
    section: "Compare",
    icon: Scale,
    accent: "#3B82F6",
    duration: "0:32 – 0:44",
    route: "/compare",
    screen: "Compare — three-aircraft table",
    action: "Three aircraft columns animate in left-to-right. Highlight row sweeps down the ATI score row, landing on the winner.",
    narration: "Line up three aircraft — specs, pricing, scores, ownership costs. No spreadsheets. Just the truth, side by side.",
    transition: "Morph into pipeline node graph",
  },
  {
    id: 5,
    section: "Sales Pipeline",
    icon: GitBranch,
    accent: "#8B5CF6",
    duration: "0:44 – 0:56",
    route: "/sales-pipeline",
    screen: "Sales Pipeline — spider graph",
    action: "Pipeline node chain draws left-to-right. An AI-driven step pulses purple. One-click 'Execute' button is pressed — step turns green.",
    narration: "From first contact to final handover — verification, valuation, inspection, documents. AI runs each step in a single click. Your deal never stalls.",
    transition: "Push-in to Escrow handshake",
  },
  {
    id: 6,
    section: "Escrow",
    icon: Handshake,
    accent: "#22C55E",
    duration: "0:56 – 1:08",
    route: "/escrow",
    screen: "Escrow — transaction status",
    action: "Escrow status stepper fills green left-to-right. Commission split waterfall animates. 'Funds released' confirmation toast appears.",
    narration: "When the deal is won, ABOS Escrow holds every cent securely — automated splits, finder's fees, full payout tracking. Both sides protected. Every transaction, transparent.",
    transition: "Fade to logo card",
  },
  {
    id: 7,
    section: "Closing",
    icon: Film,
    accent: "#D4A017",
    duration: "1:08 – 1:15",
    route: "/",
    screen: "Logo + tagline card",
    action: "ABOS MarketSpace logo centers on a dark gold-radial background. Tagline fades in underneath. 'Play Tour' button pulses.",
    narration: "ABOS MarketSpace. The market, scored. The deal, sealed.",
    transition: "End",
  },
];

const TOTAL_DURATION = "~1:15";
const FORMAT = "16:9 landscape, 1920×1080, 30fps";
const TONE = "Cinematic / marketing — bold, aspirational, trustworthy";
const MUSIC = "Low-tempo cinematic underscore, gold-warm pads, subtle riser on each transition";

function ShotRow({ shot, isLast }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const Icon = shot.icon;

  const copyNarration = () => {
    navigator.clipboard?.writeText(shot.narration);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <button onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-4 p-4 text-left transition hover:bg-muted/40">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{ background: `${shot.accent}1a`, border: `1px solid ${shot.accent}33` }}>
          <Icon className="h-5 w-5" style={{ color: shot.accent }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Shot {String(shot.id).padStart(2, "0")}
            </span>
            <span className="text-[10px] font-bold text-muted-foreground">·</span>
            <span className="text-[10px] font-bold" style={{ color: shot.accent }}>{shot.section}</span>
          </div>
          <h3 className="truncate text-sm font-black text-foreground">{shot.screen}</h3>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-mono font-bold text-muted-foreground">{shot.duration}</span>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="border-t border-border p-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                <Camera className="h-3 w-3" /> On-screen action
              </p>
              <p className="text-sm leading-relaxed text-foreground">{shot.action}</p>
            </div>
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                <Mic className="h-3 w-3" /> Narration
              </p>
              <p className="text-sm italic leading-relaxed text-foreground">"{shot.narration}"</p>
              <button onClick={copyNarration}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-border px-2 py-1 text-[10px] font-bold text-muted-foreground transition hover:text-foreground">
                {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 border-t border-border pt-3 text-xs">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <MonitorPlay className="h-3.5 w-3.5" /> Route: <code className="font-mono font-bold text-foreground">{shot.route}</code>
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Film className="h-3.5 w-3.5" /> Transition: <span className="font-bold text-foreground">{shot.transition}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WalkthroughScript() {
  return (
    <div className="min-h-screen px-4 py-8 text-foreground md:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ background: "linear-gradient(135deg,#D4A017,#A67C00)" }}>
            <Film className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#D4A017]">Production Guide</p>
            <h1 className="text-xl font-black tracking-tight md:text-2xl">Marketspace Walkthrough Script</h1>
          </div>
        </div>

        <p className="-mt-2 max-w-2xl text-sm text-muted-foreground">
          Shot-by-shot script and shot list for recording a cinematic Marketspace promo. Navigate to each route, perform the on-screen action, and read the narration over the suggested music bed.
        </p>

        {/* Production specs */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total runtime", value: TOTAL_DURATION, icon: Clock },
            { label: "Format", value: FORMAT, icon: MonitorPlay },
            { label: "Tone", value: TONE, icon: Mic },
            { label: "Music", value: MUSIC, icon: Film },
          ].map((spec) => {
            const Icon = spec.icon;
            return (
              <div key={spec.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <Icon className="mb-2 h-4 w-4 text-[#D4A017]" />
                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{spec.label}</p>
                <p className="mt-1 text-xs font-bold leading-snug text-foreground">{spec.value}</p>
              </div>
            );
          })}
        </div>

        {/* Shot list */}
        <div className="space-y-3">
          {SHOTS.map((shot, i) => (
            <ShotRow key={shot.id} shot={shot} isLast={i === SHOTS.length - 1} />
          ))}
        </div>

        {/* Footer note */}
        <div className="rounded-2xl border border-[#D4A017]/30 bg-[#D4A017]/[0.05] p-4">
          <p className="text-xs leading-relaxed text-muted-foreground">
            <span className="font-black text-[#A67C00]">Tip:</span> Record each route separately, then cut on the suggested transitions.
            Match screen actions to narration beats — let the cursor rest on the key value (ATI score, discount %, pipeline node) as each line lands.
          </p>
        </div>
      </div>
    </div>
  );
}