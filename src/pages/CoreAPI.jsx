import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Terminal, FileJson, Loader2, Lock } from "lucide-react";
import ApiKeysPanel from "@/components/coreapi/ApiKeysPanel";
import EndpointDoc from "@/components/coreapi/EndpointDoc";
import TrustScoreApi from "@/components/coreapi/TrustScoreApi";
import AgentConnectInstructions from "@/components/coreapi/AgentConnectInstructions";
import ApprovedApiAccessGate from "@/components/access/ApprovedApiAccessGate";

/**
 * Full Core API reference — endpoint docs, the OpenAPI spec, and live API-key
 * management. This used to be what every anonymous visitor to /api saw by
 * default; it now requires a signed-in account (see ApiLanding.jsx, the new
 * public page at /api). Reachable from the Developer Portal once signed in,
 * or directly at /developers/core-api.
 */

const ENDPOINTS = [
  {
    endpoint: "search",
    scope: "search:read",
    description: "Chat-first natural language search. Send a free-form query — the Intelligence Engine parses intent (BUY/SELL/VALUE), manufacturer, model, budget and region, then returns matched listings ranked by ATI score.",
    request: `POST /functions/abosCoreApi
x-abos-key: abos_live_...

{
  "endpoint": "search",
  "params": {
    "query": "Citation Latitude under 8M USD in Europe"
  }
}`,
    response: `{
  "status": "success",
  "data": {
    "intent": { "intent": "BUY", "model": "Citation Latitude",
                "budget_max": 8000000 },
    "total_matches": 3,
    "matches": [ { "id": "…", "aircraft": {…},
      "price": { "value": 7400000, "currency": "USD" },
      "intelligence": { "ati_score": 94, "deal_label": "good deal" } } ]
  }
}`,
  },
  {
    endpoint: "valuate",
    scope: "intelligence:read",
    description: "OMVM market valuation. Returns an estimated fair market value with a confidence-scored range for any make/model/year/hours combination.",
    request: `{
  "endpoint": "valuate",
  "params": {
    "manufacturer": "Pilatus",
    "model": "PC-12 NGX",
    "year": 2021,
    "hours": 450
  }
}`,
    response: `{
  "status": "success",
  "data": {
    "estimated_value": 5200000,
    "range": { "min": 4900000, "max": 5500000 },
    "confidence": 0.87,
    "model_version": "omvm-llm-v1"
  }
}`,
  },
  {
    endpoint: "intelligence.extract",
    scope: "intelligence:read",
    description: "Free-text listing extraction — the foundation of the Facebook Connector. Converts an unstructured post ('2019 PC12 NGX 4.5M EUR Germany') into a structured aircraft object with confidence score.",
    request: `{
  "endpoint": "intelligence.extract",
  "params": {
    "text": "2019 PC12 NGX for sale, 4500000 EUR, Germany"
  }
}`,
    response: `{
  "status": "success",
  "data": {
    "intent": "SELL",
    "manufacturer": "Pilatus", "model": "PC-12 NGX",
    "year": 2019, "price": 4500000, "currency": "EUR",
    "location": "Germany", "confidence": 0.96
  }
}`,
  },
  {
    endpoint: "listings.list / listings.get",
    scope: "listing:read",
    description: "Structured marketplace access. Every listing carries a consistent `intelligence` block (ATI score, OMVM value, deal label) — the same contract the ChatGPT App and SDK will consume.",
    request: `{
  "endpoint": "listings.list",
  "params": {
    "manufacturer": "Cessna",
    "max_price": 200000,
    "limit": 20
  }
}`,
    response: `{
  "status": "success",
  "data": {
    "total": 14,
    "listings": [ { "id": "…",
      "aircraft": { "manufacturer": "Cessna", "model": "182T" },
      "intelligence": { "ati_score": 88, "omvm_value": 210000 } } ]
  }
}`,
  },
  {
    endpoint: "listings.create",
    scope: "listing:write",
    description: "Programmatic listing intake for connectors and partners. Listings arrive as drafts (private) and go through validation + AI enrichment before publishing.",
    request: `{
  "endpoint": "listings.create",
  "params": {
    "manufacturer": "Cessna",
    "model": "Citation XLS",
    "year": 2020, "price": 4500000, "currency": "USD"
  }
}`,
    response: `{
  "status": "success",
  "data": {
    "id": "…",
    "status": "draft",
    "note": "Listing created as draft."
  }
}`,
  },
];

function SignInGate({ navigateToLogin }) {
  return (
    <div className="min-h-screen px-4 sm:px-8 pt-10 pb-24 flex items-start justify-center" style={{ color: "#fff" }}>
      <div className="max-w-[520px] w-full mt-16 rounded-2xl p-8 text-center"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="w-11 h-11 mx-auto rounded-xl flex items-center justify-center mb-5"
          style={{ background: "rgba(245,194,66,0.09)", border: "0.5px solid rgba(245,194,66,0.22)" }}>
          <Lock size={18} style={{ color: "#f5c242" }} />
        </div>
        <h1 className="text-[20px] font-bold mb-2" style={{ color: "rgba(255,255,255,0.92)" }}>Sign in to view API documentation</h1>
        <p className="text-[13px] leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.55)" }}>
          Endpoint reference, the OpenAPI specification and API key management are available to
          signed-in accounts. Looking for pricing instead? See the{" "}
          <a href="/api" style={{ color: "#f5c242" }}>API overview</a>.
        </p>
        <button onClick={navigateToLogin}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[12px] font-bold uppercase tracking-wide"
          style={{ background: "#f5c242", color: "#04060a", border: "none", cursor: "pointer" }}>
          Sign in
        </button>
      </div>
    </div>
  );
}

export default function CoreAPI() {
  const { isAuthenticated, navigateToLogin } = useAuth();
  const [loadingSpec, setLoadingSpec] = useState(false);

  if (!isAuthenticated) {
    return <ApprovedApiAccessGate title="Sign in for approved API access" description="Core API documentation, OpenAPI specifications and API key management are available only to approved ABOS API, developer and partner users." />;
  }

  const openSpec = async () => {
    setLoadingSpec(true);
    try {
      const res = await base44.functions.invoke("abosOpenApiSpec", {});
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
      window.open(URL.createObjectURL(blob), "_blank");
    } finally {
      setLoadingSpec(false);
    }
  };

  return (
    <ApprovedApiAccessGate title="Core API access is approval-only" description="Your ABOS account must be approved for API, developer or partner access before endpoint documentation and API key management are available.">
    <div className="min-h-screen px-4 sm:px-8 pt-10 pb-24" style={{ color: "#fff" }}>
      <div className="max-w-[980px] mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5"
            style={{ background: "rgba(245,194,66,0.09)", border: "0.5px solid rgba(245,194,66,0.22)" }}>
            <Terminal size={12} style={{ color: "#f5c242" }} />
            <span className="text-[10px] font-bold tracking-[0.16em] uppercase" style={{ color: "#f5c242" }}>
              ABOS Core API · v1
            </span>
          </div>
          <h1 className="tracking-[-0.03em] leading-[1.06] mb-4" style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 500 }}>
            One API. <span style={{ color: "#f5c242", fontWeight: 700 }}>Every channel.</span>
          </h1>
          <p className="text-[14px] leading-relaxed max-w-[600px] mb-6" style={{ color: "rgba(255,255,255,0.60)" }}>
            The single contract behind the Web App, ChatGPT App, Facebook Connector and partner SDKs.
            Chat-first search, OMVM valuation, listing extraction and marketplace access — authenticated
            with scoped API keys.
          </p>
          <button onClick={openSpec} disabled={loadingSpec}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[12px] font-bold"
            style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.85)", cursor: "pointer" }}>
            {loadingSpec ? <Loader2 size={13} className="animate-spin" /> : <FileJson size={13} />}
            View OpenAPI Specification (JSON)
          </button>
        </div>

        <TrustScoreApi />

        {/* Agent connection */}
        <AgentConnectInstructions />

        {/* API keys */}
        <div className="mb-10">
          <ApiKeysPanel />
        </div>

        {/* Endpoint reference */}
        <h2 className="text-[16px] font-bold mb-4" style={{ color: "rgba(255,255,255,0.92)" }}>Endpoint Reference</h2>
        <div className="flex flex-col gap-4">
          {ENDPOINTS.map((e) => <EndpointDoc key={e.endpoint} {...e} />)}
        </div>
      </div>
    </div>
    </ApprovedApiAccessGate>
  );
}