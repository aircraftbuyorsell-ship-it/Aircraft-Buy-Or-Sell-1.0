import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plug, ArrowRightLeft, ShieldCheck, Coins } from "lucide-react";
import ApiDocBlock from "@/components/integration/ApiDocBlock";
import PartnerTokenCard from "@/components/integration/PartnerTokenCard";
import FeedActivityTable from "@/components/integration/FeedActivityTable";
import ApprovedApiAccessGate from "@/components/access/ApprovedApiAccessGate";

const AMBER = "#f5c242";
const W1 = "rgba(255,255,255,0.90)";
const W2 = "rgba(255,255,255,0.60)";

const STEPS = [
  { icon: ShieldCheck, title: "1 · Get your token", text: "Generate a partner token below. It authenticates all API calls from your marketplace." },
  { icon: ArrowRightLeft, title: "2 · Push listing data", text: "Send your aircraft listings to the Intelligence Exchange endpoint — up to 25 per call." },
  { icon: Coins, title: "3 · Receive intelligence", text: "Each listing comes back enriched: FAA registry match, OMVM market value and a deal label you can display next to the listing." },
];

export default function IntegrationKit() {
  const { data: user } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  const endpoint = `${window.location.origin}/functions/intelExchange`;
  // Widget calls go through the Cloudflare Worker gateway, which injects the
  // x-gateway-secret the Base44 widgetGateway function requires. Calling
  // /functions/widgetGateway directly returns 401 once enforcement is enabled.
  const widgetEndpoint = "https://abos-widget-gateway.aircraftbuyorsell.workers.dev";

  const exchangeSnippet = `POST ${endpoint}
Content-Type: application/json

{
  "embed_token": "YOUR_PARTNER_TOKEN",
  "listings": [
    {
      "registration": "N12345",
      "make": "Cessna",
      "model": "172S",
      "year": 2005,
      "asking_price": 185000,
      "engine_hours": 900,
      "tbo": 2000,
      "source_url": "https://your-marketplace.com/listing/123"
    }
  ]
}

// Response — per listing:
// { "registration": "N12345",
//   "intelligence": {
//     "registry": { "matched": true, "status_code": "V", ... },
//     "valuation": { "omvm_value": 178000, "deal_label": "fair",
//                    "discount_pct": -3.9, "confidence": "HIGH" } } }`;

  const widgetSnippet = `POST ${widgetEndpoint}
Content-Type: application/json

{
  "embed_token": "YOUR_PARTNER_TOKEN",
  "action": "gcr",            // enrich | gcr | omvm | nego
  "payload": { "registration": "N12345" }
}

// Returns the full Triple-Check compliance report
// (registry validity + visual evidence + flight activity)
// ready to render next to your listing.`;

  return (
    <ApprovedApiAccessGate title="Integration Kit is approval-only" description="Partner tokens, Intelligence Exchange and Widget Gateway access are available only to approved ABOS API, developer and partner users.">
    <div className="px-4 sm:px-6 lg:px-10 py-6 max-w-[1100px] mx-auto min-h-screen" style={{ background: "transparent" }}>
      {/* Header */}
      <p className="text-[10px] uppercase tracking-[0.25em] font-black" style={{ color: AMBER }}>Platform · Integration</p>
      <div className="flex items-center gap-3 mt-1 mb-2">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(245,194,66,0.09)", border: "0.5px solid rgba(245,194,66,0.22)" }}>
          <Plug className="w-5 h-5" style={{ color: AMBER }} />
        </div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight uppercase" style={{ color: W1 }}>Integration Kit</h1>
      </div>
      <p className="text-sm max-w-2xl mb-6" style={{ color: W2 }}>
        Embed ABOS intelligence into your marketplace — ATI verification, market valuations and deal scoring —
        in exchange for your listing data. Data in, intelligence out.
      </p>

      {/* How it works */}
      <div className="grid md:grid-cols-3 gap-3 mb-6">
        {STEPS.map((s) => (
          <div key={s.title} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
            <s.icon className="w-5 h-5 mb-2" style={{ color: AMBER }} />
            <p className="text-sm font-bold mb-1" style={{ color: W1 }}>{s.title}</p>
            <p className="text-xs leading-relaxed" style={{ color: W2 }}>{s.text}</p>
          </div>
        ))}
      </div>

      {/* Token */}
      <div className="mb-6">
        <PartnerTokenCard user={user} />
      </div>

      {/* API docs */}
      <div className="space-y-4 mb-6">
        <ApiDocBlock
          title="Intelligence Exchange API"
          description="Push listing data, receive registry match + OMVM valuation + deal label per listing."
          code={exchangeSnippet}
        />
        <ApiDocBlock
          title="Widget Gateway API"
          description="On-demand intelligence actions for a single aircraft — compliance report, valuation, negotiation brief."
          code={widgetSnippet}
        />
      </div>

      {/* Activity */}
      <FeedActivityTable />
    </div>
    </ApprovedApiAccessGate>
  );
}