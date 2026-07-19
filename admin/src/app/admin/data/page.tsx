import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";
import { DATA_TABLES, type DataTable } from "./tables";
import { DeleteButton } from "./delete-button";

export const dynamic = "force-dynamic";

type Client = ReturnType<typeof createServiceClient>;

async function emailMap(admin: Client): Promise<Map<string, string>> {
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const m = new Map<string, string>();
  for (const u of data?.users ?? []) m.set(u.id, u.email ?? "(no email)");
  return m;
}

function summarize(row: Record<string, unknown>): string {
  const first = ["title", "content", "code", "endpoint", "name"].find(
    (k) => typeof row[k] === "string" && (row[k] as string).length,
  );
  const text = first ? String(row[first]) : JSON.stringify(row);
  return text.length > 80 ? text.slice(0, 80) + "…" : text;
}

export default async function DataPage({
  searchParams,
}: {
  searchParams: { table?: string };
}) {
  const table = (DATA_TABLES.includes(searchParams.table as DataTable)
    ? searchParams.table
    : "inbox_items") as DataTable;

  const admin = createServiceClient();
  const [{ data }, emails] = await Promise.all([
    admin.from(table).select("*").order("created_at", { ascending: false }).limit(50),
    emailMap(admin),
  ]);
  const rows = (data ?? []) as Record<string, unknown>[];

  const cell: React.CSSProperties = { padding: "8px 10px", borderTop: "1px solid #eee6da", fontSize: 13, verticalAlign: "top" };

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 12px" }}>Data</h1>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {DATA_TABLES.map((t) => (
          <a key={t} href={`/admin/data?table=${t}`} style={{ fontSize: 13, padding: "5px 10px", borderRadius: 999, textDecoration: "none", border: "1px solid #e6ded2", background: t === table ? "#bf502b" : "#fffdf9", color: t === table ? "#fff" : "#1c1a17" }}>
            {t}
          </a>
        ))}
      </div>
      <p style={{ color: "#6b6157", fontSize: 13, margin: "0 0 12px" }}>
        {rows.length} most recent row{rows.length === 1 ? "" : "s"} in {table}.
      </p>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%" }}>
          <thead>
            <tr style={{ textAlign: "left", color: "#6b6157", fontSize: 12 }}>
              <th style={{ padding: "6px 10px" }}>Summary</th>
              <th style={{ padding: "6px 10px" }}>User</th>
              <th style={{ padding: "6px 10px" }}>Created</th>
              <th style={{ padding: "6px 10px" }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const uid = r.user_id ? String(r.user_id) : "";
              const email = uid ? emails.get(uid) ?? "(unknown)" : "—";
              return (
                <tr key={String(r.id)}>
                  <td style={{ ...cell, wordBreak: "break-word" }}>{summarize(r)}</td>
                  <td style={{ ...cell, whiteSpace: "nowrap" }}>
                    {uid ? (
                      <Link href={`/admin/users/${uid}`} style={{ color: "#bf502b", textDecoration: "none" }}>{email}</Link>
                    ) : "—"}
                  </td>
                  <td style={{ ...cell, whiteSpace: "nowrap", color: "#6b6157" }}>
                    {r.created_at ? new Date(String(r.created_at)).toLocaleDateString() : "—"}
                  </td>
                  <td style={cell}><DeleteButton table={table} id={String(r.id)} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
