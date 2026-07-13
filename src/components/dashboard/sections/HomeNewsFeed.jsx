import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Newspaper, ExternalLink, Clock, TrendingUp, Shield, Plane, DollarSign, Zap, Fuel } from "lucide-react";

const CATEGORY_META = {
  market:     { icon: TrendingUp, color: "#f5c242", label: "Market" },
  regulatory: { icon: Shield,     color: "#4e8ef7", label: "Regulatory" },
  fleet:      { icon: Plane,      color: "#5dcaa5", label: "Fleet" },
  tech:       { icon: Zap,        color: "#a855f7", label: "Tech" },
  deals:      { icon: DollarSign, color: "#f5c242", label: "Deals" },
  fuel:       { icon: Fuel,       color: "#e24b4a", label: "Fuel" },
  finance:    { icon: DollarSign, color: "#5dcaa5", label: "Finance" },
};

function Tag({ label, color = "#f0b90b", solid = false }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider whitespace-nowrap"
      style={solid
        ? { background: color, color: "#000000" }
        : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }
      }
    >
      {label}
    </span>
  );
}

function FeaturedCard({ article }) {
  const meta = CATEGORY_META[article.category] || CATEGORY_META.market;
  const imageUrl = article.description;
  const timeAgo = article.published_at
    ? new Date(article.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "";

  return (
    <article
      className="group rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:scale-[1.005]"
      style={{ background: "#0c0c0c", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="relative w-full overflow-hidden aspect-video" style={{ background: "#111" }}>
        {imageUrl ? (
          <img src={imageUrl} alt={article.headline} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" onError={(e) => { e.target.style.display = "none"; }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Newspaper className="w-12 h-12" style={{ color: "rgba(255,255,255,0.12)" }} />
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <Tag label={meta.label} solid />
        </div>
        {article.source_text && (
          <div className="absolute top-3 right-3">
            <Tag label={article.source_text} />
          </div>
        )}
      </div>
      <div className="p-5 md:p-6 flex flex-col flex-1">
        <h1 className="text-xl md:text-2xl font-black leading-tight mb-2 text-white">
          {article.headline}
        </h1>
        <p className="text-sm leading-relaxed flex-1" style={{ color: "#a0a0a0" }}>
          {article.summary}
        </p>
        <div className="flex items-center gap-1.5 mt-4">
          <Clock className="w-3 h-3" style={{ color: "#666" }} />
          <span className="text-[11px]" style={{ color: "#666" }}>{timeAgo}</span>
        </div>
      </div>
    </article>
  );
}

function CompactCard({ article }) {
  const meta = CATEGORY_META[article.category] || CATEGORY_META.market;
  const imageUrl = article.description;
  const timeAgo = article.published_at
    ? new Date(article.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "";

  return (
    <article
      className="group rounded-xl overflow-hidden flex flex-col transition-all duration-300 hover:scale-[1.01]"
      style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.05)" }}
    >
      <div className="relative w-full overflow-hidden aspect-video" style={{ background: "#111" }}>
        {imageUrl ? (
          <img src={imageUrl} alt={article.headline} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" onError={(e) => { e.target.style.display = "none"; }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Newspaper className="w-8 h-8" style={{ color: "rgba(255,255,255,0.12)" }} />
          </div>
        )}
        <div className="absolute top-2 left-2 flex gap-1">
          <Tag label={meta.label} solid />
        </div>
        {article.source_text && (
          <div className="absolute top-2 right-2">
            <Tag label={article.source_text} />
          </div>
        )}
      </div>
      <div className="p-3 md:p-4 flex flex-col flex-1">
        <h3 className="text-sm font-bold leading-tight mb-1 text-white line-clamp-2">
          {article.headline}
        </h3>
        <p className="text-xs leading-relaxed flex-1 line-clamp-2" style={{ color: "#a0a0a0" }}>
          {article.summary}
        </p>
        <div className="flex items-center gap-1 mt-2">
          <Clock className="w-2.5 h-2.5" style={{ color: "#555" }} />
          <span className="text-[10px]" style={{ color: "#555" }}>{timeAgo}</span>
        </div>
      </div>
    </article>
  );
}

export default function HomeNewsFeed() {
  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["aviation-news-curated"],
    queryFn: () =>
      base44.entities.AviationNewsItem.filter(
        { batch_id: "abos_curated_pipeline" },
        "-created_date",
        8
      ),
    staleTime: 300000,
  });

  if (isLoading) {
    return (
      <section className="mx-auto w-full max-w-[1500px] px-4 md:px-8 py-6">
        <div className="flex items-center gap-2 mb-4">
          <Newspaper className="w-4 h-4" style={{ color: "#f5c242" }} />
          <span className="text-[10px] uppercase tracking-[0.15em] font-bold" style={{ color: "#f5c242" }}>
            Aviation News
          </span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.03)", height: "320px" }} />
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.03)", height: "96px" }} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (articles.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-[1500px] px-4 md:px-8 py-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(245,194,66,0.12)" }}>
            <Newspaper className="w-3.5 h-3.5" style={{ color: "#f5c242" }} />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-[0.15em] font-bold block" style={{ color: "#f5c242" }}>
              Aviation News
            </span>
            <span className="text-xs hidden sm:block" style={{ color: "rgba(255,255,255,0.45)" }}>
              Curated from FAA, AOPA & industry sources — rewritten by ABOS AI
            </span>
          </div>
        </div>
      </div>

      {/* Featured + grid — large card left, stacked compact cards right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          {articles[0] && <FeaturedCard article={articles[0]} />}
        </div>
        <div className="flex flex-col gap-4">
          {articles.slice(1, 4).map((article) => (
            <CompactCard key={article.id} article={article} />
          ))}
        </div>
      </div>
    </section>
  );
}