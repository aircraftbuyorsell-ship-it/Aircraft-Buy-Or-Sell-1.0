import { useState, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Plane, Sparkles, X } from "lucide-react";
import ServiceFilterBar from "./ServiceFilterBar";
import ServiceCard from "./ServiceCard";
import ServiceDetailSheet from "./ServiceDetailSheet";

const GOLD = "#f5c242";
const MUTED = "rgba(255,255,255,0.60)";
const WHITE = "rgba(255,255,255,0.90)";

const PAGE_SIZE = 20;

export default function ServiceDirectory() {
  const [activeCat, setActiveCat] = useState("all");
  const [region, setRegion] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selected, setSelected] = useState(null);
  const [enriching, setEnriching] = useState(false);
  const [enrichResult, setEnrichResult] = useState(null);
  const [showThinBanner, setShowThinBanner] = useState(true);
  const queryClient = useQueryClient();

  // Current user for admin check
  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: () => base44.auth.me(),
    retry: false,
  });
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  // Load services from entity
  const { data: services = [], isLoading } = useQuery({
    queryKey: ["aviation-services-dir", isAdmin],
    queryFn: () =>
      base44.entities.AviationService.filter(
        isAdmin ? {} : { is_active: true },
        "-created_date",
        500
      ),
  });

  // Filter by category + region text
  const filtered = useMemo(() => {
    let result = services;
    if (activeCat !== "all") result = result.filter((s) => s.category === activeCat);
    if (region.trim()) {
      const q = region.toLowerCase();
      result = result.filter(
        (s) =>
          s.name?.toLowerCase().includes(q) ||
          s.city?.toLowerCase().includes(q) ||
          s.state?.toLowerCase().includes(q) ||
          s.country?.toLowerCase().includes(q) ||
          s.icao_code?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [services, activeCat, region]);

  // Category counts for pill badges
  const counts = useMemo(() => {
    const c = { all: services.length };
    for (const s of services) {
      c[s.category] = (c[s.category] || 0) + 1;
    }
    return c;
  }, [services]);

  // Reset pagination on filter change
  const onCatChange = (cat) => {
    setActiveCat(cat);
    setVisibleCount(PAGE_SIZE);
    setShowThinBanner(true);
  };

  const onRegionChange = (val) => {
    setRegion(val);
    setVisibleCount(PAGE_SIZE);
  };

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const isThin = filtered.length < 5 && !isLoading;

  // Enrich via Google Search
  const handleEnrich = useCallback(async () => {
    setEnriching(true);
    setEnrichResult(null);
    try {
      const res = await base44.functions.invoke("aviationServiceIntel", {
        action: "enrich_directory",
        category: activeCat !== "all" ? activeCat : undefined,
        region: region.trim() || undefined,
      });
      const data = res.data || res;
      setEnrichResult({
        count: data?.upserted_count || 0,
        region: data?.region_searched || region || "United States",
      });
      queryClient.invalidateQueries({ queryKey: ["aviation-services-dir"] });
    } catch (e) {
      console.error("Enrichment failed:", e);
      setEnrichResult({ error: e.message || "Enrichment failed" });
    } finally {
      setEnriching(false);
    }
  }, [activeCat, region, queryClient]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["aviation-services-dir"] });
  };

  return (
    <div className="space-y-4">
      <ServiceFilterBar
        activeCat={activeCat}
        setActiveCat={onCatChange}
        region={region}
        setRegion={onRegionChange}
        onEnrich={handleEnrich}
        enriching={enriching}
        isAdmin={isAdmin}
        counts={counts}
      />

      {/* Enrichment result toast */}
      {enrichResult && (
        <div
          className="rounded-xl p-3 flex items-center justify-between gap-3"
          style={{
            background: enrichResult.error
              ? "rgba(248,113,113,0.06)"
              : "rgba(93,202,165,0.06)",
            border: enrichResult.error
              ? "0.5px solid rgba(248,113,113,0.18)"
              : "0.5px solid rgba(93,202,165,0.18)",
          }}
        >
          <p style={{ fontSize: 12, color: enrichResult.error ? "#f87171" : "#5dcaa5", fontWeight: 500 }}>
            {enrichResult.error
              ? `Error: ${enrichResult.error}`
              : `✓ Enriched ${enrichResult.count} provider${enrichResult.count !== 1 ? "s" : ""} for ${enrichResult.region}. Pending admin review.`}
          </p>
          <button
            onClick={() => setEnrichResult(null)}
            style={{ background: "none", border: "none", color: MUTED, cursor: "pointer" }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Thin results suggestion */}
      {isThin && showThinBanner && (
        <div
          className="rounded-xl p-4 flex items-start justify-between gap-3"
          style={{
            background: "rgba(245,194,66,0.04)",
            border: "0.5px solid rgba(245,194,66,0.15)",
          }}
        >
          <div className="flex items-start gap-3">
            <Sparkles size={16} style={{ color: GOLD, flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: WHITE }}>
                Only {filtered.length} result{filtered.length !== 1 ? "s" : ""} found
                {activeCat !== "all" && ` for ${activeCat.replace(/_/g, " ")}`}
                {region.trim() && ` in ${region.trim()}`}
              </p>
              <p style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
                {isAdmin
                  ? "Click \"Enrich via Google\" to discover and import more providers."
                  : "Ask an admin to enrich this category via Google Search."}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowThinBanner(false)}
            style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", flexShrink: 0 }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div
            className="w-8 h-8 border-4 rounded-full animate-spin"
            style={{ borderColor: "rgba(245,194,66,0.20)", borderTopColor: "#f5c242" }}
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Plane size={32} style={{ color: "rgba(255,255,255,0.15)", margin: "0 auto 8px" }} />
          <p style={{ fontSize: 13, fontWeight: 600, color: WHITE }}>No services found</p>
          <p style={{ fontSize: 11, color: MUTED, marginTop: 4 }}>
            {isAdmin
              ? "Try enriching via Google Search to discover providers for this region."
              : "Try a different category or region."}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visible.map((s) => (
              <ServiceCard key={s.id} service={s} onClick={setSelected} />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="rounded-lg transition-all"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "0.5px solid rgba(255,255,255,0.08)",
                  color: MUTED,
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "10px 28px",
                  minHeight: 40,
                }}
              >
                Load more ({filtered.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </>
      )}

      {/* Detail bottom sheet */}
      <ServiceDetailSheet
        service={selected}
        onClose={() => setSelected(null)}
        isAdmin={isAdmin}
        onRefresh={refresh}
      />
    </div>
  );
}