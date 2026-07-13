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

function NewsRow({ article }) {
  const meta = CATEGORY_META[article.category] || CATEGORY_META.market;
  const Icon = meta.icon;
  const imageUrl = article.description;
  const timeAgo = article.published_at
    ? new Date(article.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "";

  return (
    <article
      className="group flex items-stretch gap-0 rounded-2xl overflow-hidden shrink-0 transition-all duration-300 hover:scale-[1.005]"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "0.5px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Image — left side */}
      <div
        className="relative shrink-0 overflow-hidden"
        style={{ background: "rgba(0,0,0,0.3)", width: "clamp(90px, 30%, 160px)" }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={article.headline}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Newspaper className="w-6 h-6" style={{ color: "rgba(255,255,255,0.15)" }} />
          </div>
        )}
        {/* Category badge */}
        <div
          className="absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider backdrop-blur-md"
          style={{ background: `${meta.color}20`, color: meta.color, border: `0.5px solid ${meta.color}40` }}
        >
          <Icon className="w-2 h-2" />
          {meta.label}
        </div>
      </div>

      {/* Content — right side */}
      <div className="flex flex-col justify-center p-3 md:p-4 flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {article.source_text && (
            <span
              className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
              style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.60)" }}
            >
              {article.source_text}
            </span>
          )}
          <span className="text-[9px] flex items-center gap-0.5 shrink-0" style={{ color: "rgba(255,255,255,0.30)" }}>
            <Clock className="w-2.5 h-2.5" />
            {timeAgo}
          </span>
        </div>
        <h3
          className="text-xs md:text-sm font-bold leading-snug mb-1 line-clamp-2"
          style={{ color: "rgba(255,255,255,0.90)" }}
        >
          {article.headline}
        </h3>
        <p
          className="text-[11px] md:text-xs leading-relaxed line-clamp-2"
          style={{ color: "rgba(255,255,255,0.55)" }}
        >
          {article.summary}
        </p>
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
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl animate-pulse flex" style={{ background: "rgba(255,255,255,0.03)", height: "90px" }} />
          ))}
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

      {/* Vertical scroll — one article per row */}
      <div
        className="flex flex-col gap-3 overflow-y-auto pr-1"
        style={{ maxHeight: "min(70vh, 560px)" }}
      >
        {articles.map((article) => (
          <NewsRow key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
}