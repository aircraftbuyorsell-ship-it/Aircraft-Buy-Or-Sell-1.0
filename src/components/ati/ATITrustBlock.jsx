import {
  ShieldCheck, AlertTriangle, Link2, Gauge, Lock,
} from "lucide-react";

/**
 * ATITrustBlock — buyer-facing "security summary card"
 * Surfaces verification status, ownership confidence, and ATI trust level
 * at a glance, before the buyer reads the full report.
 *
 * Props: passport, card, ownershipEvents, listing
 * If no passport exists, renders a compact placeholder with CTA.
 */

const COLORS = {
  green: "#5dcaa5",
  amber: "#f5c242",
  red: "#e24b4a",
  muted: "rgba(255,255,255,0.35)",
};

function trustLevelFromScore(score) {
  if (score == null) return null;
  if (score >= 108) return {
    label: "Exceptional",
    sentence: "Exceptional — very low risk. Documentation and condition are well above market standards.",
    color: COLORS.green,
  };
  if (score >= 90) return {
    label: "Strong Buy",
    sentence: "Strong Buy — minor gaps may exist but the overall picture is solid and trustworthy.",
    color: COLORS.green,
  };
  if (score >= 72) return {
    label: "Fair",
    sentence: "Fair — review carefully. Some dimensions need clarification before committing.",
    color: COLORS.amber,
  };
  if (score >= 54) return {
    label: "Caution",
    sentence: "Caution — significant unknowns. Request missing records and a pre-buy inspection.",
    color: COLORS.amber,
  };
  if (score >= 36) return {
    label: "Red Flags",
    sentence: "High Risk — avoid without expert inspection. Multiple critical data gaps detected.",
    color: COLORS.red,
  };
  return {
    label: "Avoid",
    sentence: "High Risk — avoid without expert inspection. Severe transparency deficiencies.",
    color: COLORS.red,
  };
}

function Column({ icon: Icon, label, sentence, color, children }) {
  return (
    <div
      className="flex flex-col gap-2 rounded-xl px-4 py-4"
      style={{
        background: "rgba(255,255,255,0.02)",
        borderLeft: `3px solid ${color}`,
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${color}14`, border: `1px solid ${color}30` }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
        <span className="text-[11px] font-black uppercase tracking-[0.12em]" style={{ color }}>
          {label}
        </span>
      </div>
      {children}
      {sentence && (
        <p className="text-[12px] leading-relaxed text-[rgba(255,255,255,0.65)] font-medium">
          {sentence}
        </p>
      )}
    </div>
  );
}

export default function ATITrustBlock({ passport, card, ownershipEvents = [], listing }) {
  // ── Pre-generation placeholder ──
  if (!passport) {
    return (
      <div
        className="rounded-2xl px-5 py-5"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-4 h-4 text-[rgba(255,255,255,0.35)]" />
          <span className="text-[10px] uppercase tracking-[0.18em] font-black text-[rgba(255,255,255,0.35)]">
            Trust Summary
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { icon: ShieldCheck, label: "Verification Status" },
            { icon: Link2, label: "Ownership Confidence" },
            { icon: Gauge, label: "ATI Trust Level" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex flex-col gap-2 rounded-xl px-4 py-4"
              style={{
                background: "rgba(255,255,255,0.02)",
                borderLeft: `3px solid ${COLORS.muted}`,
              }}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <Icon className="w-3.5 h-3.5 text-[rgba(255,255,255,0.30)]" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.12em] text-[rgba(255,255,255,0.35)]">
                  {label}
                </span>
              </div>
              <p className="text-[12px] leading-relaxed text-[rgba(255,255,255,0.35)] font-medium">
                Not yet assessed — generate the ATI report to see trust indicators.
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Verification Status ──
  const verified = card?.owner_verified;
  const verifiedDate = card?.owner_verified_at
    ? new Date(card.owner_verified_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : null;

  const verification = verified
    ? {
        icon: ShieldCheck,
        label: "Owner Verified",
        color: COLORS.green,
        sentence: verifiedDate
          ? `Seller identity confirmed by owner on ${verifiedDate}. Listing details have been attested.`
          : "Seller identity confirmed by owner. Listing details have been attested.",
      }
    : {
        icon: AlertTriangle,
        label: "Unverified",
        color: COLORS.amber,
        sentence: "Owner has not yet verified this listing. Request verification before proceeding.",
      };

  // ── Ownership Confidence ──
  const verifiedCount = ownershipEvents.filter(
    (e) => e.verification_status === "verified"
  ).length;
  const totalCount = ownershipEvents.length;

  const ownershipColor = verifiedCount >= 2 ? COLORS.green : verifiedCount === 1 ? COLORS.amber : COLORS.red;
  const ownershipSentence = verifiedCount >= 2
    ? `${verifiedCount} of ${totalCount} ownership record${totalCount !== 1 ? "s" : ""} verified — a well-traced title chain.`
    : verifiedCount === 1
    ? `Only 1 of ${totalCount} ownership record${totalCount !== 1 ? "s" : ""} verified — request additional title documentation.`
    : totalCount === 0
    ? "No ownership records on file — request a title search before offering."
    : "No ownership records verified — request a title search before offering.";

  // ── ATI Trust Level ──
  const trust = trustLevelFromScore(passport.ati_total) || {
    label: "Pending",
    sentence: "ATI trust level is being calculated.",
    color: COLORS.muted,
  };

  return (
    <div
      className="rounded-2xl px-5 py-5"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="w-4 h-4 text-[rgba(255,255,255,0.50)]" />
        <span className="text-[10px] uppercase tracking-[0.18em] font-black text-[rgba(255,255,255,0.50)]">
          Trust Summary
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* 1 — Verification Status */}
        <Column
          icon={verification.icon}
          label={verification.label}
          color={verification.color}
          sentence={verification.sentence}
        />

        {/* 2 — Ownership Confidence */}
        <Column
          icon={Link2}
          label="Ownership Confidence"
          color={ownershipColor}
          sentence={ownershipSentence}
        >
          <div className="flex items-center gap-1.5 mt-0.5">
            {Array.from({ length: Math.max(totalCount, 3) }).slice(0, 6).map((_, i) => {
              const isVerified = i < verifiedCount;
              const isPending = i >= verifiedCount && i < totalCount;
              return (
                <div
                  key={i}
                  className="flex items-center"
                  style={{ gap: 2 }}
                >
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: isVerified ? ownershipColor : "rgba(255,255,255,0.12)",
                      border: isPending ? `1px solid ${ownershipColor}50` : "none",
                    }}
                  />
                  {i < Math.max(totalCount, 3) - 1 && i < 5 && (
                    <span className="inline-block w-2.5 h-px" style={{ background: "rgba(255,255,255,0.10)" }} />
                  )}
                </div>
              );
            })}
            <span className="text-[10px] font-bold ml-1.5" style={{ color: ownershipColor }}>
              {verifiedCount}/{totalCount || 0}
            </span>
          </div>
        </Column>

        {/* 3 — ATI Trust Level */}
        <Column
          icon={Gauge}
          label={`ATI Trust: ${trust.label}`}
          color={trust.color}
          sentence={trust.sentence}
        >
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-2xl font-black leading-none" style={{ color: trust.color }}>
              {passport.ati_total}
            </span>
            <span className="text-[10px] text-[rgba(255,255,255,0.35)] font-medium">/ 120</span>
          </div>
        </Column>
      </div>
    </div>
  );
}