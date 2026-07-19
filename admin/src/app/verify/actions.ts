"use server";

import { isAdminEmail } from "@/lib/admin";

/** Is this email allowed into the backend? The real gate is enforced again in
 *  middleware, the admin layout, and every server action — this just decides
 *  whether to send a sign-in link or show the "no access" message. */
export async function checkAdminEmail(email: string): Promise<{ allowed: boolean }> {
  return { allowed: isAdminEmail(email.trim().toLowerCase()) };
}
