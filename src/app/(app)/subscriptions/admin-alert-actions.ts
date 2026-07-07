"use server";

import { createClient } from "@/lib/supabase/server";
import { makeSuspendToken } from "@/lib/admin-token";
import { sendAdminCodeAlert } from "@/lib/email";

/**
 * Fired when the admin code is entered on an account. Emails the owner
 * (ADMIN_EMAIL) an alert with a one-click link to suspend the account.
 * Best-effort: soft-returns if there's no user or email isn't configured.
 */
export async function notifyAdminCodeUsed(): Promise<{ ok: boolean }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const site =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://daily-os-lac.vercel.app";
  const suspendUrl = `${site}/suspend?token=${makeSuspendToken(user.id)}`;

  try {
    await sendAdminCodeAlert({
      userEmail: user.email ?? "(unknown)",
      userId: user.id,
      suspendUrl,
    });
  } catch {
    /* never block granting admin on an email failure */
  }
  return { ok: true };
}
