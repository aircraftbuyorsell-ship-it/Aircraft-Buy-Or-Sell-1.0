const requireMethod = (port, methodName, portName) => {
  if (!port || typeof port[methodName] !== "function") {
    throw new TypeError(`${portName}.${methodName} must be implemented.`);
  }
};

/**
 * Runtime contract for the persistence ports used by ABOS Core API v1.
 *
 * The Core API depends only on these public methods. Implementations may use
 * Base44, Supabase, an in-memory test store, or another approved backend, but
 * they must return canonical public ABOS DTOs rather than backend records.
 */
export function assertRepositoryPorts({ listingRepository, aircraftRepository }) {
  requireMethod(listingRepository, "search", "listingRepository");
  requireMethod(listingRepository, "getByPublicId", "listingRepository");
  requireMethod(aircraftRepository, "getByPublicId", "aircraftRepository");
}
