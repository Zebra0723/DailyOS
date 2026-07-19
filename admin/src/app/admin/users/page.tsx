import { createServiceClient } from "@/lib/supabase/service";
import { UserRow } from "./user-row";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const admin = createServiceClient();
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const users = data?.users ?? [];

  const th: React.CSSProperties = { padding: "8px 10px" };

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px" }}>Users</h1>
      <p style={{ color: "#a99f92", fontSize: 14, margin: "0 0 20px" }}>
        {users.length} account{users.length === 1 ? "" : "s"}. Set a plan, toggle admin, or delete.
      </p>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", fontSize: 14 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "#a99f92", fontSize: 12 }}>
              <th style={th}>Email</th>
              <th style={th}>Plan</th>
              <th style={th}>Admin</th>
              <th style={th}>Joined</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <UserRow
                key={u.id}
                id={u.id}
                email={u.email ?? "(no email)"}
                tier={(u.user_metadata?.tier as string) ?? (u.user_metadata?.plan as string) ?? "free"}
                isAdmin={Boolean(u.user_metadata?.admin)}
                createdAt={u.created_at ?? ""}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
