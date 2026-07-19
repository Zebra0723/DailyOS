import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const TABLES: { table: string; label: string }[] = [
  { table: "inbox_items", label: "Drop items" },
  { table: "extracted_tasks", label: "Tasks" },
  { table: "calendar_events", label: "Events" },
  { table: "notes", label: "Notes" },
  { table: "vault_items", label: "Vault items" },
  { table: "push_subscriptions", label: "Push devices" },
  { table: "reward_codes", label: "Reward codes" },
];

async function countRows(
  admin: ReturnType<typeof createServiceClient>,
  table: string,
): Promise<number> {
  const { count } = await admin.from(table).select("*", { count: "exact", head: true });
  return count ?? 0;
}

export default async function DashboardPage() {
  const admin = createServiceClient();

  const [{ data: userData }, counts] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 1 }),
    Promise.all(TABLES.map((t) => countRows(admin, t.table).catch(() => 0))),
  ]);

  const totalUsers = (userData as unknown as { total?: number })?.total;

  const tiles = [
    { label: "Users", value: totalUsers ?? "—" },
    ...TABLES.map((t, i) => ({ label: t.label, value: counts[i] })),
  ];

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px" }}>Overview</h1>
      <p style={{ color: "#a99f92", fontSize: 14, margin: "0 0 20px" }}>
        Live counts across the DailyOS database.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
        {tiles.map((t) => (
          <div key={t.label} style={{ border: "1px solid #3a322a", borderRadius: 12, padding: 16, background: "#1a1611" }}>
            <div style={{ fontSize: 26, fontWeight: 700 }}>{t.value}</div>
            <div style={{ fontSize: 12, color: "#a99f92", marginTop: 2 }}>{t.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
