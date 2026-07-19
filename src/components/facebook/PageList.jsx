import { Loader2, CheckCircle2, Facebook } from "lucide-react";

export default function PageList({ pages, selectedPageId, onSelect, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-4 h-4 animate-spin text-white/30" />
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="text-center py-8 px-4">
        <p className="text-[11px] text-white/40">No Facebook Pages found for this account.</p>
        <p className="text-[10px] text-white/30 mt-1">Create a Page in Facebook first, then refresh.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {pages.map((page) => {
        const isSelected = selectedPageId === page.id;
        return (
          <button
            key={page.id}
            onClick={() => onSelect(page)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
              isSelected ? "bg-white/8" : "hover:bg-white/4"
            }`}
            style={{
              border: isSelected
                ? "0.5px solid rgba(245,194,66,0.30)"
                : "0.5px solid rgba(255,255,255,0.06)",
            }}
          >
            {page.picture?.data?.url ? (
              <img
                src={page.picture.data.url}
                alt=""
                className="w-9 h-9 rounded-lg object-cover shrink-0"
              />
            ) : (
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "rgba(24,119,242,0.10)" }}
              >
                <Facebook className="w-4 h-4 text-[#1877f2]" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white/85 truncate">{page.name}</p>
              <p className="text-[10px] text-white/35">{page.category || "Page"}</p>
            </div>
            {isSelected && <CheckCircle2 className="w-4 h-4 text-[#f5c242] shrink-0" />}
          </button>
        );
      })}
    </div>
  );
}