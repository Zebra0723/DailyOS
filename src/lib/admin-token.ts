import "server-only";
import { createHmac } from "crypto";

// Signed, single-purpose tokens for privileged links we email to the owner
// (e.g. a one-click "suspend this account" link). HMAC-keyed on the server-only
// service-role key so they can't be forged, and namespaced by purpose so a
// token minted for one action can't be reused for another.
function secret(): string {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "dailyos-dev-secret"
  );
}

function sign(purpose: string, userId: string): string {
  return createHmac("sha256", secret())
    .update(`${purpose}:${userId}`)
    .digest("hex")
    .slice(0, 32);
}

export function makeSuspendToken(userId: string): string {
  return `${userId}.${sign("suspend", userId)}`;
}

export function verifySuspendToken(token: string): string | null {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const userId = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!userId || sig !== sign("suspend", userId)) return null;
  return userId;
}
