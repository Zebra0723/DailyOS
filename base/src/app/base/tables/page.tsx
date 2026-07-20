import { createServiceClient } from "@/lib/supabase/service";
import { runSql, managementConfigured } from "@/lib/management";
import { TableBrowser, type ColumnInfo } from "@/components/table-browser";

export const dynamic = "force-dynamic";

const TABLES = [
  "inbox_items", "extracted_tasks", "calendar_events", "notes", "vault_items",
  "push_subscriptions", "reward_codes", "user_state", "app_config",
  "admin_audit", "admin_reminders", "scheduled_pushes", "push_log",
  "processing_logs", "referrals", "feedback",
];

async function loadColumns(table: string): Promise<ColumnInfo[]> {
  if (!managementConfigured()) return [];
  const res = await runSql(
    `select column_name, data_type, is_nullable, column_default
       from information_schema.columns
      where table_schema = 'public' and table_name = '${table.replace(/'/g, "''")}'
      order by ordinal_position;`,
  );
  if (!res.ok || !res.rows) return [];
  return res.rows.map((r) => ({
    name: String(r.column_name),
    type: String(r.data_type),
    nullable: r.is_nullable === "YES",
    hasDefault: r.column_default !== null,
  }));
}

export default async function TablesPage({
  searchParams,
}: {
  searchParams: { t?: string };
}) {
  const table = TABLES.includes(searchParams.t ?? "") ? searchParams.t! : TABLES[0];
  const admin = createServiceClient();

  let rows: Record<string, unknown>[] = [];
  let error: string | null = null;
  try {
    const res = await admin.from(table).select("*").limit(100);
    if (res.error) error = res.error.message;
    else rows = (res.data ?? []) as Record<string, unknown>[];
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  const columns = await loadColumns(table);

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-bold">Tables</h1>
        <p className="text-sm text-[#6b6157]">Browse and manage rows. Latest 100 shown.</p>
      </div>
      <TableBrowser
        tables={TABLES}
        current={table}
        rows={rows}
        error={error}
        columns={columns}
        canEdit={managementConfigured()}
      />
    </div>
  );
}
