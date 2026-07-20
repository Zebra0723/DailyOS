import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/** Service-role client: full database access, bypasses row-level security.
 *  SERVER-ONLY - never import into a client component. */
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
