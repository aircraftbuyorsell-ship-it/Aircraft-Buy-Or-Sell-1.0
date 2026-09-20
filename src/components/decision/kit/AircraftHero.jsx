/**
 * AircraftHero — the page header for the aircraft as the primary intelligence
 * object (master spec §21, §62).
 *
 * Registration is the headline because that is what a dealer standing next to
 * the aircraft reads off the tail. Everything else attaches beneath it.
 */

import React from "react";
import { Plane, MapPin, Clock, Calendar, ShieldCheck } from "lucide-react";
import { value, displayName } from "@/intelligence";
import { ATIChip } from "./ATIWidget";

const FLAG = {
  US: "🇺🇸", CZ: "🇨🇿", DE: "🇩🇪", GB: "🇬🇧", FR: "🇫🇷", PL: "🇵🇱",
  SK: "🇸🇰", AT: "🇦🇹", CH: "🇨🇭", ES: "🇪🇸", IT: "🇮🇹", NL: "🇳🇱",
};

const COUNTRY_NAME = {
  US: "United States", CZ: "Czechia", DE: "Germany", GB: "United Kingdom",
  FR: "France", PL: "Poland", SK: "Slovakia", AT: "Austria", CH: "Switzerland",
  ES: "Spain", IT: "Italy", NL: "Netherlands",
};

export default function AircraftHero({
  aircraft, ati = null, photoUrl = null, stage = null, actions = null, className = "",
}) {
  if (!aircraft) return null;

  const registration = value(aircraft, "registration");
  const manufacturer = value(aircraft, "manufacturer");
  const model = value(aircraft, "model");
  const year = value(aircraft, "year");
  const country = String(value(aircraft, "country") || "").toUpperCase();
  const totalTime = value(aircraft, "total_time");
  const base = value(aircraft, "home_base");
  const identityConfirmed = aircraft.identity_confidence >= 0.8;

  const chips = [
    year ? { icon: Calendar, text: String(year) } : null,
    totalTime ? { icon: Clock, text: `TTAF ${Number(totalTime).toLocaleString("en-US")} h` } : null,
    base ? { icon: MapPin, text: String(base) } : null,
  ].filter(Boolean);

  return (
    <header className={`overflow-hidden rounded-2xl border border-black/10 bg-[#1A1814] text-white dark:border-white/10 ${className}`}>
      <div className="relative">
        {photoUrl ? (
          <>
            <img
              src={photoUrl}
              alt={displayName(aircraft)}
              className="absolute inset-0 h-full w-full object-cover object-right"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#1A1814] via-[#1A1814]/85 to-[#1A1814]/20" />
          </>
        ) : null}

        <div className="relative p-5 md:p-6">
          {stage ? (
            <span className="inline-flex items-center rounded bg-white/15 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/90 backdrop-blur-sm">
              {stage}
            </span>
          ) : null}

          <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="text-2xl font-black tracking-tight md:text-3xl">
              {[manufacturer, model].filter(Boolean).join(" ") || "Unidentified aircraft"}
            </h1>
            {registration ? (
              <span className="text-xl font-black tabular-nums text-[#E8C46A] md:text-2xl">{registration}</span>
            ) : null}
            {country ? (
              <span className="text-sm font-semibold text-white/70">
                {FLAG[country] ? `${FLAG[country]} ` : ""}{COUNTRY_NAME[country] || country}
              </span>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            {identityConfirmed ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                <ShieldCheck className="h-3 w-3" strokeWidth={2.5} />
                Verified identity
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white/60">
                <Plane className="h-3 w-3" strokeWidth={2.5} />
                Identity not independently confirmed
              </span>
            )}

            {ati ? <ATIChip ati={ati} className="!bg-white/10 !text-[#E8C46A] !border-white/20" /> : null}

            {chips.map((chip) => {
              const Icon = chip.icon;
              return (
                <span key={chip.text} className="inline-flex items-center gap-1.5 text-xs font-medium text-white/70">
                  <Icon className="h-3.5 w-3.5" />
                  {chip.text}
                </span>
              );
            })}
          </div>

          {actions ? <div className="mt-4 flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      </div>
    </header>
  );
}

/** Label / value grid for the aircraft overview block. */
export function SpecGrid({ items = [], columns = 2, className = "" }) {
  if (!items.length) return null;
  const cols = columns === 3 ? "sm:grid-cols-3" : columns === 4 ? "sm:grid-cols-4" : "sm:grid-cols-2";
  return (
    <dl className={`grid grid-cols-1 gap-x-6 gap-y-4 ${cols} ${className}`}>
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#AAA49C]">{item.label}</dt>
          <dd className={`mt-0.5 text-sm font-bold ${item.value ? "text-[#1A1814] dark:text-white" : "text-[#AAA49C]"}`}>
            {item.value || "Not established"}
          </dd>
          {item.note ? <p className="mt-0.5 text-[11px] text-[#AAA49C]">{item.note}</p> : null}
        </div>
      ))}
    </dl>
  );
}

/** Build the standard overview grid straight off the canonical aircraft. */
export function overviewItems(aircraft) {
  if (!aircraft) return [];
  const get = (key) => {
    const v = value(aircraft, key);
    return v === null || v === undefined || v === "" ? null : String(v);
  };
  const hours = value(aircraft, "total_time");
  return [
    { label: "Manufacturer / Model", value: [get("manufacturer"), get("model")].filter(Boolean).join(" ") || null },
    { label: "Serial number", value: get("serial_number") },
    { label: "Registration", value: get("registration") },
    { label: "Year", value: get("year") },
    { label: "Engine", value: get("engine_make_model") },
    { label: "Total time", value: Number.isFinite(hours) ? `${Number(hours).toLocaleString("en-US")} h` : null },
    { label: "Registration status", value: get("registration_status") },
    { label: "Last known location", value: get("home_base") || get("last_known_position") },
  ];
}
