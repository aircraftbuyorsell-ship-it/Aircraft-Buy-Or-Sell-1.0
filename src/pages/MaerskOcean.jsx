import { useState } from "react";
import {
  Ship, Container, Calendar, Anchor, MapPin, Radar, FileText,
  Truck, Boxes, Radio, Eye, Route, Globe2, Loader2, Lock, ArrowUpRight,
} from "lucide-react";
import MaerskApiCard from "@/components/maersk/MaerskApiCard";
import OceanTrackDemo from "@/components/maersk/OceanTrackDemo";

const MAERSK_APIS = [
  {
    id: "track-public",
    name: "Ocean Track & Trace (Public)",
    description: "Same ocean freight tracking data as Maersk.com — container and shipment milestones, no customer account required.",
    category: "Visibility & Tracking",
    status: "live",
    docsUrl: "https://developer.maersk.com/catalogue/ocean-track-and-trace-public",
    icon: Container,
    features: [
      "Container & shipment tracking milestones",
      "Public, neutralized data — no BL party affiliation",
      "Subscription-based with introductory free access",
      "RESTful API with consistent responses",
    ],
  },
  {
    id: "track-plus",
    name: "Track & Trace Plus",
    description: "Detailed tracking for Maersk Ocean shipments, including associated inland and rail transport legs.",
    category: "Visibility & Tracking",
    status: "request_access",
    docsUrl: "https://developer.maersk.com/catalogue/Track%20and%20Trace%20Plus",
    icon: Radar,
    features: ["Ocean + inland + rail legs", "EDI integration available", "Requires approval"],
  },
  {
    id: "booking",
    name: "EDP Booking (DCSA 2.0)",
    description: "Submit and manage ocean bookings based on the DCSA Booking Interface standard v2.0.",
    category: "Booking",
    status: "request_access",
    docsUrl: "https://developer.maersk.com/catalogue/EDP%20Booking",
    icon: FileText,
    features: ["DCSA standard v2.0", "Submit & manage bookings", "EDI integration available"],
  },
  {
    id: "schedules",
    name: "Ocean Commercial Schedules (DCSA)",
    description: "Retrieve vessel schedules, cargo routings and port schedules based on the DCSA Commercial Schedules standard.",
    category: "Planning",
    status: "premium",
    docsUrl: "https://developer.maersk.com/catalogue/ocean-commercial-schedules-dcsa",
    icon: Calendar,
    features: ["DCSA Commercial Schedules", "Vessel & port schedules", "Paid subscription required"],
  },
  {
    id: "nap-products",
    name: "Ocean NAP Products",
    description: "Premium Named Account Products with customized cargo routings and point-to-point schedules for Maersk customers.",
    category: "Booking",
    status: "premium",
    docsUrl: "https://developer.maersk.com/catalogue/ocean-nap-products",
    icon: Ship,
    features: ["Named Account customized products", "Point-to-point schedules", "Carrier Geo ID routing"],
  },
  {
    id: "captain-peter",
    name: "Captain Peter™ Reefer Data",
    description: "Retrieve Captain Peter reefer container data via webhook for refrigerated cargo monitoring.",
    category: "Visibility & Tracking",
    status: "premium",
    docsUrl: "https://developer.maersk.com/catalogue/captain-peter",
    icon: Radio,
    features: ["Reefer container telemetry", "Webhook delivery", "Paid subscription"],
  },
  {
    id: "booking-status-webhook",
    name: "Ocean Booking Status Webhook",
    description: "Receive status updates for your Maersk Ocean Bookings via pushed webhook events.",
    category: "Visibility & Tracking",
    status: "request_access",
    docsUrl: "https://developer.maersk.com/catalogue/ocean-booking-status-webhook",
    icon: Anchor,
    features: ["Real-time booking status", "Webhook delivery", "EDI integration available"],
  },
  {
    id: "track-private",
    name: "Track & Trace (Private)",
    description: "Ocean shipment tracking through pushed updates, available exclusively to Maersk Ocean Customers.",
    category: "Visibility & Tracking",
    status: "coming_soon",
    docsUrl: "https://developer.maersk.com/catalogue/track-and-trace-private",
    icon: Eye,
    features: ["Push-based tracking", "Maersk Ocean customers only", "Coming soon"],
  },
  {
    id: "visibility-studio",
    name: "Maersk Visibility Studio",
    description: "Unified, real-time shipment tracking and predictive insights for optimized, multi-carrier global supply chains.",
    category: "Visibility & Tracking",
    status: "request_access",
    docsUrl: "https://developer.maersk.com/catalogue/maersk-visibility-studio",
    icon: Route,
    features: ["Multi-carrier tracking", "Predictive insights", "Unified dashboard"],
  },
  {
    id: "mec-tracking",
    name: "MEC Last-Mile Tracking",
    description: "Comprehensive real-time tracking for e-commerce last-mile deliveries.",
    category: "Visibility & Tracking",
    status: "request_access",
    docsUrl: "https://developer.maersk.com/catalogue/mec-tracking",
    icon: Truck,
    features: ["E-commerce last-mile", "Real-time updates", "Requires approval"],
  },
];

export default function MaerskOcean() {
  const [activeApi, setActiveApi] = useState(MAERSK_APIS[0]);
  const [loading, setLoading] = useState(false);

  const handleSelect = (api) => {
    setLoading(true);
    setActiveApi(api);
    setTimeout(() => setLoading(false), 300);
  };

  const liveApis = MAERSK_APIS.filter((a) => a.status === "live");
  const gatedApis = MAERSK_APIS.filter((a) => a.status !== "live");

  return (
    <div className="min-h-screen" style={{ background: "transparent", color: "rgba(255,255,255,0.90)" }}>
      {/* Header */}
      <div className="px-4 md:px-8 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(0,163,235,0.09)", border: "0.5px solid rgba(0,163,235,0.22)" }}>
            <Globe2 size={20} style={{ color: "#00a3eb" }} />
          </div>
          <div>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(0,163,235,0.70)" }}>
              Maersk Ocean API Hub
            </p>
            <h1 style={{ fontSize: "clamp(22px,3vw,32px)", fontWeight: 500, letterSpacing: "-0.04em", color: "rgba(255,255,255,0.90)", lineHeight: 1.06 }}>
              Ocean Freight Intelligence
            </h1>
          </div>
        </div>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.60)", maxWidth: 640 }}>
          Track containers, search schedules, manage bookings, and access premium Maersk Ocean APIs —
          unified into the ABOS Cross-Border Bridge for end-to-end freight orchestration.
        </p>
      </div>

      <div className="px-4 md:px-8 pb-10 grid lg:grid-cols-[320px_1fr] gap-6">
        {/* Left: API catalogue */}
        <div className="space-y-4">
          {/* Live Now */}
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-[#5dcaa5] mb-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5dcaa5] animate-pulse" />
              Live Now
            </p>
            <div className="space-y-2">
              {liveApis.map((api) => (
                <MaerskApiCard
                  key={api.id}
                  api={api}
                  onSelect={handleSelect}
                  isActive={activeApi?.id === api.id}
                  loading={loading}
                />
              ))}
            </div>
          </div>

          {/* Coming Soon / Gated */}
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-white/30 mb-2 flex items-center gap-1.5">
              <Lock size={9} />
              Requires Access / Premium
            </p>
            <div className="space-y-2">
              {gatedApis.map((api) => (
                <MaerskApiCard key={api.id} api={api} />
              ))}
            </div>
          </div>
        </div>

        {/* Right: Active API panel */}
        <div>
          {activeApi && (
            <div className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
              {/* Panel header */}
              <div className="p-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "rgba(245,194,66,0.08)" }}>
                    <activeApi.icon size={16} className="text-[#f5c242]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-bold text-white/90">{activeApi.name}</h2>
                    <p className="text-[10px] uppercase tracking-wider text-white/30">{activeApi.category}</p>
                  </div>
                  {activeApi.docsUrl && (
                    <a
                      href={activeApi.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-colors hover:bg-white/5"
                      style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.60)" }}
                    >
                      <ArrowUpRight size={11} />
                      Docs
                    </a>
                  )}
                </div>
                <p className="text-[11px] text-white/50 leading-snug mt-2.5">{activeApi.description}</p>
              </div>

              {/* Panel body */}
              <div className="p-4">
                {activeApi.id === "track-public" && <OceanTrackDemo />}

                {activeApi.status !== "live" && (
                  <div className="text-center py-10 px-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                      style={{ background: "rgba(245,194,66,0.06)" }}>
                      <Lock size={20} className="text-[#f5c242]" />
                    </div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-[#f5c242] mb-1">
                      {activeApi.status === "premium" ? "Premium Subscription Required" : activeApi.status === "coming_soon" ? "Coming Soon" : "Access Approval Required"}
                    </p>
                    <p className="text-xs text-white/50 max-w-sm mx-auto mb-4">
                      {activeApi.status === "premium"
                        ? "This API requires a paid Maersk subscription. Contact Maersk to upgrade your plan."
                        : activeApi.status === "coming_soon"
                        ? "This API is not yet available. Express interest via the Maersk developer portal."
                        : "This API requires approval from Maersk. Request access through the developer portal."}
                    </p>
                    {activeApi.docsUrl && (
                      <a
                        href={activeApi.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-opacity hover:opacity-90"
                        style={{ background: "#f5c242", color: "#04060a" }}
                      >
                        <ArrowUpRight size={12} />
                        Request Access
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Feature list */}
          {activeApi?.features && activeApi.status === "live" && (
            <div className="mt-4 p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[10px] uppercase tracking-wider font-bold text-white/40 mb-2">Included Features</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {activeApi.features.map((f, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <span className="text-[#5dcaa5] mt-0.5">✓</span>
                    <span className="text-[11px] text-white/60">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}