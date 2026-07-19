import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const OWNED: { table: string; label: string }[] = [
  { table: "inbox_items", label: "Drop items" },
  { table: "extracted_tasks", label: "Tasks" },
  { table: "calendar_events", label: "Events" },
  { table: "notes", label: "Notes" },
  { table: "vault_items", label: "Vault items" },
  { table: "push_subscriptions", label: "Push devices" },
];

export default async function UserDetailPage({ params }: { params: { id: string } }) {
  const admin = createServiceClient();
  const { data, error } = await admin.auth.admin.getUserById(params.id);
  const user = data?.user;
  if (error || !user) notFound();

  const counts = await Promise.all(
    OWNED.map(async (o) => {
      const { count } = await admin
        .from(o.table)
        .select("*", { count: "exact", head: true })
        .eq("user_id", params.id);
      return { label: o.label, value: count ?? 0 };
    }),
  );

  const meta = user.user_metadata ?? {};
  const rows: [string, string][] = [
    ["Email", user.email ?? "—"],
    ["User ID", user.id],
    ["Plan", (meta.tier as string) ?? (meta.plan as string) ?? "free"],
    ["Admin", meta.admin ? "yes" : "no"],
    ["Joined", user.created_at ? new Date(user.created_at).toLocaleString() : "—"],
    ["Last sign-in", user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : "—"],
  ];

  const cell: React.CSSProperties = { padding: "6px 10px", borderTop: "1px solid #eee6da", fontSize: 14 };

  return (
    <div>
      <Link href="/admin/users" style={{ fontSize: 13, color: "#6b6157" }}>&larr; Users</Link>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: "8px 0 16px", wordBreak: "break-all" }}>{user.email}</h1>

      <table style={{ width: "100%", maxWidth: 560, marginBottom: 24 }}>
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k}>
              <td style={{ ...cell, color: "#6b6157", width: 140 }}>{k}</td>
              <td style={{ ...cell, wordBreak: "break-all" }}>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 10px" }}>Their data</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
        {counts.map((c) => (
          <div key={c.label} style={{ border: "1px solid #e6ded2", borderRadius: 10, padding: 12, background: "#fff" }}>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{c.value}</div>
            <div style={{ fontSize: 12, color: "#6b6157" }}>{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
