"use server";

import { isAdminEmail } from "@/lib/admin";

/** Is this email allowed into Base? Gates the magic-link send. */
export async function checkAdminEmail(email: string): Promise<{ allowed: boolean }> {
  return { allowed: isAdminEmail(email.trim().toLowerCase()) };
}
