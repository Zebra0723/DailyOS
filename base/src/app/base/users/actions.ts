"use server";

import { requireAdminUser } from "@/lib/admin-server";
import { createServiceClient } from "@/lib/supabase/service";

export type Result = { ok: boolean; error?: string };

/** Create a user directly (email confirmed) or send an invite email. */
export async function createUserAction(
  email: string,
  mode: "invite" | "create",
  password?: string,
): Promise<Result> {
  await requireAdminUser();
  const trimmed = email.trim();
  if (!trimmed) return { ok: false, error: "Email is required." };
  const admin = createServiceClient();
  try {
    if (mode === "invite") {
      const { error } = await admin.auth.admin.inviteUserByEmail(trimmed);
      if (error) return { ok: false, error: error.message };
    } else {
      const { error } = await admin.auth.admin.createUser({
        email: trimmed,
        password: password && password.length >= 6 ? password : undefined,
        email_confirm: true,
      });
      if (error) return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function deleteUserAction(id: string): Promise<Result> {
  await requireAdminUser();
  const admin = createServiceClient();
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Merge the given keys into user_metadata. Empty-string values delete a key. */
export async function updateMetadataAction(
  id: string,
  patch: Record<string, string>,
): Promise<Result> {
  await requireAdminUser();
  const admin = createServiceClient();
  try {
    const { data, error: getErr } = await admin.auth.admin.getUserById(id);
    if (getErr) return { ok: false, error: getErr.message };
    const current = (data.user?.user_metadata ?? {}) as Record<string, unknown>;
    const next: Record<string, unknown> = { ...current };
    for (const [k, v] of Object.entries(patch)) {
      if (v === "") delete next[k];
      else if (v === "true") next[k] = true;
      else if (v === "false") next[k] = false;
      else next[k] = v;
    }
    const { error } = await admin.auth.admin.updateUserById(id, { user_metadata: next });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
