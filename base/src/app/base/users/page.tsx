import { createServiceClient } from "@/lib/supabase/service";
import { UsersManager, type AuthUserRow } from "@/components/users-manager";

export const dynamic = "force-dynamic";

function serviceConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export default async function UsersPage() {
  if (!serviceConfigured()) {
    return (
      <div className="grid gap-5">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-sm text-[#6b6157]">Auth users manager.</p>
        </div>
        <div className="rounded-2xl border border-[#f0c4bd] bg-[#fbe9e7] p-4 text-sm text-[#9a3412]">
          Service role not configured. Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code>SUPABASE_SERVICE_ROLE_KEY</code> to manage auth users.
        </div>
      </div>
    );
  }

  const admin = createServiceClient();
  let users: AuthUserRow[] = [];
  let error: string | null = null;
  try {
    const { data, error: err } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (err) error = err.message;
    else
      users = data.users.map((u) => ({
        id: u.id,
        email: u.email ?? "",
        createdAt: u.created_at ?? null,
        lastSignInAt: u.last_sign_in_at ?? null,
        metadata: (u.user_metadata ?? {}) as Record<string, unknown>,
      }));
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-sm text-[#6b6157]">
          {error ? "Auth users manager." : `${users.length} auth user${users.length === 1 ? "" : "s"}.`}
        </p>
      </div>
      {error ? (
        <div className="rounded-2xl border border-[#f0c4bd] bg-[#fbe9e7] p-4 text-sm text-[#9a3412]">{error}</div>
      ) : (
        <UsersManager users={users} />
      )}
    </div>
  );
}
