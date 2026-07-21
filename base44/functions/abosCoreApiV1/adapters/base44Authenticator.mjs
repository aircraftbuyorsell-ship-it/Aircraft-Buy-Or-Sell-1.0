import { ApiError } from "../core.mjs";

const MAX_CREDENTIAL_LENGTH = 512;

const assertDependencies = ({ base44, hashCredential, now }) => {
  const filter = base44?.asServiceRole?.entities?.ApiKey?.filter;
  if (typeof filter !== "function") {
    throw new TypeError("Base44 ApiKey.filter must be available.");
  }
  if (typeof hashCredential !== "function") {
    throw new TypeError("hashCredential must be a function.");
  }
  if (typeof now !== "function") {
    throw new TypeError("now must be a function.");
  }
};

const readCredential = (request) => {
  const apiKeyHeader = request.headers.get("x-abos-api-key")?.trim() || "";
  const authorization = request.headers.get("authorization")?.trim() || "";

  let bearerCredential = "";
  if (authorization) {
    const match = /^Bearer\s+(.+)$/i.exec(authorization);
    if (!match) {
      throw new ApiError(401, "INVALID_AUTHORIZATION_SCHEME", "Authorization must use the Bearer scheme.");
    }
    bearerCredential = match[1].trim();
  }

  if (apiKeyHeader && bearerCredential) {
    throw new ApiError(400, "MULTIPLE_CREDENTIALS", "Provide either Authorization: Bearer or X-ABOS-API-Key, not both.");
  }

  const credential = apiKeyHeader || bearerCredential;
  if (!credential) {
    throw new ApiError(401, "AUTHENTICATION_REQUIRED", "A bearer token or X-ABOS-API-Key header is required.");
  }
  if (credential.length > MAX_CREDENTIAL_LENGTH) {
    throw new ApiError(401, "INVALID_API_KEY", "The supplied API credential is invalid or inactive.");
  }
  return credential;
};

const normalizeScopes = (value) => {
  const scopes = new Set(Array.isArray(value)
    ? value.filter((scope) => typeof scope === "string" && scope.trim()).map((scope) => scope.trim())
    : []);

  // Temporary migration alias for legacy credential records only.
  if (scopes.has("listing:read")) scopes.add("listings:read");
  return [...scopes].sort();
};

export function createBase44Authenticator({ base44, hashCredential, now = Date.now }) {
  assertDependencies({ base44, hashCredential, now });

  return async function authenticate(request) {
    const rawCredential = readCredential(request);
    const records = await base44.asServiceRole.entities.ApiKey.filter(
      { key_hash: await hashCredential(rawCredential) },
      undefined,
      1,
    );

    if (!Array.isArray(records)) {
      throw new ApiError(503, "IDENTITY_STORE_UNAVAILABLE", "The credential store returned an invalid response.");
    }

    const key = records[0];
    const expiresAt = key?.expires_at ? Date.parse(key.expires_at) : null;
    const isExpired = key?.expires_at && (!Number.isFinite(expiresAt) || expiresAt <= now());
    if (!key || key.status !== "active" || isExpired) {
      throw new ApiError(401, "INVALID_API_KEY", "The supplied API credential is invalid or inactive.");
    }

    return {
      type: "api_key",
      keyId: key.id,
      scopes: normalizeScopes(key.scopes),
      plan: typeof key.plan === "string" && key.plan ? key.plan : "free",
    };
  };
}
