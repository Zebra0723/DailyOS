import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { adminApiAuthorized } from "@/lib/admin-api-auth";
import { APP_VERSION } from "@/lib/version";

// Token-authenticated admin API for external integrations (e.g. a Cloudflare
// Worker pulling live stats). Read-only. Auth is a Bearer token checked against
// ADMIN_API_TOKEN — header only, never a query param, so the secret can't end
// up in access logs.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TABLES = [
  "inbox_items",
  "extracted_tasks",
  "calendar_events",
  "notes",
  "vault_items",
  "push_subscriptions",
] as const;

export async function GET(req: Request) {
  if (!adminApiAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const admin = createServiceClient();

  const counts: Record<string, number> = {};
  await Promise.all(
    TABLES.map(async (table) => {
      const { count } = await admin
        .from(table)
        .select("*", { count: "exact", head: true });
      counts[table] = count ?? 0;
    }),
  );

  let users = 0;
  try {
    const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    users = data?.users?.length ?? 0;
  } catch {
    /* auth admin unavailable — report 0 rather than fail the whole call */
  }

  return NextResponse.json({
    ok: true,
    version: APP_VERSION,
    users,
    tables: counts,
    at: new Date().toISOString(),
  });
}
