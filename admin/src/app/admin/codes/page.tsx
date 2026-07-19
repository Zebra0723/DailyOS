import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";
import { RevokeButton } from "./revoke-button";
import { Warning } from "@/components/warning";

export const dynamic = "force-dynamic";

type Client = ReturnType<typeof createServiceClient>;

async function emailMap(admin: Client): Promise<Map<string, string>> {
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const m = new Map<string, string>();
  for (const u of data?.users ?? []) m.set(u.id, u.email ?? "(no email)");
  return m;
}

export default async function CodesPage() {
  const admin = createServiceClient();
  const [{ data }, emails] = await Promise.all([
    admin.from("reward_codes").select("*").order("created_at", { ascending: false }).limit(200),
    emailMap(admin),
  ]);
  const codes = (data ?? []) as Record<string, unknown>[];

  const cell: React.CSSProperties = { padding: "8px 10px", borderTop: "1px solid #eee6da", fontSize: 13 };

  function whoFor(c: Record<string, unknown>): { id: string; email: string } | null {
    const id = (c.recipient_id ?? c.user_id ?? c.owner_id) as string | undefined;
    if (!id) return null;
    return { id, email: emails.get(id) ?? "(unknown)" };
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 12px" }}>Reward codes</h1>
      <Warning>Revoking a code deletes a reward that may belong to a real user.</Warning>
      <p style={{ color: "#6b6157", fontSize: 14, margin: "0 0 20px" }}>
        {codes.length} code{codes.length === 1 ? "" : "s"}. Revoke to delete one.
      </p>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%" }}>
          <thead>
            <tr style={{ textAlign: "left", color: "#6b6157", fontSize: 12 }}>
              <th style={{ padding: "6px 10px" }}>Code</th>
              <th style={{ padding: "6px 10px" }}>For</th>
              <th style={{ padding: "6px 10px" }}>Kind</th>
              <th style={{ padding: "6px 10px" }}>Used</th>
              <th style={{ padding: "6px 10px" }}>Created</th>
              <th style={{ padding: "6px 10px" }}></th>
            </tr>
          </thead>
          <tbody>
            {codes.map((c) => {
              const who = whoFor(c);
              return (
                <tr key={String(c.code)}>
                  <td style={{ ...cell, fontWeight: 600 }}>{String(c.code)}</td>
                  <td style={{ ...cell, whiteSpace: "nowrap" }}>
                    {who ? (
                      <Link href={`/admin/users/${who.id}`} style={{ color: "#bf502b", textDecoration: "none" }}>{who.email}</Link>
                    ) : "—"}
                  </td>
                  <td style={cell}>{String(c.kind ?? c.plan_tier ?? "—")}</td>
                  <td style={cell}>{c.used ? "yes" : "no"}</td>
                  <td style={{ ...cell, whiteSpace: "nowrap", color: "#6b6157" }}>
                    {c.created_at ? new Date(String(c.created_at)).toLocaleDateString() : "—"}
                  </td>
                  <td style={cell}><RevokeButton code={String(c.code)} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
