import { RefreshCw } from "lucide-react";
import { usePullToRefresh } from "@/lib/usePullToRefresh";

/**
 * Reusable pull-to-refresh wrapper.
 * Wraps children with a pull-to-refresh indicator at the top.
 * Only active on touch devices (hook checks window.scrollY).
 */
export default function PullToRefreshContainer({ onRefresh, children, className = "" }) {
  const { distance, pulling, refreshing } = usePullToRefresh({ onRefresh });
  const show = pulling || refreshing;
  return (
    <div className={`relative ${className}`}>
      {show && (
        <div
          className="flex items-center justify-center py-2 text-[#D4A017] transition-all"
          style={{ height: Math.max(distance, refreshing ? 40 : 0), overflow: "hidden" }}
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
        </div>
      )}
      {children}
    </div>
  );
}