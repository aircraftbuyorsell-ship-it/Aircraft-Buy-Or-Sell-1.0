import { Loader2, ExternalLink, MessageCircle } from "lucide-react";
import moment from "moment";

export default function RecentPosts({ posts, loading, onRefresh }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] uppercase tracking-wider font-bold text-white/40 flex items-center gap-1.5">
          <MessageCircle className="w-3 h-3" />
          Recent Page Posts
        </p>
        <button onClick={onRefresh} className="text-[10px] text-white/40 hover:text-white/70">
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-4 h-4 animate-spin text-white/30" />
        </div>
      ) : posts.length === 0 ? (
        <p className="text-[11px] text-white/35 text-center py-6">No posts yet on this Page.</p>
      ) : (
        <div className="space-y-2">
          {posts.map((post) => (
            <div
              key={post.id}
              className="p-3 rounded-lg"
              style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.06)" }}
            >
              <p className="text-[11px] text-white/60 leading-snug line-clamp-3 mb-1.5">
                {post.message || "(No text — photo/link post)"}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-white/30">
                  {post.created_time ? moment(post.created_time).format("MMM D, YYYY · HH:mm") : ""}
                </span>
                {post.permalink_url && (
                  <a
                    href={post.permalink_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[9px] text-[#1877f2] hover:underline"
                  >
                    View <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}