"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/admin-user";

/**
 * Whether the just-signed-in user must be blocked because the app is in
 * maintenance and they aren't allowed through. Called by the auth form right
 * after authentication: if this returns true, the client signs them straight
 * back out, so a login by a non-allowlisted account never grants access.
 *
 * Reads app_config with the service client (its RLS doesn't grant normal users
 * SELECT), and lets admins through even if they aren't on the list.
 */
export async function maintenanceBlocksCurrentUser(): Promise<boolean> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false; // no session to gate

  const admin = createServiceClient();
  const { data } = await admin
    .from("app_config")
    .select("value")
    .eq("key", "global")
    .maybeSingle();
  const cfg = (data?.value ?? {}) as {
    maintenance?: boolean;
    maintenanceAllowlist?: string[];
  };

  if (!cfg.maintenance) return false;
  if (isAdminUser(user)) return false;

  const allow = new Set(
    (cfg.maintenanceAllowlist ?? []).map((e) => e.toLowerCase()),
  );
  return !allow.has((user.email ?? "").toLowerCase());
}
