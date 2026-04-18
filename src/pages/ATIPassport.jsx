import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useState } from "react";
import { useParams } from "react-router-dom";
import ATIScoreRing from "@/components/ati/ATIScoreRing";
import ATIDimensions from "@/components/ati/ATIDimensions";
import ATIValuation from "@/components/ati/ATIValuation";
import ATIInsights from "@/components/ati/ATIInsights";
import { Skeleton } from "@/components/ui/skeleton";
import { Cpu, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function ATIPassport() {
  const { listingId } = useParams();
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  const { data: listing, isLoading: loadingListing } = useQuery({
    queryKey: ["listing", listingId],
    queryFn: () => base44.entities.AircraftListing.get(listingId),
    enabled: !!listingId,
  });

  const { data: passport, isLoading: loadingPassport } = useQuery({
    queryKey: ["passport", listingId],
    queryFn: async () => {
      const all = await base44.entities.ATIPassport.filter({ listing: listingId }, "-created_date", 1);
      return all[0] || null;
    },
    enabled: !!listingId,
  });

  const isLoading = loadingListing || loadingPassport;

  const handleGenerate = async () => {
    if (!listing) return;
    setGenerating(true);
    setError(null);
    try {
      const prompt = `Si ATI scoring engine pro ABOS platformu. Ohodnoť toto letadlo na 4 dimenzích (0-100):
- technical: stav draku, motor hours vs TBO, maintenance
- documentation: kompletnost logů, annual currency
- transparency: úplnost informací v inzerátu
- transaction_ready: připravenost k transakci

Data letadla: ${JSON.stringify(listing)}

Vrať POUZE JSON:
{
  "technical": number,
  "documentation": number,
  "transparency": number,
  "transaction_ready": number,
  "ai_summary": "string",
  "strengths": ["string", "string", "string"],
  "risks": ["string", "string"],
  "recommendations": ["string", "string", "string"]
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            technical: { type: "number" },
            documentation: { type: "number" },
            transparency: { type: "number" },
            transaction_ready: { type: "number" },
            ai_summary: { type: "string" },
            strengths: { type: "array", items: { type: "string" } },
            risks: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } },
          },
        },
      });

      const aiData = result;

      const ati_total =
        Math.round(
          (aiData.technical * 0.3 +
            aiData.documentation * 0.25 +
            aiData.transparency * 0.25 +
            aiData.transaction_ready * 0.2) *
            10
        ) / 10;

      const tbo = listing.tbo || 2000;
      const engineAdj = (tbo - (listing.engine_hours || 0)) * 12;
      const avionicsAdj = (listing.avionics?.split(",").length || 0) * 4500;
      const maintAdj = listing.fresh_annual ? 6000 : 0;
      const omvm_value = Math.round(200000 + engineAdj + avionicsAdj + maintAdj);

      const discountPct =
        ((omvm_value - (listing.asking_price || 0)) / omvm_value) * 100;
      const deal_score =
        discountPct > 25
          ? 9.5
          : discountPct > 15
          ? 8.5
          : discountPct > 8
          ? 7.5
          : discountPct > 2
          ? 6.5
          : discountPct < -15
          ? 2.5
          : discountPct < -5
          ? 4.0
          : 5.0;
      const deal_label =
        deal_score >= 8.5
          ? "hot deal"
          : deal_score >= 6.5
          ? "good deal"
          : deal_score >= 5
          ? "fair"
          : "overpriced";

      await base44.entities.ATIPassport.create({
        listing: listingId,
        ati_total,
        technical: aiData.technical,
        documentation: aiData.documentation,
        transparency: aiData.transparency,
        transaction_ready: aiData.transaction_ready,
        ai_summary: aiData.ai_summary,
        strengths: aiData.strengths.join("\n"),
        risks: aiData.risks.join("\n"),
        recommendations: aiData.recommendations.join("\n"),
        omvm_value,
        deal_score,
        deal_label,
        discount_pct: Math.round(discountPct * 10) / 10,
        ati_version: "v2",
      });

      await base44.entities.AircraftListing.update(listingId, {
        ati_score: ati_total,
        omvm_value,
        deal_score,
        deal_label,
        discount_pct: Math.round(discountPct * 10) / 10,
      });

      queryClient.invalidateQueries({ queryKey: ["passport", listingId] });
      queryClient.invalidateQueries({ queryKey: ["listing", listingId] });
    } catch (e) {
      setError(e.message || "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800 px-6 py-4 flex items-center gap-4">
        <Link to="/listings" className="text-slate-500 hover:text-slate-300 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          {isLoading ? (
            <Skeleton className="h-5 w-48 bg-slate-700" />
          ) : (
            <h1 className="text-lg font-bold text-white">
              ATI Passport — {listing?.make} {listing?.model}
              {listing?.registration && (
                <span className="ml-2 text-slate-400 font-mono text-sm">{listing.registration}</span>
              )}
            </h1>
          )}
          <p className="text-slate-500 text-xs mt-0.5">Aircraft Transparency Index · v2</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {isLoading ? (
          <LoadingSkeleton />
        ) : !passport ? (
          <EmptyState onGenerate={handleGenerate} generating={generating} error={error} listing={listing} />
        ) : (
          <PassportView passport={passport} listing={listing} />
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex gap-6">
        <Skeleton className="w-48 h-48 rounded-full bg-slate-800" />
        <div className="flex-1 space-y-3 pt-4">
          <Skeleton className="h-6 w-64 bg-slate-800" />
          <Skeleton className="h-4 w-full bg-slate-800" />
          <Skeleton className="h-4 w-3/4 bg-slate-800" />
        </div>
      </div>
      <Skeleton className="h-40 w-full bg-slate-800 rounded-xl" />
      <Skeleton className="h-40 w-full bg-slate-800 rounded-xl" />
    </div>
  );
}

function EmptyState({ onGenerate, generating, error, listing }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-24 h-24 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mb-6">
        <Cpu className="w-10 h-10 text-slate-500" />
      </div>
      <h2 className="text-xl font-bold text-white mb-2">No ATI Passport yet</h2>
      <p className="text-slate-400 text-sm mb-8 max-w-sm">
        Generate an AI-powered Aircraft Transparency Index analysis for{" "}
        <span className="text-white font-medium">{listing?.make} {listing?.model}</span>.
      </p>
      {error && (
        <p className="text-red-400 text-sm mb-4 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
          {error}
        </p>
      )}
      <button
        onClick={onGenerate}
        disabled={generating}
        className="flex items-center gap-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-8 py-3 rounded-xl transition-colors"
      >
        <Cpu className={`w-5 h-5 ${generating ? "animate-pulse" : ""}`} />
        {generating ? "Generating ATI Score…" : "Generate ATI Score"}
      </button>
    </div>
  );
}

function PassportView({ passport, listing }) {
  return (
    <div className="space-y-6">
      {/* Top row: score ring + dimensions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ATIScoreRing score={passport.ati_total} />
        <ATIDimensions passport={passport} />
      </div>

      {/* Valuation */}
      <ATIValuation passport={passport} listing={listing} />

      {/* Insights */}
      <ATIInsights passport={passport} />
    </div>
  );
}