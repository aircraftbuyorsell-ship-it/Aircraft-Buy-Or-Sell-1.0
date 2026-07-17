import { createEnvAuthenticator, createMemoryRateLimiter, createSearchHandler } from "./search.mjs";
import { SupabaseListingRepository } from "./supabase-repository.mjs";

const limiters = new Map();

export default {
  async fetch(request, env) {
    const repository = new SupabaseListingRepository({
      url: env.SUPABASE_URL,
      publishableKey: env.SUPABASE_PUBLISHABLE_KEY,
      view: env.ABOS_LISTINGS_VIEW || "abos_public_listings_v1",
    });
    const limit = Number(env.ABOS_RATE_LIMIT_PER_MINUTE || 60);
    if (!limiters.has(limit)) limiters.set(limit, createMemoryRateLimiter({ limit }));
    return createSearchHandler({ listingRepository: repository, authenticate: createEnvAuthenticator(env), rateLimiter: limiters.get(limit) })(request);
  },
};
