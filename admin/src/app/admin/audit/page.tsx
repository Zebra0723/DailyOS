import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const admin = createServiceClient();
  const { data, error } = await admin.from("admin_audit").select("*").order("created_at", { ascending: false }).limit(200);
  const rows = (data ?? []) as Record<string, unknown>[];
  const cell: React.CSSProperties = { padding: "8px 10px", borderTop: "1px solid #eee6da", fontSize: 13, verticalAlign: "top" };

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px" }}>Audit log</h1>
      <p style={{ color: "#6b6157", fontSize: 14, margin: "0 0 20px" }}>Recent admin actions.</p>
      {error ? (
        <div style={{ background: "#fbe9e7", border: "1px solid #f0c4bd", borderRadius: 10, padding: 14, fontSize: 14 }}>
          The <code>admin_audit</code> table isn&apos;t set up yet. Run the setup SQL, then refresh.
        </div>
      ) : rows.length === 0 ? (
        <p style={{ color: "#6b6157", fontSize: 14 }}>Nothing logged yet.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%" }}>
            <thead>
              <tr style={{ textAlign: "left", color: "#6b6157", fontSize: 12 }}>
                <th style={{ padding: "6px 10px" }}>When</th>
                <th style={{ padding: "6px 10px" }}>Who</th>
                <th style={{ padding: "6px 10px" }}>Action</th>
                <th style={{ padding: "6px 10px" }}>Detail</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={String(r.id)}>
                  <td style={{ ...cell, whiteSpace: "nowrap", color: "#6b6157" }}>{r.created_at ? new Date(String(r.created_at)).toLocaleString() : "—"}</td>
                  <td style={{ ...cell, whiteSpace: "nowrap" }}>{String(r.actor ?? "—")}</td>
                  <td style={{ ...cell, fontWeight: 600 }}>{String(r.action ?? "—")}</td>
                  <td style={{ ...cell, wordBreak: "break-word" }}>{String(r.detail ?? "")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
