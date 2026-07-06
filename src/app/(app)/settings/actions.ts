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
  const [tasks, events, notes, inbox, vault] = await Promise.all([
    supabase.from("extracted_tasks").select("*"),
    supabase.from("calendar_events").select("*"),
    supabase.from("notes").select("*"),
    supabase.from("inbox_items").select("*"),
    supabase.from("vault_items").select("*"),
  ]);
  return {
    exported_at: new Date().toISOString(),
    account: { id: user.id, email: user.email },
    tasks: tasks.data ?? [],
    calendar_events: events.data ?? [],
    notes: notes.data ?? [],
    inbox_items: inbox.data ?? [],
    vault_items: vault.data ?? [],
  };
}

/** Delete all of a user's content (keeps the account itself). */
export async function deleteAllData() {
  const { supabase, user } = await requireUser();
  // inbox_items cascades to vault/logs; clear standalone tasks/events too.
  await supabase.from("extracted_tasks").delete().eq("user_id", user.id);
  await supabase.from("calendar_events").delete().eq("user_id", user.id);
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
