"use server";

import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";

export type VerifyResult =
  | { ok: true }
  | { ok: false; denied: true }
  | { ok: false; error: string };

/** Send a magic sign-in link ONLY to allow-listed admin emails. */
export async function requestAdminLink(email: string): Promise<VerifyResult> {
  const clean = email.trim().toLowerCase();
  if (!isAdminEmail(clean)) {
    return { ok: false, denied: true };
  }
  const supabase = createClient();
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const { error } = await supabase.auth.signInWithOtp({
    email: clean,
    options: { emailRedirectTo: `${site}/auth/callback` },
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
