"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { processInboxItem } from "@/lib/process";
import type {
  ExtractionResult,
  InboxItem,
  Priority,
  VaultCategory,
} from "@/lib/types";

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

export interface CreateItemInput {
  title: string;
  text?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  needsTextExtraction?: boolean;
}

/**
 * Create an inbox item, then run extraction. Returns the new item id so the
 * client can navigate to the review screen.
 */
export async function createInboxItem(input: CreateItemInput) {
  const { supabase, user } = await requireUser();

  const inputType = input.fileUrl ? "file" : "text";

  const { data, error } = await supabase
    .from("inbox_items")
    .insert({
      user_id: user.id,
      title: input.title?.trim() || "Untitled",
      input_type: inputType,
      original_text: input.text?.trim() || null,
      file_url: input.fileUrl ?? null,
      file_name: input.fileName ?? null,
      file_type: input.fileType ?? null,
      status: "pending",
      needs_text_extraction: input.needsTextExtraction ?? false,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false as const, error: error?.message ?? "Could not save item." };
  }

  // Run extraction inline so the review screen is ready on arrival. Guard it so
  // that even if extraction throws unexpectedly, the item is still created and
  // the user lands on the review screen (never a hung "Add to Inbox").
  let status: InboxItem["status"] = "pending";
  try {
    const result = await processInboxItem(data.id);
    status = result.status;
  } catch {
    /* item stays 'pending'; the review screen can re-run extraction */
  }

  revalidatePath("/inbox");
  revalidatePath("/today");

  return { ok: true as const, id: data.id, status };
}

/** Re-run extraction for an existing item (e.g. after adding text). */
export async function reprocessInboxItem(id: string) {
  await requireUser();
  const result = await processInboxItem(id);
  revalidatePath(`/inbox/${id}`);
  revalidatePath("/inbox");
  return result;
}

/** Update the pasted text on an item (used when OCR isn't available). */
export async function updateInboxText(id: string, text: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("inbox_items")
    .update({ original_text: text, needs_text_extraction: false })
    .eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/inbox/${id}`);
  return { ok: true as const };
}

export interface ApprovePayload {
  summary: string;
  itemType: InboxItem["item_type"];
  vaultCategory: VaultCategory;
  tasks: {
    title: string;
    description: string | null;
    due_date: string | null;
    priority: Priority;
  }[];
  events: {
    title: string;
    description: string | null;
    start_time: string | null;
    end_time: string | null;
    location: string | null;
  }[];
}

/**
 * Approve a reviewed item: persist the chosen tasks, events and vault entry,
 * then flip the item to `approved`. Nothing reaches Tasks/Calendar/Vault until
 * this runs.
 */
export async function approveInboxItem(id: string, payload: ApprovePayload) {
  const { supabase, user } = await requireUser();

  // Update the item itself.
  const { error: itemErr } = await supabase
    .from("inbox_items")
    .update({
      status: "approved",
      summary: payload.summary,
      item_type: payload.itemType,
    })
    .eq("id", id);
  if (itemErr) return { ok: false as const, error: itemErr.message };

  // Clear any previously-approved children so re-approving doesn't duplicate.
  await supabase.from("extracted_tasks").delete().eq("inbox_item_id", id);
  await supabase.from("calendar_events").delete().eq("inbox_item_id", id);
  await supabase.from("vault_items").delete().eq("inbox_item_id", id);

  const cleanTasks = payload.tasks.filter((t) => t.title.trim());
  if (cleanTasks.length) {
    const { error } = await supabase.from("extracted_tasks").insert(
      cleanTasks.map((t) => ({
        user_id: user.id,
        inbox_item_id: id,
        title: t.title.trim(),
        description: t.description || null,
        due_date: t.due_date || null,
        priority: t.priority,
        status: "pending" as const,
      })),
    );
    if (error) return { ok: false as const, error: `Tasks: ${error.message}` };
  }

  const cleanEvents = payload.events.filter((e) => e.title.trim() && e.start_time);
  if (cleanEvents.length) {
    const { error } = await supabase.from("calendar_events").insert(
      cleanEvents.map((e) => ({
        user_id: user.id,
        inbox_item_id: id,
        title: e.title.trim(),
        description: e.description || null,
        start_time: e.start_time,
        end_time: e.end_time || null,
        location: e.location || null,
      })),
    );
    if (error) return { ok: false as const, error: `Events: ${error.message}` };
  }

  // Always create / refresh the vault entry so the item is findable.
  const { error: vaultErr } = await supabase.from("vault_items").insert({
    user_id: user.id,
    inbox_item_id: id,
    category: payload.vaultCategory,
    title: (await getTitle(supabase, id)) ?? "Untitled",
    summary: payload.summary,
  });
  if (vaultErr) return { ok: false as const, error: `Vault: ${vaultErr.message}` };

  await supabase.from("processing_logs").insert({
    user_id: user.id,
    inbox_item_id: id,
    status: "approved",
    message: `Approved with ${cleanTasks.length} task(s) and ${cleanEvents.length} event(s).`,
  });

  revalidatePath("/inbox");
  revalidatePath("/today");
  revalidatePath("/tasks");
  revalidatePath("/calendar");
  revalidatePath("/vault");

  return { ok: true as const };
}

async function getTitle(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  id: string,
) {
  const { data } = await supabase
    .from("inbox_items")
    .select("title")
    .eq("id", id)
    .single();
  return data?.title as string | undefined;
}

/** Flip the "handled" flag (set after the user has actioned the report). */
export async function setInboxHandled(id: string, handled: boolean) {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("inbox_items")
    .update({ handled })
    .eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/inbox/${id}`);
  revalidatePath("/inbox");
  revalidatePath("/today");
  return { ok: true as const };
}

/**
 * Detach/clean up everything that points at these inbox items, then delete them.
 * We do this explicitly rather than relying on the database's foreign-key rules,
 * so deletion works no matter how an older database was set up:
 *   - tasks & calendar events you approved are KEPT (their link is set to null),
 *   - the vault entry and processing logs are removed.
 * Scoped to the signed-in user (RLS also enforces this).
 */
async function purgeInboxItems(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  userId: string,
  ids: string[],
) {
  // Keep the to-dos and events; just unlink them from the item being deleted.
  await supabase
    .from("extracted_tasks")
    .update({ inbox_item_id: null })
    .in("inbox_item_id", ids)
    .eq("user_id", userId);
  await supabase
    .from("calendar_events")
    .update({ inbox_item_id: null })
    .in("inbox_item_id", ids)
    .eq("user_id", userId);
  // These belong to the item — remove them.
  await supabase.from("vault_items").delete().in("inbox_item_id", ids).eq("user_id", userId);
  await supabase.from("processing_logs").delete().in("inbox_item_id", ids).eq("user_id", userId);
  // Finally the item itself.
  return supabase.from("inbox_items").delete().in("id", ids).eq("user_id", userId);
}

export async function deleteInboxItem(id: string) {
  const { supabase, user } = await requireUser();
  const { error } = await purgeInboxItems(supabase, user.id, [id]);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/inbox");
  revalidatePath("/today");
  revalidatePath("/tasks");
  revalidatePath("/calendar");
  revalidatePath("/vault");
  return { ok: true as const };
}

/** Delete several inbox items at once. Tasks/events they created are kept (see
 *  deleteInboxItem). Returns how many were removed. */
export async function bulkDeleteInbox(ids: string[]) {
  const { supabase, user } = await requireUser();
  if (!ids.length) return { ok: true as const, count: 0 };
  const { error } = await purgeInboxItems(supabase, user.id, ids);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/inbox");
  revalidatePath("/today");
  revalidatePath("/tasks");
  revalidatePath("/calendar");
  revalidatePath("/vault");
  return { ok: true as const, count: ids.length };
}

/** Mark several inbox items handled / not handled at once. */
export async function bulkSetInboxHandled(ids: string[], handled: boolean) {
  const { supabase } = await requireUser();
  if (!ids.length) return { ok: true as const, count: 0 };
  const { error } = await supabase
    .from("inbox_items")
    .update({ handled })
    .in("id", ids);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/inbox");
  revalidatePath("/today");
  return { ok: true as const, count: ids.length };
}

export type { ExtractionResult };
