import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "@/lib/useTheme";

/**
 * Cloudflare-style three-column divider section.
 * Each column: icon + bold label + description + optional link.
 */
export default function DividerSection({ columns = [], className = "" }) {
  const isDark = useTheme();

  return (
    <div className={`grid md:grid-cols-3 ${className}`}>
      {columns.map((col, i) => (
        <div
          key={i}
          className="relative px-5 py-6 first:pl-0 last:pr-0"
          style={{
            borderRight:
              i < columns.length - 1
                ? isDark
                  ? "1px solid rgba(255,255,255,0.08)"
                  : "1px solid rgba(0,0,0,0.06)"
                : "none",
          }}
        >
          {/* Icon + Label row */}
          <div className="flex items-center gap-3 mb-4">
            {col.icon && (
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  background: isDark
                    ? "rgba(244,129,32,0.08)"
                    : "rgba(244,129,32,0.06)",
                  border: `1px solid ${
                    isDark ? "rgba(244,129,32,0.18)" : "rgba(244,129,32,0.14)"
                  }`,
                }}
              >
                <col.icon
                  className="w-4 h-4"
                  style={{ color: isDark ? "#f48120" : "#e07310" }}
                />
              </div>
            )}
            <h3
              className="text-sm font-bold tracking-tight"
              style={{ color: isDark ? "#f1f5f9" : "#1a1a1a" }}
            >
              {col.label}
            </h3>
          </div>

          {/* Description */}
          <p
            className="text-[13px] leading-relaxed mb-4"
            style={{
              color: isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.55)",
            }}
          >
            {col.description}
          </p>

          {/* Optional link */}
          {col.link && (
            <Link
              to={col.link}
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold transition-colors hover:opacity-70"
              style={{ color: isDark ? "#f48120" : "#e07310" }}
            >
              {col.linkLabel || "Learn more"}
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}