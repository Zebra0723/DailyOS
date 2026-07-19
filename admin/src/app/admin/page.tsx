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

  // Analytics derived from the user list.
  const DAY = 86_400_000;
  const now = new Date(users[0]?.created_at ?? "").getTime() || 0;
  const nowMs = Math.max(now, ...users.map((u) => new Date(u.created_at ?? 0).getTime()), Date.now());
  const plans = { free: 0, plus: 0, pro: 0 };
  let signups7 = 0, signups30 = 0, suspended = 0, admins = 0;
  for (const u of users) {
    const created = new Date(u.created_at ?? 0).getTime();
    if (nowMs - created < 7 * DAY) signups7++;
    if (nowMs - created < 30 * DAY) signups30++;
    const banned = (u as { banned_until?: string }).banned_until;
    if (banned && new Date(banned).getTime() > Date.now()) suspended++;
    // Admins are counted on their own — never as free/paid customers.
    if (u.user_metadata?.admin) { admins++; continue; }
    const tier = (u.user_metadata?.tier as string) ?? (u.user_metadata?.plan as string) ?? "free";
    if (tier === "pro") plans.pro++; else if (tier === "plus") plans.plus++; else plans.free++;
  }
  const customers = Math.max(0, users.length - admins);
  const paid = plans.plus + plans.pro;

  const activity = activityLists.flat().filter((x) => x.at).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 10);
  const recentUsers = users.slice(0, 6);

  const tiles = [
    { label: "Users", value: users.length },
    ...TABLES.map((t, i) => ({ label: t.label, value: counts[i] })),
  ];
  const card: React.CSSProperties = { border: "1px solid #e6ded2", borderRadius: 14, padding: 16, background: "#fffdf9" };

  const planBar = (label: string, n: number, color: string) => {
    const pct = customers ? Math.round((n / customers) * 100) : 0;
    return (
      <div key={label} style={{ marginBottom: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
          <span style={{ fontWeight: 600 }}>{label}</span>
          <span style={{ color: "#6b6157" }}>{n} · {pct}%</span>
        </div>
        <div style={{ height: 8, borderRadius: 6, background: "#efe6d8", overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: color }} />
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px" }}>Overview</h1>
        <p style={{ color: "#6b6157", fontSize: 14, margin: 0 }}>Live across the DailyOS database.</p>
      </div>

      {/* Growth strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))", gap: 12 }}>
        {[
          { label: "New · 7 days", value: signups7 },
          { label: "New · 30 days", value: signups30 },
          { label: "Paid customers", value: paid },
          { label: "Admins", value: admins },
          { label: "Suspended", value: suspended },
        ].map((t) => (
          <div key={t.label} style={{ ...card, borderColor: "#eabf95", background: "#fdf3e8" }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: "#9a3412" }}>{t.value}</div>
            <div style={{ fontSize: 12, color: "#6b6157", marginTop: 2 }}>{t.label}</div>
          </div>
        ))}
      </div>

      {/* Counts */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))", gap: 12 }}>
        {tiles.map((t) => (
          <div key={t.label} style={card}>
            <div style={{ fontSize: 26, fontWeight: 700 }}>{t.value}</div>
            <div style={{ fontSize: 12, color: "#6b6157", marginTop: 2 }}>{t.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        <section style={card}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 2px" }}>Plan breakdown</h2>
          <p style={{ fontSize: 12, color: "#8a8073", margin: "0 0 12px" }}>{customers} customers · {admins} admin{admins === 1 ? "" : "s"} counted separately</p>
          {planBar("Free", plans.free, "#a8a29e")}
          {planBar("Plus", plans.plus, "#c98a1a")}
          {planBar("Pro", plans.pro, "#bf502b")}
        </section>

        <section style={card}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 12px" }}>New sign-ups</h2>
          {recentUsers.length === 0 ? (
            <p style={{ color: "#6b6157", fontSize: 14, margin: 0 }}>No users yet.</p>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {recentUsers.map((u) => (
                <Link key={u.id} href={`/admin/users/${u.id}`} style={{ display: "flex", justifyContent: "space-between", gap: 10, textDecoration: "none", fontSize: 13 }}>
                  <span style={{ color: "#bf502b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email}</span>
                  <span style={{ color: "#8a8073", whiteSpace: "nowrap" }}>{u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}</span>
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
