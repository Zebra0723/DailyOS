import { createServiceClient } from "@/lib/supabase/service";
import { RevokeButton } from "./revoke-button";

export const dynamic = "force-dynamic";

export default async function CodesPage() {
  const admin = createServiceClient();
  const { data } = await admin
    .from("reward_codes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  const codes = (data ?? []) as Record<string, unknown>[];

  const cell: React.CSSProperties = { padding: "8px 10px", borderTop: "1px solid #eee6da", fontSize: 13 };

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px" }}>Reward codes</h1>
      <p style={{ color: "#6b6157", fontSize: 14, margin: "0 0 20px" }}>
        {codes.length} code{codes.length === 1 ? "" : "s"}. Revoke to delete one.
      </p>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%" }}>
          <thead>
            <tr style={{ textAlign: "left", color: "#6b6157", fontSize: 12 }}>
              <th style={{ padding: "6px 10px" }}>Code</th>
              <th style={{ padding: "6px 10px" }}>Kind</th>
              <th style={{ padding: "6px 10px" }}>Used</th>
              <th style={{ padding: "6px 10px" }}>Created</th>
              <th style={{ padding: "6px 10px" }}></th>
            </tr>
          </thead>
          <tbody>
            {codes.map((c) => (
              <tr key={String(c.code)}>
                <td style={{ ...cell, fontWeight: 600 }}>{String(c.code)}</td>
                <td style={cell}>{String(c.kind ?? c.plan_tier ?? "—")}</td>
                <td style={cell}>{c.used ? "yes" : "no"}</td>
                <td style={{ ...cell, whiteSpace: "nowrap", color: "#6b6157" }}>
                  {c.created_at ? new Date(String(c.created_at)).toLocaleDateString() : "—"}
                </td>
                <td style={cell}><RevokeButton code={String(c.code)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
