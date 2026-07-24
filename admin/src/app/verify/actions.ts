"use server";

import { cookies } from "next/headers";
import { emailForPassword, makeToken, ADMIN_COOKIE } from "@/lib/admin-auth";

export async function signInWithPassword(password: string): Promise<{ ok: boolean; error?: string }> {
  const email = emailForPassword(password ?? "");
  if (!email) return { ok: false, error: "Wrong password." };
  cookies().set(ADMIN_COOKIE, makeToken(email), {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 34560000, // ~400 days — stay signed in on this device
  });
  return { ok: true };
}

export async function signOutAdmin(): Promise<void> {
  cookies().delete(ADMIN_COOKIE);
}
