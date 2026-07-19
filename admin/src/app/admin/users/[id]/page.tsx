import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import { UserActions } from "../user-actions";

export const dynamic = "force-dynamic";

const OWNED: { table: string; label: string }[] = [
  { table: "inbox_items", label: "Drop items" },
  { table: "extracted_tasks", label: "Tasks" },
  { table: "calendar_events", label: "Events" },
  { table: "notes", label: "Notes" },
  { table: "vault_items", label: "Vault items" },
  { table: "push_subscriptions", label: "Push devices" },
];
const RECENT: { table: string; label: string }[] = [
  { table: "inbox_items", label: "Drop" },
  { table: "extracted_tasks", label: "Task" },
  { table: "calendar_events", label: "Event" },
  { table: "notes", label: "Note" },
];

export default async function UserDetailPage({ params }: { params: { id: string } }) {
  const admin = createServiceClient();
  const { data, error } = await admin.auth.admin.getUserById(params.id);
  const user = data?.user;
  if (error || !user) notFound();

  const [counts, recentLists] = await Promise.all([
    Promise.all(OWNED.map(async (o) => {
      const { count } = await admin.from(o.table).select("*", { count: "exact", head: true }).eq("user_id", params.id);
      return { label: o.label, value: count ?? 0 };
    })),
    Promise.all(RECENT.map(async (r) => {
      const { data: rows } = await admin.from(r.table).select("*").eq("user_id", params.id).order("created_at", { ascending: false }).limit(5);
      return (rows ?? []).map((row: Record<string, unknown>) => ({
        label: r.label,
        text: String(row.title ?? row.content ?? row.summary ?? row.id ?? "").slice(0, 80) || "(untitled)",
        at: row.created_at ? String(row.created_at) : "",
      }));
    })),
  ]);
  const recent = recentLists.flat().filter((x) => x.at).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 12);

  const meta = user.user_metadata ?? {};
  const tier = (meta.tier as string) ?? (meta.plan as string) ?? "free";
  const banned = (user as { banned_until?: string }).banned_until;
  const suspended = !!banned && new Date(banned).getTime() > Date.now();

  const rows: [string, string][] = [
    ["Email", user.email ?? "—"],
    ["User ID", user.id],
    ["Plan", tier],
    ["Admin", meta.admin ? "yes" : "no"],
    ["Status", suspended ? "Suspended" : "Active"],
    ["Joined", user.created_at ? new Date(user.created_at).toLocaleString() : "—"],
    ["Last sign-in", user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : "—"],
  ];
  const cell: React.CSSProperties = { padding: "6px 10px", borderTop: "1px solid #eee6da", fontSize: 14 };
  const card: React.CSSProperties = { border: "1px solid #e6ded2", borderRadius: 14, padding: 16, background: "#fffdf9" };

  return (
    <div>
      <Link href="/admin/users" style={{ fontSize: 13, color: "#6b6157" }}>&larr; Users</Link>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: "8px 0 16px", wordBreak: "break-all" }}>{user.email}</h1>

      <table style={{ width: "100%", maxWidth: 560, marginBottom: 20 }}>
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k}>
              <td style={{ ...cell, color: "#6b6157", width: 140 }}>{k}</td>
              <td style={{ ...cell, wordBreak: "break-all" }}>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <UserActions id={user.id} email={user.email ?? ""} tier={tier} isAdmin={Boolean(meta.admin)} suspended={suspended} />

      <h2 style={{ fontSize: 15, fontWeight: 700, margin: "4px 0 10px" }}>Their data</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10, marginBottom: 24 }}>
        {counts.map((c) => (
          <div key={c.label} style={{ ...card, padding: 12 }}>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{c.value}</div>
            <div style={{ fontSize: 12, color: "#6b6157" }}>{c.label}</div>
          </div>
        ))}
      </div>

      <section style={card}>
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px" }}>Recent activity</h2>
        {recent.length === 0 ? (
          <p style={{ color: "#6b6157", fontSize: 14, margin: 0 }}>Nothing yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {recent.map((a, i) => (
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
  );
}
