import { useState, useEffect } from "react";
import { X, TrendingUp, Zap, Gift } from "lucide-react";
import { motion } from "framer-motion";

const NOTIFICATION_TYPES = {
  tier_upgrade: {
    icon: Zap,
    bg: "linear-gradient(135deg, rgba(122,0,255,0.15), rgba(0,245,255,0.08))",
    border: "rgba(122,0,255,0.35)",
    color: "#7a00ff",
  },
  sale_offer: {
    icon: Gift,
    bg: "linear-gradient(135deg, rgba(212,160,23,0.15), rgba(255,100,100,0.08))",
    border: "rgba(212,160,23,0.35)",
    color: "#D4A017",
  },
  hot_deal: {
    icon: TrendingUp,
    bg: "linear-gradient(135deg, rgba(255,77,109,0.15), rgba(212,160,23,0.08))",
    border: "rgba(255,77,109,0.35)",
    color: "#ff4d6d",
  },
};

export default function PushNotification({
  id,
  type = "tier_upgrade",
  title,
  message,
  cta_label,
  cta_href,
  onDismiss,
  duration = 8000,
}) {
  const [isClosing, setIsClosing] = useState(false);
  const config = NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.tier_upgrade;
  const Icon = config.icon;

  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        setIsClosing(true);
        setTimeout(() => onDismiss?.(id), 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, id, onDismiss]);

  const handleDismiss = () => {
    setIsClosing(true);
    setTimeout(() => onDismiss?.(id), 300);
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed bottom-4 right-4 z-40 max-w-sm"
    >
      <div
        className="rounded-2xl p-4 shadow-2xl backdrop-blur-xl border"
        style={{
          background: config.bg,
          borderColor: config.border,
          boxShadow: `0 0 30px ${config.color}20, 0 20px 50px rgba(0,0,0,0.3)`,
        }}
      >
        {/* Top accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
          style={{
            background: `linear-gradient(90deg, transparent, ${config.color}, transparent)`,
          }}
        />

        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: `${config.color}15`, color: config.color }}
          >
            <Icon className="w-5 h-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-sm text-white leading-tight mb-0.5">
              {title}
            </h3>
            <p className="text-[11px] text-white/65 leading-relaxed">{message}</p>

            {cta_label && cta_href && (
              <a
                href={cta_href}
                onClick={(e) => {
                  e.preventDefault();
                  handleDismiss();
                  window.location.href = cta_href;
                }}
                className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all active:scale-95"
                style={{
                  background: `${config.color}20`,
                  border: `1px solid ${config.color}40`,
                  color: config.color,
                }}
              >
                {cta_label} →
              </a>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white/70 transition-colors"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}