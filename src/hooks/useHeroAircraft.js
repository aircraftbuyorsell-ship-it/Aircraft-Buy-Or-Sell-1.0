import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const SESSION_KEY = "abos.hero-aircraft-id";

const isValidRegistration = (reg) =>
  typeof reg === "string" && /^[A-Z0-9]{1,2}-?[A-Z0-9]{2,6}$/i.test(reg.trim());

// AircraftListing: registration, make, model, status, ati_score.
// The ONLY source with a real ati_score.
function normalizeListingRecord(record) {
  if (!record || !isValidRegistration(record.registration)) return null;
  return {
    id: `listing-${record.id}`,
    registration: record.registration.trim().toUpperCase(),
    manufacturer: record.make || null,
    model: record.model || null,
    serialNumber: null,
    registrySource: "Aircraft Listing",
    hasSerialOnFile: false,
    isActiveListing: record.status === "active",
    atiScore: record.ati_score != null && Number.isFinite(Number(record.ati_score))
      ? Number(record.ati_score)
      : null,
  };
}

// GlobalRegistry: registration, make, model, serial_number.
// NEVER read or pass raw_data.
function normalizeGlobalRegistryRecord(record) {
  if (!record || !isValidRegistration(record.registration)) return null;
  return {
    id: `gr-${record.id}`,
    registration: record.registration.trim().toUpperCase(),
    manufacturer: record.make || null,
    model: record.model || null,
    serialNumber: record.serial_number || null,
    registrySource: "Global Registry",
    hasSerialOnFile: Boolean(record.serial_number),
    isActiveListing: false,
    atiScore: null,
  };
}

// FAAAircraft: n_number is WITHOUT the "N" prefix. No manufacturer/model
// text fields. NEVER read/pass name, city, state, country — owner PII.
function normalizeFaaRecord(record) {
  if (!record || !record.n_number) return null;
  const registration = `N${String(record.n_number).trim().toUpperCase().replace(/^N/, "")}`;
  if (!isValidRegistration(registration)) return null;
  return {
    id: `faa-${record.id}`,
    registration,
    manufacturer: null,
    model: null,
    serialNumber: record.serial_number || null,
    registrySource: "FAA Registry",
    hasSerialOnFile: Boolean(record.serial_number),
    isActiveListing: false,
    atiScore: null,
  };
}

// Sequential fallback: AircraftListing (primary) → GlobalRegistry → FAAAircraft
async function fetchHeroCandidates() {
  const listings = await base44.entities.AircraftListing.filter(
    { status: "active", visibility: "public" },
    "-created_date",
    20,
  ).catch(() => []);
  const listingRecords = (listings || []).map(normalizeListingRecord).filter(Boolean);
  if (listingRecords.length > 0) return listingRecords;

  const registry = await base44.entities.GlobalRegistry.list("-updated_date", 20).catch(() => []);
  const globalRecords = (registry || []).map(normalizeGlobalRegistryRecord).filter(Boolean);
  if (globalRecords.length > 0) return globalRecords;

  const faa = await base44.entities.FAAAircraft.list("-updated_date", 20).catch(() => []);
  return (faa || []).map(normalizeFaaRecord).filter(Boolean);
}

export function getAircraftTitle(aircraft) {
  if (!aircraft) return "";
  const type = [aircraft.manufacturer, aircraft.model].filter(Boolean).join(" ");
  return type ? `${aircraft.registration} · ${type}` : `${aircraft.registration} · Aircraft record`;
}

// Truthful neutral labels only — never "verified" or "matched"
export function getAircraftStatusLabel(aircraft) {
  if (!aircraft) return "";
  if (aircraft.isActiveListing) return "Active listing";
  if (aircraft.hasSerialOnFile) return "Serial on file";
  if (aircraft.registrySource === "FAA Registry") return "FAA Registry";
  return "Aircraft record";
}

export function useHeroAircraft() {
  const [selectedId, setSelectedId] = useState(() => sessionStorage.getItem(SESSION_KEY));

  const query = useQuery({
    queryKey: ["homepage", "hero-aircraft"],
    queryFn: fetchHeroCandidates,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const aircraft = useMemo(() => {
    const records = query.data || [];
    if (!records.length) return null;
    const persisted = records.find((record) => record.id === selectedId);
    if (persisted) return persisted;
    return records[Math.floor(Math.random() * records.length)];
  }, [query.data, selectedId]);

  useEffect(() => {
    if (!aircraft || aircraft.id === selectedId) return;
    sessionStorage.setItem(SESSION_KEY, aircraft.id);
    setSelectedId(aircraft.id);
  }, [aircraft, selectedId]);

  return { aircraft, isLoading: query.isLoading, error: query.error };
}