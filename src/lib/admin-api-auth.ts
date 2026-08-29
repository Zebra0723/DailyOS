import crypto from "node:crypto";

/**
 * Bearer-token check for the external admin API (Cloudflare Worker etc.).
 * Compares against ADMIN_API_TOKEN in constant time; header only, so the
 * secret never lands in access logs. With no token configured the API is
 * CLOSED — there is deliberately no open-by-default fallback.
 */
export function adminApiAuthorized(req: Request): boolean {
  const token = process.env.ADMIN_API_TOKEN;
  if (!token) return false;
  const header = req.headers.get("authorization") ?? "";
  const presented = header.startsWith("Bearer ") ? header.slice(7) : "";
  const a = Buffer.from(presented);
  const b = Buffer.from(token);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
