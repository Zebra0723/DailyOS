import Link from "next/link";
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

const ACTIVITY: { table: string; label: string }[] = [
  { table: "inbox_items", label: "Drop" },
  { table: "extracted_tasks", label: "Task" },
  { table: "calendar_events", label: "Event" },
  { table: "notes", label: "Note" },
];

type Client = ReturnType<typeof createServiceClient>;

async function countRows(admin: Client, table: string): Promise<number> {
  const { count } = await admin.from(table).select("*", { count: "exact", head: true });
  return count ?? 0;
}

async function recentFrom(admin: Client, table: string, label: string) {
  const { data } = await admin.from(table).select("*").order("created_at", { ascending: false }).limit(6);
  return (data ?? []).map((r: Record<string, unknown>) => ({
    label,
    text: String(r.title ?? r.content ?? r.summary ?? r.id ?? "").slice(0, 80) || "(untitled)",
    at: r.created_at ? String(r.created_at) : "",
  }));
}

export default async function DashboardPage() {
  const admin = createServiceClient();

  const [{ data: userData }, counts, activityLists] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    Promise.all(TABLES.map((t) => countRows(admin, t.table).catch(() => 0))),
    Promise.all(ACTIVITY.map((a) => recentFrom(admin, a.table, a.label).catch(() => []))),
  ]);

  const users = (userData?.users ?? []).slice().sort((a, b) =>
    (b.created_at ?? "").localeCompare(a.created_at ?? ""),
  );
  const recentUsers = users.slice(0, 6);

  const activity = activityLists
    .flat()
    .filter((x) => x.at)
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 10);

  const tiles = [
    { label: "Users", value: users.length },
    ...TABLES.map((t, i) => ({ label: t.label, value: counts[i] })),
  ];

  const card: React.CSSProperties = { border: "1px solid #e6ded2", borderRadius: 14, padding: 16, background: "#fffdf9" };

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px" }}>Overview</h1>
        <p style={{ color: "#6b6157", fontSize: 14, margin: 0 }}>Live across the DailyOS database.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))", gap: 12 }}>
        {tiles.map((t) => (
          <div key={t.label} style={card}>
            <div style={{ fontSize: 26, fontWeight: 700 }}>{t.value}</div>
            <div style={{ fontSize: 12, color: "#6b6157", marginTop: 2 }}>{t.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        <section style={card}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 12px" }}>New sign-ups</h2>
          {recentUsers.length === 0 ? (
            <p style={{ color: "#6b6157", fontSize: 14, margin: 0 }}>No users yet.</p>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {recentUsers.map((u) => (
                <Link key={u.id} href={`/admin/users/${u.id}`} style={{ display: "flex", justifyContent: "space-between", gap: 10, textDecoration: "none", fontSize: 13 }}>
                  <span style={{ color: "#bf502b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</span>
                  <span style={{ color: "#8a8073", whiteSpace: "nowrap" }}>
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section style={card}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 12px" }}>Recent activity</h2>
          {activity.length === 0 ? (
            <p style={{ color: "#6b6157", fontSize: 14, margin: 0 }}>Nothing yet.</p>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {activity.map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 10, fontSize: 13 }}>
                  <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, color: "#9a3f26", background: "#f2e3d3", borderRadius: 6, padding: "1px 6px", height: "fit-content" }}>{a.label}</span>
                  <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.text}</span>
                  <span style={{ color: "#8a8073", whiteSpace: "nowrap" }}>{new Date(a.at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
