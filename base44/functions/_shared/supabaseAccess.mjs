/**
 * Resolving Supabase access for a server function.
 *
 * Eight functions bootstrap Supabase by asking the OAuth connector for a token,
 * listing every project through the Management API to find this one, then
 * pulling the service_role key back out of the Management API — on every single
 * request. Three network hops before the first row is read, any of which turns a
 * routine aircraft lookup into a 502.
 *
 * Two things make that unnecessary:
 *   - the project ref is a known constant, so project discovery is pure overhead
 *   - `_shared/aircraftTwin.ts` already reads the URL and service key straight
 *     from function secrets, which is the cheap and stable path
 *
 * So: secrets first, connector only as a fallback, and the fallback addresses the
 * project by its ref instead of searching for it. Failures carry the stage that
 * failed, because "Aircraft data source unavailable" four times over is not
 * something you can debug from a log.
 *
 * Dependencies are injected so this is testable without Deno or a live connector.
 */

export const ACCESS_STAGES = Object.freeze({
  ENV: "env",
  CONNECTOR: "connector",
  API_KEYS: "api_keys",
  SERVICE_ROLE_KEY: "service_role_key",
});

export class SupabaseAccessError extends Error {
  constructor(stage, message) {
    super(message);
    this.name = "SupabaseAccessError";
    this.stage = stage;
  }
}

/** Reads the secrets, matching the names `_shared/aircraftTwin.ts` already uses. */
export function readSupabaseEnv(env) {
  const get = (key) => {
    try { return env?.get?.(key) || ""; } catch { return ""; }
  };
  return {
    url: get("SUPABASE_URL") || get("ABOS_SUPABASE_URL"),
    key: get("SUPABASE_SERVICE_ROLE_KEY") || get("ABOS_SUPABASE_SERVICE_ROLE_KEY"),
  };
}

/**
 * @param {object}   input
 * @param {object}   input.env         Deno.env, or anything with .get(name).
 * @param {string}   input.projectRef  Known Supabase project ref.
 * @param {function} [input.getConnection] async () => ({ accessToken }) — the fallback.
 * @param {function} [input.fetchImpl]  defaults to global fetch.
 * @returns {Promise<{restUrl: string, serviceKey: string, projectId: string, source: string}>}
 */
export async function resolveSupabaseAccess({ env, projectRef, getConnection, fetchImpl = fetch } = {}) {
  const { url, key } = readSupabaseEnv(env);
  if (url && key) {
    return { restUrl: url.replace(/\/+$/, ""), serviceKey: key, projectId: projectRef, source: ACCESS_STAGES.ENV };
  }

  if (typeof getConnection !== "function") {
    throw new SupabaseAccessError(
      ACCESS_STAGES.ENV,
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are not set and no connector fallback was provided",
    );
  }

  let accessToken;
  try {
    ({ accessToken } = (await getConnection()) || {});
  } catch (error) {
    throw new SupabaseAccessError(ACCESS_STAGES.CONNECTOR, `Supabase connector unavailable: ${error?.message || error}`);
  }
  if (!accessToken) {
    throw new SupabaseAccessError(ACCESS_STAGES.CONNECTOR, "Supabase connector returned no access token");
  }

  // Addressed by ref: the old code listed every project just to find this one.
  const response = await fetchImpl(`https://api.supabase.com/v1/projects/${projectRef}/api-keys`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new SupabaseAccessError(ACCESS_STAGES.API_KEYS, `Supabase Management API returned ${response.status} for project keys`);
  }

  const keys = await response.json();
  const serviceKey = (Array.isArray(keys) ? keys : []).find((item) => item?.name === "service_role")?.api_key;
  if (!serviceKey) {
    throw new SupabaseAccessError(ACCESS_STAGES.SERVICE_ROLE_KEY, "No service_role key on the Supabase project");
  }

  return {
    restUrl: `https://${projectRef}.supabase.co`,
    serviceKey,
    projectId: projectRef,
    source: ACCESS_STAGES.CONNECTOR,
  };
}

/**
 * Management-API token for the optional enrichment queries (ADs/STCs), which
 * already degrade to an empty result. Best-effort by design: never throws, so a
 * connector problem costs the enrichment rather than the whole lookup.
 */
export async function getSupabaseManagementToken(getConnection) {
  if (typeof getConnection !== "function") return null;
  try {
    const { accessToken } = (await getConnection()) || {};
    return accessToken || null;
  } catch {
    return null;
  }
}
