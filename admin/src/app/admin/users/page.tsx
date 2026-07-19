import type { User } from "@supabase/supabase-js";
import { createServiceClient } from "@/lib/supabase/service";
import { UsersTable, type UserRowData } from "./users-table";
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
  const rows: UserRowData[] = users
    .slice()
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))
    .map((u) => ({
      id: u.id,
      email: u.email ?? "(no email)",
      tier: (u.user_metadata?.tier as string) ?? (u.user_metadata?.plan as string) ?? "free",
      isAdmin: Boolean(u.user_metadata?.admin),
      suspended: isSuspended(u),
      createdAt: u.created_at ?? "",
    }));

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 12px" }}>Users</h1>
      <Warning>Suspending or deleting here locks out or erases that person&apos;s account for good.</Warning>
      <UsersTable users={rows} />
    </div>
  );
}
