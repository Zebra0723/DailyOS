import type { User } from "@supabase/supabase-js";
import { requireAdminUser } from "@/lib/admin-server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireAdminUser();
  const admin = createServiceClient();
  const users: User[] = [];
  for (let page = 1; page <= 100; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    const batch = data?.users ?? [];
    if (error || batch.length === 0) break;
    users.push(...batch);
    if (batch.length < 1000) break;
  }
  const esc = (s: unknown) => `"${String(s ?? "").replace(/"/g, '""')}"`;
  const header = "email,plan,admin,suspended,created_at,last_sign_in_at";
  const lines = users.map((u) => {
    const tier = (u.user_metadata?.tier as string) ?? (u.user_metadata?.plan as string) ?? "free";
    const banned = (u as User & { banned_until?: string }).banned_until;
    const susp = !!banned && new Date(banned).getTime() > Date.now();
    return [esc(u.email), esc(tier), esc(Boolean(u.user_metadata?.admin)), esc(susp), esc(u.created_at), esc(u.last_sign_in_at)].join(",");
  });
  const csv = [header, ...lines].join("\n");
  return new Response(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="dailyos-users.csv"' },
  });
}
