import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Degrade gracefully (null client) instead of crashing the whole app bundle
// when these aren't configured in a given environment.
export const supabase = supabaseUrl && supabaseKey
  ? createBrowserClient(supabaseUrl, supabaseKey)
  : null;
