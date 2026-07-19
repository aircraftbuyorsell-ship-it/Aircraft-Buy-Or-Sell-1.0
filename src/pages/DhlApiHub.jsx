import { useState } from "react";
import DhlApiCard from "@/components/dhl/DhlApiCard";
import DhlTrackDemo from "@/components/dhl/DhlTrackDemo";
import { Package, Search, Globe2 } from "lucide-react";

const DHL_APIS = [
  {
    id: "shipment-tracking-unified",
    name: "DHL Shipment Tracking",
    description: "Access shipment status at any time for all DHL shipment types — eCommerce, Express, Freight, Letter, Parcel.",
    category: "Tracking",
    region: "Global",
    status: "live",
    features: ["Real-time status", "All shipment types", "Multi-shipment", "REST API"],
    docsUrl: "https://developer.dhl.com/api-reference/shipment-tracking",
  },
  {
    id: "location-finder-unified",
    name: "DHL Location Finder",
    description: "Discover all DHL locations handling parcels and letters — search by address, geo-coordinates, or location ID. New: driving distance for Sweden.",
    category: "Location",
    region: "Global",
    status: "premium",
    features: ["Address / geo search", "All networks worldwide", "Lockers & service points", "Service info & hours", "Driving distance (SE)"],
    docsUrl: "https://developer.dhl.com/api-reference/location-finder",
  },
  {
    id: "shipment-tracking-push",
    name: "DHL Shipment Tracking (Push)",
    description: "Push version of the Shipment Tracking Unified API — proactively sends shipment status updates via webhook.",
    category: "Tracking",
    region: "Global",
    status: "request_access",
    features: ["Webhook push", "Real-time updates", "All shipment types"],
    docsUrl: "https://developer.dhl.com/api-reference/shipment-tracking-push",
  },
  {
    id: "ecommerce-americas",
    name: "DHL eCommerce Americas API v4",
    description: "One-stop solution for shipping products, duty/tax calculation, label generation, manifesting, tracking, and return labels.",
    category: "Shipping",
    region: "United States",
    status: "request_access",
    features: ["Shipping products", "Duty & tax", "Label generation", "Manifesting", "Return labels"],
    docsUrl: "https://developer.dhl.com/api-reference/ecommerce-americas",
  },
  {
    id: "auth-api",
    name: "DHL Authentication API",
    description: "OAuth2 access token service for a set of DHL Group APIs. Required before calling authenticated DHL endpoints.",
    category: "Account",
    region: "Global",
    status: "request_access",
    features: ["OAuth2 token", "Client credentials", "Token refresh"],
    docsUrl: "https://developer.dhl.com/api-reference/authentication",
  },
  {
    id: "parcel-germany",
    name: "DHL Parcel Germany (Business)",
    description: "For business customers of Parcel Germany — create labels, manage shipments, and track parcels within Germany.",
    category: "Account",
    region: "Germany",
    status: "premium",
    features: ["Business labels", "Shipment management", "Parcel tracking"],
    docsUrl: "https://developer.dhl.com/api-reference/parcel-germany",
  },
  {
    id: "international-mail",
    name: "DHL International Mail",
    description: "Create labels for international mail, lightweight items, and merchandise for European business customers sending worldwide.",
    category: "Shipping",
    region: "Europe",
    status: "coming_soon",
    features: ["International labels", "Lightweight items", "Merchandise", "Worldwide delivery"],
    docsUrl: "https://developer.dhl.com/api-reference/international-mail",
  },
  {
    id: "dialogue-marketing-dispatch",
    name: "DHL Dialogue Marketing — Dispatch",
    description: "Calculate and optimize prices, create shipping documents, franking, place orders, and prepare dispatch in your software.",
    category: "Advertising",
    region: "Germany",
    status: "coming_soon",
    features: ["Price calculation", "Shipping documents", "Franking", "Order management"],
    docsUrl: "https://developer.dhl.com/api-reference/dialogue-marketing-dispatch",
  },
  {
    id: "dialogue-marketing-planning",
    name: "DHL Dialogue Marketing — Planning",
    description: "Plan new target groups, select target areas, get mailing options, and receive recipient data for dispatch preparation.",
    category: "Advertising",
    region: "Germany",
    status: "coming_soon",
    features: ["Target group planning", "Area selection", "Mailing options", "Recipient data"],
    docsUrl: "https://developer.dhl.com/api-reference/dialogue-marketing-planning",
  },
  {
    id: "pickup",
    name: "DHL Pickup",
    description: "Place free or chargeable pick-up orders, query agreed pickup locations, and query details and status of a pickup.",
    category: "Transportation",
    region: "Germany",
    status: "coming_soon",
    features: ["Pickup orders", "Location query", "Status tracking"],
    docsUrl: "https://developer.dhl.com/api-reference/pickup",
  },
  {
    id: "packstation-validation",
    name: "DHL Packstation Validation",
    description: "Validate postnumbers to ensure deliverability of shipments to the corresponding person at Packstation parcel lockers.",
    category: "Address",
    region: "Germany",
    status: "coming_soon",
    features: ["Postnumber validation", "Packstation deliverability"],
    docsUrl: "https://developer.dhl.com/api-reference/packstation-validation",
  },
  {
    id: "shipment-tracking-germany",
    name: "DHL Shipment Tracking (Germany)",
    description: "Private and business customers can query shipment status and history at any time. Early Access.",
    category: "Tracking",
    region: "Germany",
    status: "coming_soon",
    features: ["Status query", "History", "Private & business"],
    docsUrl: "https://developer.dhl.com/api-reference/shipment-tracking-germany",
  },
  {
    id: "ecommerce-uk",
    name: "DHL eCommerce UK",
    description: "eCommerce UK shipping and tracking — create domestic (UK) and international parcel shipments with UK pickup.",
    category: "Shipping",
    region: "United Kingdom",
    status: "coming_soon",
    features: ["Domestic & intl labels", "Product info", "Service information"],
    docsUrl: "https://developer.dhl.com/api-reference/ecommerce-uk",
  },
  {
    id: "ecommerce-americas-errors",
    name: "DHL eCommerce Americas — Error Reference",
    description: "List of possible error codes and detailed descriptions for error responses from the eCommerce Americas API.",
    category: "Information",
    region: "United States",
    status: "coming_soon",
    features: ["Error codes", "Error descriptions", "Debugging reference"],
    docsUrl: "https://developer.dhl.com/api-reference/ecommerce-americas-errors",
  },
  {
    id: "bluedart-location-finder",
    name: "Blue Dart Location Finder",
    description: "Information on locations serviced by Blue Dart, including available services. Query by pin code, product, or both.",
    category: "Information",
    region: "India",
    status: "coming_soon",
    features: ["Pin code lookup", "Service availability", "Product lookup"],
    docsUrl: "https://developer.dhl.com/api-reference/bluedart-location-finder",
  },
  {
    id: "express-api",
    name: "DHL Express API",
    description: "Rating, shipping, tracking & more for time-definite international shipments. Requires a DHL Express customer account.",
    category: "Shipping",
    region: "Global",
    status: "premium",
    features: ["Rating", "Shipping", "Tracking", "Pickup", "Additional services"],
    docsUrl: "https://developer.dhl.com/api-reference/express",
  },
  {
    id: "supply-chain-logistics",
    name: "DHL Supply Chain Logistics",
    description: "Access order information at any time for customer-centric contract logistics solutions. For DHL Supply Chain business customers.",
    category: "Tracking",
    region: "Global",
    status: "request_access",
    features: ["Order tracking", "Contract logistics", "Warehouse visibility"],
    docsUrl: "https://developer.dhl.com/api-reference/supply-chain",
  },
  {
    id: "parcel-eu",
    name: "DHL Parcel EU",
    description: "Create labels for domestic and international shipments. Requires a DHL Parcel EU entity customer account for selected EU countries.",
    category: "Shipping",
    region: "BE / LU / NL",
    status: "premium",
    features: ["Domestic & intl labels", "EU entity account", "Worldwide from EU"],
    docsUrl: "https://developer.dhl.com/api-reference/parcel-eu",
  },
  {
    id: "freight-rate-quote",
    name: "DHL Freight Rate Quote",
    description: "Get a price quote for planned road freight shipments. For existing DHL Freight business customers with a valid contract.",
    category: "Information",
    region: "Europe",
    status: "premium",
    features: ["Rate quotes", "Road freight", "Palletized cargo (>35kg)"],
    docsUrl: "https://developer.dhl.com/api-reference/freight-rate-quote",
  },
];

export default function DhlApiHub() {
  const [selectedApiId, setSelectedApiId] = useState("shipment-tracking-unified");

  const selectedApi = DHL_APIS.find((a) => a.id === selectedApiId);
  const liveApis = DHL_APIS.filter((a) => a.status === "live");
  const gatedApis = DHL_APIS.filter((a) => a.status !== "live");

  return (
    <div className="min-h-screen" style={{ background: "transparent", color: "rgba(255,255,255,0.90)" }}>
      {/* Header */}
      <div className="px-4 md:px-8 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(245,194,66,0.09)", border: "0.5px solid rgba(245,194,66,0.22)" }}>
            <Globe2 size={20} style={{ color: "#f5c242" }} />
          </div>
          <div>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(245,194,66,0.70)" }}>
              DHL Logistics API Hub
            </p>
            <h1 style={{ fontSize: "clamp(22px,3vw,32px)", fontWeight: 500, letterSpacing: "-0.04em", color: "rgba(255,255,255,0.90)", lineHeight: 1.06 }}>
              DHL API Suite
            </h1>
          </div>
        </div>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.60)", maxWidth: 640 }}>
          Unified access to DHL's global logistics network — shipment tracking, location finder, label creation,
          pickup ordering, and freight rate quoting across Parcel, Express, eCommerce, and Freight divisions.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 px-4 md:px-8 pb-10">
        {/* Sidebar */}
        <div className="lg:w-80 shrink-0 space-y-5">
          {/* Live */}
          <div>
            <p className="text-[9px] uppercase tracking-[0.12em] font-bold mb-2 px-1" style={{ color: "rgba(93,202,165,0.70)" }}>
              ◍ Live Now
            </p>
            <div className="space-y-2">
              {liveApis.map((api) => (
                <DhlApiCard key={api.id} api={api} isSelected={selectedApiId === api.id} onClick={() => setSelectedApiId(api.id)} />
              ))}
            </div>
          </div>

          {/* Gated */}
          <div>
            <p className="text-[9px] uppercase tracking-[0.12em] font-bold mb-2 px-1" style={{ color: "rgba(120,130,145,0.60)" }}>
              🔒 Premium & Coming Soon
            </p>
            <div className="space-y-2">
              {gatedApis.map((api) => (
                <DhlApiCard key={api.id} api={api} isSelected={selectedApiId === api.id} onClick={() => setSelectedApiId(api.id)} />
              ))}
            </div>
          </div>
        </div>

        {/* Detail panel */}
        <div className="flex-1 min-w-0">
          {selectedApi && (
            <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
              {/* Detail header */}
              <div className="p-5 md:p-6 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h2 className="text-lg font-bold mb-1" style={{ color: "rgba(255,255,255,0.90)" }}>{selectedApi.name}</h2>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.50)" }}>
                        {selectedApi.region}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.50)" }}>
                        {selectedApi.category}
                      </span>
                    </div>
                  </div>
                  {selectedApi.docsUrl && (
                    <a href={selectedApi.docsUrl} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-opacity hover:opacity-80 shrink-0"
                      style={{ background: "rgba(245,194,66,0.08)", border: "0.5px solid rgba(245,194,66,0.20)", color: "#f5c242" }}>
                      View Docs
                    </a>
                  )}
                </div>
                <p className="text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>{selectedApi.description}</p>
              </div>

              {/* Interactive demo */}
              <div className="p-5 md:p-6">
                {selectedApi.id === "shipment-tracking-unified" ? (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Search className="w-4 h-4" style={{ color: "#f5c242" }} />
                      <h3 className="text-sm font-bold" style={{ color: "rgba(255,255,255,0.90)" }}>Try It — Track a Shipment</h3>
                    </div>
                    <DhlTrackDemo />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                      style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.06)" }}>
                      <Package className="w-5 h-5" style={{ color: "rgba(255,255,255,0.30)" }} />
                    </div>
                    <p className="text-sm font-semibold mb-1" style={{ color: "rgba(255,255,255,0.60)" }}>
                      {selectedApi.status === "premium" ? "Premium API" : selectedApi.status === "request_access" ? "Request Access" : "Coming Soon"}
                    </p>
                    <p className="text-[11px] max-w-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                      {selectedApi.status === "premium"
                        ? "Requires a DHL business customer account. Add DHL_API_KEY to enable."
                        : selectedApi.status === "request_access"
                        ? "Requires onboarding and API key provisioning from DHL."
                        : "Integration in progress — check back soon."}
                    </p>
                  </div>
                )}

                {/* Feature highlights */}
                <div className="mt-6 pt-5" style={{ borderTop: "0.5px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-[9px] uppercase tracking-wider font-bold mb-2" style={{ color: "rgba(255,255,255,0.30)" }}>Capabilities</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedApi.features.map((f, i) => (
                      <span key={i} className="text-[11px] px-2.5 py-1 rounded-lg"
                        style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.55)", border: "0.5px solid rgba(255,255,255,0.06)" }}>
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}