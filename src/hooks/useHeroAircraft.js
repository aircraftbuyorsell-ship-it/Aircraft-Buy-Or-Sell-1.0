import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const SESSION_KEY = "abos.hero-aircraft-id";

const isValidRegistration = (reg) =>
  typeof reg === "string" && /^[A-Z0-9]{1,2}-?[A-Z0-9]{2,6}$/i.test(reg.trim());

function normalizeGlobalRegistry(record) {
  if (!record || !isValidRegistration(record.registration)) return null;
  return {
    id: `gr-${record.id}`,
    registration: record.registration.trim().toUpperCase(),
    manufacturer: record.make || null,
    model: record.model || null,
    serialNumber: record.serial_number || null,
    registrySource: "Global Registry",
    registryMatched: true,
    serialVerified: false,
    ownerContextAvailable: false,
    atiScore: null,
  };
}

function normalizeFaaAircraft(record) {
  if (!record || !record.n_number) return null;
  const registration = `N${String(record.n_number).trim().toUpperCase().replace(/^N/, "")}`;
  if (!isValidRegistration(registration)) return null;
  return {
    id: `faa-${record.id}`,
    registration,
    manufacturer: null,
    model: null,
    serialNumber: record.serial_number || null,
    registrySource: "FAA",
    registryMatched: true,
    serialVerified: false,
    ownerContextAvailable: Boolean(record.name),
    atiScore: null,
  };
}

function normalizeListing(record) {
  if (!record || !isValidRegistration(record.registration)) return null;
  return {
    id: `listing-${record.id}`,
    registration: record.registration.trim().toUpperCase(),
    manufacturer: record.make || null,
    model: record.model || null,
    serialNumber: null,
    registrySource: "Aircraft Listing",
    registryMatched: false,
    serialVerified: false,
    ownerContextAvailable: Boolean(record.owner),
    atiScore: Number.isFinite(Number(record.ati_score)) && record.ati_score !== null
      ? Number(record.ati_score)
      : null,
  };
}

const recordScore = (record) =>
  (record.manufacturer && record.model ? 2 : 0) +
  (record.atiScore != null ? 2 : 0) +
  (record.registryMatched ? 1 : 0);

async function fetchHeroCandidates() {
  const [globalRegistry, faa, listings] = await Promise.allSettled([
    base44.entities.GlobalRegistry.list("-updated_date", 20),
    base44.entities.FAAAircraft.list("-updated_date", 20),
    base44.entities.AircraftListing.filter(
      { status: "active", visibility: "public" },
      "-updated_date",
      20,
    ),
  ]);

  const records = [
    ...(globalRegistry.status === "fulfilled" ? globalRegistry.value.map(normalizeGlobalRegistry) : []),
    ...(faa.status === "fulfilled" ? faa.value.map(normalizeFaaAircraft) : []),
    ...(listings.status === "fulfilled" ? listings.value.map(normalizeListing) : []),
  ].filter(Boolean);

  records.sort((a, b) => recordScore(b) - recordScore(a));
  return records.slice(0, 25);
}

export function getAircraftTitle(aircraft) {
  if (!aircraft) return "";
  const type = [aircraft.manufacturer, aircraft.model].filter(Boolean).join(" ");
  return type ? `${aircraft.registration} · ${type}` : `${aircraft.registration} · Aircraft record`;
}

export function getAircraftStatusLabel(aircraft) {
  if (!aircraft) return "";
  if (aircraft.registryMatched) return "Registry matched";
  if (aircraft.serialVerified) return "Serial verified";
  if (aircraft.manufacturer && aircraft.model) return "Aircraft identified";
  if (aircraft.registrySource === "Global Registry") return "Global Registry";
  return "Record available";
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

    // Choose among the best-scored group so the hero shows a rich record
    const bestScore = recordScore(records[0]);
    const pool = records.filter((record) => recordScore(record) === bestScore);
    return pool[Math.floor(Math.random() * pool.length)];
  }, [query.data, selectedId]);

  useEffect(() => {
    if (!aircraft || aircraft.id === selectedId) return;
    sessionStorage.setItem(SESSION_KEY, aircraft.id);
    setSelectedId(aircraft.id);
  }, [aircraft, selectedId]);

  return { aircraft, isLoading: query.isLoading, error: query.error };
}