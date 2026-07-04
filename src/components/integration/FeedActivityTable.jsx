import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Database } from "lucide-react";

export default function FeedActivityTable() {
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["partner-feed-activity"],
    queryFn: () => base44.entities.PartnerListingFeed.list("-created_date", 25),
  });

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "0.5px solid rgba(255,255,255,0.08)" }}>
        <Database className="w-4 h-4" style={{ color: "#5dcaa5" }} />
        <p className="text-sm font-bold" style={{ color: "rgba(255,255,255,0.90)" }}>Recent Data Exchange Activity</p>
      </div>
      {isLoading ? (
        <div className="p-4 space-y-2">
          {[...Array(3)].map((_, i) => <div key={i} className="h-8 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.05)" }} />)}
        </div>
      ) : rows.length === 0 ? (
        <p className="p-6 text-sm text-center" style={{ color: "rgba(255,255,255,0.45)" }}>
          No listings received yet. Once a partner pushes data, it appears here.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ color: "rgba(255,255,255,0.45)" }}>
                <th className="text-left px-4 py-2 font-semibold">Registration</th>
                <th className="text-left px-4 py-2 font-semibold">Aircraft</th>
                <th className="text-left px-4 py-2 font-semibold">Partner</th>
                <th className="text-right px-4 py-2 font-semibold">Asking</th>
                <th className="text-left px-4 py-2 font-semibold">Deal</th>
                <th className="text-left px-4 py-2 font-semibold">Registry</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ borderTop: "0.5px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.75)" }}>
                  <td className="px-4 py-2.5 font-bold" style={{ color: "#f5c242" }}>{r.registration}</td>
                  <td className="px-4 py-2.5">{[r.year, r.make, r.model].filter(Boolean).join(" ") || "—"}</td>
                  <td className="px-4 py-2.5">{r.partner_name || "—"}</td>
                  <td className="px-4 py-2.5 text-right">{r.asking_price ? `$${r.asking_price.toLocaleString()}` : "—"}</td>
                  <td className="px-4 py-2.5 capitalize">{r.intelligence?.valuation?.deal_label || "—"}</td>
                  <td className="px-4 py-2.5">{r.registry_matched ? "✓ Matched" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}