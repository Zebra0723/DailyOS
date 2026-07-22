"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Mark the guided welcome tour as seen. Sets `user_metadata.onboarded = true`
 * so the tour never auto-shows again on a normal login — /welcome will redirect
 * straight to /today for anyone who already carries this flag. Called when the
 * user finishes OR skips the tour; both count as "seen".
 */
export async function markOnboarded() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not authenticated" };

  // Merge, don't clobber: keep any existing personalisation metadata intact.
  const { error } = await supabase.auth.updateUser({
    data: { onboarded: true },
  });
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}
