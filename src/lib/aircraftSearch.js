export function normalizeAircraftSearch(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

export function aircraftMatchesSearch(aircraft, query) {
  const normalizedQuery = normalizeAircraftSearch(query);
  if (!normalizedQuery) return true;

  const fields = [
    aircraft?.make,
    aircraft?.model,
    aircraft?.registration,
    aircraft?.serial_number,
    aircraft?.mfr_mdl_code,
    aircraft?.title,
  ];

  return fields.some((value) => normalizeAircraftSearch(value).includes(normalizedQuery));
}
