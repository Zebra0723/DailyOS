"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/admin-user";

export type UserRow = {
  id: string;
  email: string;
  tier: "free" | "plus" | "pro";
  isAdmin: boolean;
  createdAt: string;
};

/** Resolve a user's effective plan tier. */
function effectiveTier(u: {
  user_metadata?: Record<string, unknown>;
}): "free" | "plus" | "pro" {
  const meta = u.user_metadata ?? {};
  const raw = (meta.tier as string) ?? (meta.plan as string) ?? "free";
  if (raw !== "plus" && raw !== "pro") return "free";
  const exp = meta.plan_exp;
  const expMs = exp == null ? 0 : Number(exp);
  if (expMs > 0 && Date.now() > expMs) return "free";
  return raw;
}

export async function fetchUsers(
  page: number,
  perPage: number,
): Promise<{ users: UserRow[]; total: number }> {
  // Admin guard
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminUser(user)) {
    return { users: [], total: 0 };
  }

  const admin = createServiceClient();

  // Fetch all users (Supabase admin API paginates at 1000 max)
  const allUsers: Array<{
    id: string;
    email?: string;
    created_at?: string;
    user_metadata?: Record<string, unknown>;
    app_metadata?: Record<string, unknown>;
  }> = [];
  for (let p = 1; p <= 100; p++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page: p,
      perPage: 1000,
    });
    const batch = data?.users ?? [];
    if (error || batch.length === 0) break;
    allUsers.push(...batch);
    if (batch.length < 1000) break;
  }

  // Sort newest first
  allUsers.sort((a, b) =>
    (b.created_at ?? "").localeCompare(a.created_at ?? ""),
  );

  const total = allUsers.length;
  const start = (page - 1) * perPage;
  const slice = allUsers.slice(start, start + perPage);

  const users: UserRow[] = slice.map((u) => ({
    id: u.id,
    email: u.email ?? "(no email)",
    tier: effectiveTier(u),
    isAdmin: u.app_metadata?.admin === true,
    createdAt: u.created_at ?? "",
  }));

  return { users, total };
}
