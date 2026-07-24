import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

// Password-based admin sign-in. Two passwords, each mapped to an identity, so
// the apps still know whether it's Arjun or Leo (reply approval, Comms, etc.).
//
//   ADMIN_PASSWORD_ARJUN  -> arjunvirjain@icloud.com  (owner)
//   ADMIN_PASSWORD_LEO    -> leonardo.mcnicol@icloud.com
//   ADMIN_SESSION_SECRET  -> optional; signs the session cookie
//                            (falls back to the service-role key)

export const ADMIN_COOKIE = "dos_admin";

const OWNER_EMAIL = "arjunvirjain@icloud.com";
const LEO_EMAIL = "leonardo.mcnicol@icloud.com";

function secret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "dailyos-admin-fallback-secret"
  );
}

function eq(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/** True once at least one admin password is configured. */
export function passwordAuthConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD_ARJUN || process.env.ADMIN_PASSWORD_LEO);
}

/** Which admin (by email) does this password belong to? null if none match. */
export function emailForPassword(pw: string): string | null {
  const p = pw ?? "";
  const arjun = process.env.ADMIN_PASSWORD_ARJUN;
  const leo = process.env.ADMIN_PASSWORD_LEO;
  if (arjun && eq(p, arjun)) return OWNER_EMAIL;
  if (leo && eq(p, leo)) return LEO_EMAIL;
  return null;
}

function sign(email: string): string {
  return createHmac("sha256", secret()).update(email).digest("hex");
}

/** Cookie value binding the signed-in email, tamper-proof via HMAC. */
export function makeToken(email: string): string {
  return `${email}|${sign(email)}`;
}

/** Verify a cookie token; return the email, or null if invalid/forged. */
export function verifyToken(token: string | undefined): string | null {
  if (!token) return null;
  const i = token.lastIndexOf("|");
  if (i < 0) return null;
  const email = token.slice(0, i);
  const mac = token.slice(i + 1);
  if (!email || !eq(mac, sign(email))) return null;
  return email;
}

/** The currently signed-in admin email (from the cookie), or null. */
export function currentAdminEmail(): string | null {
  return verifyToken(cookies().get(ADMIN_COOKIE)?.value);
}
