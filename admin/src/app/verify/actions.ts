"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";

export type VerifyResult =
  | { ok: true }
  | { ok: false; denied: true }
  | { ok: false; error: string };

/** The origin THIS admin site is served from, so the magic link comes back
 *  here (not the main DailyOS site). Uses NEXT_PUBLIC_SITE_URL if set, else the
 *  incoming request's host. */
function adminOrigin(): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (env) return env;
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : "";
}

/** Send a magic sign-in link ONLY to allow-listed admin emails. */
export async function requestAdminLink(email: string): Promise<VerifyResult> {
  const clean = email.trim().toLowerCase();
  if (!isAdminEmail(clean)) {
    return { ok: false, denied: true };
  }
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: clean,
    options: { emailRedirectTo: `${adminOrigin()}/auth/callback` },
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
