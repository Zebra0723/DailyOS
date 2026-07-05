import "server-only";
import { createHmac } from "crypto";

// The calendar feed is reached by calendar apps that can't send auth cookies,
// so the URL itself carries a signed token: "<userId>.<hmac>". The HMAC is keyed
// on the server-only service-role key, so tokens can't be forged and no extra
// secret or table is needed.
function secret(): string {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "dailyos-dev-secret"
  );
}

function sign(userId: string): string {
  return createHmac("sha256", secret()).update(userId).digest("hex").slice(0, 32);
}

export function makeFeedToken(userId: string): string {
  return `${userId}.${sign(userId)}`;
}

export function verifyFeedToken(token: string): string | null {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const userId = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!userId || sig !== sign(userId)) return null;
  return userId;
}
