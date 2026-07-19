import type { User } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/service";
import { UserRow } from "./user-row";
import { Warning } from "@/components/warning";

export const dynamic = "force-dynamic";

function isSuspended(u: User): boolean {
  const banned = (u as User & { banned_until?: string }).banned_until;
  return !!banned && new Date(banned).getTime() > Date.now();
}

async function fetchAllUsers(): Promise<User[]> {
  const admin = createServiceClient();
  const all: User[] = [];
  for (let page = 1; page <= 100; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    const batch = data?.users ?? [];
    if (error || batch.length === 0) break;
    all.push(...batch);
    if (batch.length < 1000) break;
  }
  return all;
}

export default async function UsersPage() {
  const users = await fetchAllUsers();
  const th: React.CSSProperties = { padding: "8px 10px" };

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 12px" }}>Users</h1>
      <Warning>Suspending or deleting here locks out or erases that person&apos;s account for good.</Warning>
      <p style={{ color: "#6b6157", fontSize: 14, margin: "0 0 20px" }}>
        {users.length} account{users.length === 1 ? "" : "s"}. Set a plan, toggle admin, suspend, or delete.
      </p>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", fontSize: 14 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "#6b6157", fontSize: 12 }}>
              <th style={th}>Email</th>
              <th style={th}>Status</th>
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
                suspended={isSuspended(u)}
                createdAt={u.created_at ?? ""}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
