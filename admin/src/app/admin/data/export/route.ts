import { requireAdminUser } from "@/lib/admin-server";
import { createServiceClient } from "@/lib/supabase/service";
import { DATA_TABLES, type DataTable } from "../tables";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await requireAdminUser();
  const table = new URL(req.url).searchParams.get("table") as DataTable | null;
  if (!table || !DATA_TABLES.includes(table)) return new Response("Unknown table", { status: 400 });

  const admin = createServiceClient();
  const { data } = await admin.from(table).select("*").order("created_at", { ascending: false }).limit(5000);
  const rows = (data ?? []) as Record<string, unknown>[];
  const cols = rows.length ? Object.keys(rows[0]) : ["id"];
  const esc = (v: unknown) =>
    `"${(typeof v === "object" && v !== null ? JSON.stringify(v) : String(v ?? "")).replace(/"/g, '""')}"`;
  const csv = [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
  return new Response(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${table}.csv"` },
  });
}
