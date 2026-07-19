"use client";

// ----------------------------------------------------------------------------
// Cross-device sync via a per-user key/value table (`user_state`) in Supabase.
//
// Everything here is BEST-EFFORT: if the table doesn't exist yet, the user is
// signed out, or the network fails, these functions quietly no-op / return null
// so the caller falls back to local storage. Turning on the migration
// `0003_user_state.sql` makes them start syncing — no code change needed.
// ----------------------------------------------------------------------------

import { createClient } from "@/lib/supabase/client";

// If the `user_state` table isn't set up yet (migration not run), stop trying
// for the rest of the session so we don't spam failing requests. A page reload
// re-enables it (e.g. right after running the migration).
let remoteDisabled = false;

/** Read a synced value for the current user, or null if unavailable. */
export async function loadRemote<T = unknown>(key: string): Promise<T | null> {
  if (remoteDisabled) return null;
  try {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return null;
    const { data, error } = await supabase
      .from("user_state")
      .select("value")
      .eq("user_id", session.user.id)
      .eq("key", key)
      .maybeSingle();
    if (error) {
      remoteDisabled = true; // table missing / not set up → fall back to local
      return null;
    }
    return (data?.value as T) ?? null;
  } catch {
    return null;
  }
}

/** Upsert a synced value for the current user. Silently ignores failures. */
export async function saveRemote(key: string, value: unknown): Promise<void> {
  if (remoteDisabled) return;
  try {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;
    const { error } = await supabase
      .from("user_state")
      .upsert(
        { user_id: session.user.id, key, value },
        { onConflict: "user_id,key" },
      );
    if (error) remoteDisabled = true;
  } catch {
    /* ignore — local storage remains the fallback */
  }
}

/** A small debouncer so rapid edits don't hammer the network. */
export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  ms: number,
): (...args: A) => void {
  let t: ReturnType<typeof setTimeout> | null = null;
  return (...args: A) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}
