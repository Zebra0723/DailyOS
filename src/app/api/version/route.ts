import { APP_VERSION } from "@/lib/version";

// Always-fresh endpoint returning the deployed version. The client compares it
// to the version baked into its bundle to detect a stale PWA and self-update.
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    { version: APP_VERSION },
    { headers: { "Cache-Control": "no-store" } },
  );
}
