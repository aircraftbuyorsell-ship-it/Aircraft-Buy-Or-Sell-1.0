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
      className="group relative w-full overflow-hidden rounded-2xl shrink-0 transition-transform duration-300 hover:scale-[1.01]"
      style={{ height: "220px", background: "#1a1a1a", boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}
    >
      {imageUrl ? (
        <img src={imageUrl} alt={article.headline}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy" onError={(e) => { e.target.style.display = "none"; }} />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)" }}>
          <Newspaper className="w-8 h-8" style={{ color: "rgba(212,160,23,0.25)" }} />
        </div>
      )}

      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, transparent 0%, transparent 40%, rgba(0,0,0,0.6) 65%, rgba(0,0,0,0.95) 100%)" }} />

      <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 z-10">
        <span className="flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider text-white"
          style={{ background: "rgba(51,51,51,0.85)", backdropFilter: "blur(8px)" }}>
          <Icon className="w-2.5 h-2.5" />
          {meta.label}
        </span>
        {(article.source_text || timeAgo) && (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-semibold whitespace-nowrap text-white"
            style={{ background: "rgba(51,51,51,0.70)", backdropFilter: "blur(8px)" }}>
            {article.source_text && <span>{article.source_text}</span>}
            {article.source_text && timeAgo && <span>•</span>}
            {timeAgo && (<span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{timeAgo}</span>)}
          </span>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
        <h3 className="text-sm md:text-base font-bold leading-snug mb-1.5 line-clamp-2 text-white">
          {article.headline}
        </h3>
        <p className="text-[11px] md:text-xs leading-relaxed line-clamp-2 text-white/75">
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
          <Newspaper className="w-4 h-4 text-gold-official" />
          <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-gold-official">Aviation News</span>
        </div>
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl animate-pulse bg-muted/40 border border-border" style={{ height: "220px" }} />
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
            <Newspaper className="w-3.5 h-3.5 text-gold-official" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-[0.15em] font-bold block text-gold-official">Aviation News</span>
            <span className="text-xs hidden sm:block text-muted-foreground">
              Curated from FAA, AOPA & industry sources — rewritten by ABOS AI
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 overflow-y-auto pr-1" style={{ maxHeight: "min(80vh, 720px)" }}>
        {articles.map((article) => (
          <NewsRow key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
}