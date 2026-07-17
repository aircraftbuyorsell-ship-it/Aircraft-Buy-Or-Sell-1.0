import { createEnvAuthenticator, createSearchHandler } from "./search.mjs";
import { SupabaseListingRepository } from "./supabase-repository.mjs";

export default {
  async fetch(request, env) {
    const repository = new SupabaseListingRepository({
      url: env.SUPABASE_URL,
      publishableKey: env.SUPABASE_PUBLISHABLE_KEY,
      view: env.ABOS_LISTINGS_VIEW || "abos_public_listings_v1",
    });
    return createSearchHandler({ listingRepository: repository, authenticate: createEnvAuthenticator(env) })(request);
  },
};
