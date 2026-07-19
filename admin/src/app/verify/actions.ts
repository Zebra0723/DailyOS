"use server";

import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";

/** Is this email allowed into the backend? Used to gate the magic-link send. */
export async function checkAdminEmail(email: string): Promise<{ allowed: boolean }> {
  return { allowed: isAdminEmail(email.trim().toLowerCase()) };
}

/** Password sign-in, gated server-side to the admin allow-list. A non-admin
 *  email is refused BEFORE any credentials are checked, so password login only
 *  ever works for the allow-listed accounts. */
export async function adminSignIn(
  email: string,
  password: string,
): Promise<{ ok: true } | { ok: false; denied?: true; error?: string }> {
  const clean = email.trim().toLowerCase();
  if (!isAdminEmail(clean)) {
    return { ok: false, denied: true };
  }
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: clean, password });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
