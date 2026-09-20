/**
 * The right-hand rail from the mockups: risk signals, the data integrity
 * shield and priced quick actions.
 *
 * RiskSignals and DataIntegrityShield read straight off the conflict engine
 * and the canonical aircraft — they are views, not a second source of truth.
 */

import React from "react";
import {
  TriangleAlert, CircleCheck, ShieldCheck, Database, ChevronRight, Zap, ArrowRight,
} from "lucide-react";
import { conflictSeverity } from "@/intelligence";

/* --------------------------------------------------------- RiskSignals */

const SIGNAL_TONE = {
  risk: { Icon: TriangleAlert, tone: "text-[#C0392B]" },
  attention: { Icon: TriangleAlert, tone: "text-[#D4A017]" },
  clear: { Icon: CircleCheck, tone: "text-emerald-600" },
};

export function RiskSignals({ signals = [], onSelect = null, className = "" }) {
  const actionable = signals.filter((s) => s.tone !== "clear").length;

  return (
    <section className={`rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-white/5 ${className}`}>
      <div className="flex items-center justify-between gap-3 border-b border-black/5 px-4 py-3 dark:border-white/10">
        <div className="flex items-center gap-2">
          <TriangleAlert className="h-4 w-4 text-[#D4A017]" strokeWidth={2.5} />
          <h3 className="text-sm font-black uppercase tracking-[0.08em] text-[#1A1814] dark:text-white">
            Risk signals
          </h3>
        </div>
        {actionable ? (
          <span className="rounded-full bg-[#D4A017]/15 px-2 py-0.5 text-[11px] font-bold tabular-nums text-[#8b6a20]">
            {actionable}
          </span>
        ) : null}
      </div>

      {signals.length ? (
        <ul className="divide-y divide-black/5 dark:divide-white/10">
          {signals.map((signal, i) => {
            const { Icon, tone } = SIGNAL_TONE[signal.tone] || SIGNAL_TONE.attention;
            const clickable = Boolean(onSelect);
            return (
              <li
                key={signal.key || i}
                {...(clickable ? { role: "button", tabIndex: 0, onClick: () => onSelect(signal), onKeyDown: (e) => { if (e.key === "Enter") onSelect(signal); } } : {})}
                className={`flex items-start gap-3 px-4 py-3 ${clickable ? "cursor-pointer transition hover:bg-[#F7F4EF] dark:hover:bg-white/5" : ""}`}
              >
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${tone}`} strokeWidth={2.5} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#1A1814] dark:text-white">{signal.label}</p>
                  {signal.detail ? (
                    <p className="mt-0.5 text-xs text-[#6B6560] dark:text-white/55">{signal.detail}</p>
                  ) : null}
                </div>
                {clickable ? <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-[#D9D4CC]" /> : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="px-4 py-4 text-sm text-[#6B6560] dark:text-white/55">
          No risk signals were raised by the sources consulted.
        </p>
      )}
    </section>
  );
}

/**
 * Build risk signals from the canonical aircraft. Only genuine findings and
 * genuine disagreements become signals — an absence never does.
 */
export function buildRiskSignals(aircraft, { assessment = null } = {}) {
  if (!aircraft) return [];
  const signals = [];
  const get = (key) => aircraft.fields?.[key];
  const val = (key) => (get(key)?.value ?? null);

  for (const conflict of aircraft.conflicts || []) {
    signals.push({
      key: `conflict_${conflict.field}`,
      tone: conflictSeverity(conflict) === "high" ? "risk" : "attention",
      label: `${conflict.label} — sources disagree`,
      detail: conflict.difference_display
        ? `${conflict.difference_display} apart. ${conflict.required_action}`
        : conflict.required_action,
    });
  }

  const status = String(val("registration_status") || "").toLowerCase();
  if (status && !/valid|active|current/.test(status)) {
    signals.push({
      key: "registration_status",
      tone: "risk",
      label: `Registration status: ${val("registration_status")}`,
      detail: "Confirm the current registration before any deposit moves.",
    });
  }

  if (get("damage_history")?.value) {
    signals.push({
      key: "damage_history",
      tone: "attention",
      label: "Damage or incident on record",
      detail: String(val("damage_history")),
    });
  }

  const smoh = Number(val("engine_smoh"));
  const tbo = Number(val("engine_tbo"));
  if (Number.isFinite(smoh) && Number.isFinite(tbo) && tbo > 0) {
    const remaining = tbo - smoh;
    if (remaining <= 200) {
      signals.push({
        key: "engine_tbo",
        tone: remaining <= 0 ? "risk" : "attention",
        label: remaining <= 0 ? "Engine is at or past TBO" : `Engine within ${Math.round(remaining)} h of TBO`,
        detail: "Overhaul exposure falls inside a normal ownership window. Model it in Commit.",
      });
    }
  }

  const lastAnnual = val("last_annual");
  if (lastAnnual) {
    const months = monthsSince(lastAnnual);
    if (months !== null && months > 12) {
      signals.push({
        key: "annual_overdue",
        tone: "attention",
        label: `Last inspection ${months} months ago`,
        detail: "Inspection interval appears to have lapsed on the records available.",
      });
    }
  }

  if (assessment?.position?.state === "above" && assessment.position.delta_pct > 20) {
    signals.push({
      key: "price_above_range",
      tone: "attention",
      label: `Asking price ${assessment.position.delta_pct}% above the modelled range`,
      detail: "It needs a specific justification — configuration, condition or recent work.",
    });
  }

  if (!signals.length) {
    signals.push({
      key: "clear",
      tone: "clear",
      label: "No risk signals raised",
      detail: "Nothing in the sources consulted raised a flag. Absent sources are shown separately as gaps.",
    });
  }

  return signals;
}

/* ------------------------------------------------- DataIntegrityShield */

export function DataIntegrityShield({ aircraft, onViewDetails = null, className = "" }) {
  const conflicts = aircraft?.conflicts || [];
  const sourceCount = new Set(
    Object.values(aircraft?.fields || {})
      .flatMap((p) => (p?.sources || []).map((s) => s.providerId)),
  ).size;

  return (
    <section className={`rounded-2xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-white/5 ${className}`}>
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-emerald-600" strokeWidth={2.5} />
        <h3 className="text-sm font-black uppercase tracking-[0.08em] text-[#1A1814] dark:text-white">
          Data integrity
        </h3>
      </div>

      {conflicts.length ? (
        <>
          <p className="mt-2 text-sm font-semibold text-[#1A1814] dark:text-white">
            {conflicts.length} source conflict{conflicts.length === 1 ? "" : "s"}
          </p>
          <ul className="mt-2 space-y-2">
            {conflicts.slice(0, 3).map((c) => (
              <li key={c.field} className="text-xs text-[#6B6560] dark:text-white/60">
                <span className="font-semibold text-[#1A1814] dark:text-white/85">{c.label}:</span>{" "}
                {c.values.map((v) => `${v.provider} shows ${formatConflictValue(v.value, c.unit)}`).join(", while ")}.
                Needs manual review.
              </li>
            ))}
          </ul>
          {onViewDetails ? (
            <button
              type="button"
              onClick={onViewDetails}
              className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#8b6a20] underline-offset-2 hover:underline dark:text-[#D4A017]"
            >
              View details <ArrowRight className="h-3 w-3" />
            </button>
          ) : null}
        </>
      ) : (
        <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-300">No critical conflicts found.</p>
      )}

      <p className="mt-3 flex items-center gap-1.5 border-t border-black/5 pt-3 text-[11px] text-[#AAA49C] dark:border-white/10">
        <Database className="h-3 w-3" />
        Data sources ({sourceCount})
      </p>
    </section>
  );
}

/* ------------------------------------------------------- QuickActions */

export function QuickActions({
  title = "Quick actions", actions = [], onSelect = null, className = "",
}) {
  if (!actions.length) return null;
  return (
    <section className={`rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-white/5 ${className}`}>
      <div className="flex items-center gap-2 border-b border-black/5 px-4 py-3 dark:border-white/10">
        <Zap className="h-4 w-4 text-[#D4A017]" strokeWidth={2.5} />
        <h3 className="text-sm font-black uppercase tracking-[0.08em] text-[#1A1814] dark:text-white">{title}</h3>
      </div>
      <ul className="divide-y divide-black/5 dark:divide-white/10">
        {actions.map((action) => (
          <li key={action.key}>
            <button
              type="button"
              onClick={() => onSelect?.(action)}
              disabled={!onSelect}
              className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition enabled:hover:bg-[#F7F4EF] disabled:cursor-default dark:enabled:hover:bg-white/5"
            >
              <span className="min-w-0 flex-1 truncate text-sm text-[#1A1814] dark:text-white/85">{action.label}</span>
              {action.price ? (
                <span className="shrink-0 text-sm font-bold tabular-nums text-[#8b6a20] dark:text-[#E8C46A]">{action.price}</span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Dark call-to-action card that closes the rail. */
export function UpsellCard({ title, body, cta, onClick = null, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`flex w-full items-center justify-between gap-3 rounded-2xl bg-[#1A1814] p-4 text-left text-white transition enabled:hover:bg-black disabled:cursor-default ${className}`}
    >
      <span className="min-w-0">
        <span className="block text-sm font-bold">{title}</span>
        <span className="mt-0.5 block text-xs text-white/60">{body}</span>
        {cta ? <span className="mt-2 block text-[11px] font-bold uppercase tracking-wider text-[#E8C46A]">{cta}</span> : null}
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-[#E8C46A]" />
    </button>
  );
}

/* ---------------------------------------------------------- helpers */

function formatConflictValue(value, unit) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") {
    return `${value.toLocaleString("en-US", { maximumFractionDigits: 1 })}${unit ? ` ${unit}` : ""}`;
  }
  return String(value);
}

function monthsSince(dateLike) {
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return null;
  return Math.max(0, Math.round((Date.now() - d.getTime()) / (30.44 * 86400000)));
}
