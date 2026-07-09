"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

/** Export everything the user has stored, as a plain JSON object they can
 *  download. Read-only and RLS-scoped to their own rows. */
export async function exportMyData() {
  const { supabase, user } = await requireUser();
  // Fetch a whole table in pages so a heavy account isn't silently capped at
  // PostgREST's default 1000-row limit.
  async function all(table: string) {
    const out: unknown[] = [];
    const size = 1000;
    for (let from = 0; ; from += size) {
      const { data } = await supabase
        .from(table)
        .select("*")
        .range(from, from + size - 1);
      const rows = data ?? [];
      out.push(...rows);
      if (rows.length < size) break;
    }
    return out;
  }

  const [tasks, events, notes, inbox, vault] = await Promise.all([
    all("extracted_tasks"),
    all("calendar_events"),
    all("notes"),
    all("inbox_items"),
    all("vault_items"),
  ]);
  return {
    exported_at: new Date().toISOString(),
    account: { id: user.id, email: user.email },
    tasks,
    calendar_events: events,
    notes,
    inbox_items: inbox,
    vault_items: vault,
  };
}

/** Delete all of a user's content (keeps the account itself). */
export async function deleteAllData() {
  const { supabase, user } = await requireUser();
  // Delete every table explicitly rather than relying on a cascade, so nothing
  // (e.g. a vault row not linked to an inbox item) can survive.
  await supabase.from("extracted_tasks").delete().eq("user_id", user.id);
  await supabase.from("calendar_events").delete().eq("user_id", user.id);
  await supabase.from("notes").delete().eq("user_id", user.id);
  await supabase.from("vault_items").delete().eq("user_id", user.id);
  await supabase.from("processing_logs").delete().eq("user_id", user.id);
  await supabase.from("inbox_items").delete().eq("user_id", user.id);

  // Best-effort: remove stored files under the user's folder.
  const { data: files } = await supabase.storage
    .from("inbox-files")
    .list(user.id);
  if (files?.length) {
    await supabase.storage
      .from("inbox-files")
      .remove(files.map((f) => `${user.id}/${f.name}`));
  }

  return { ok: true as const };
}

/**
 * Permanently delete the account and all data. Requires the service-role key
 * to remove the auth user. Falls back gracefully if it isn't configured.
 */
export async function deleteAccount() {
  const { user } = await requireUser();
  await deleteAllData();

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      ok: false as const,
      error:
        "Account data was cleared, but deleting the login requires SUPABASE_SERVICE_ROLE_KEY to be set on the server.",
    };
  }

  const admin = createServiceClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}
