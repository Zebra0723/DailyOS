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

export async function deleteInboxItem(id: string) {
  const { supabase } = await requireUser();
  // Remove everything created from this item first, so nothing is orphaned
  // (tasks, calendar events, the vault entry, and the processing log).
  await supabase.from("extracted_tasks").delete().eq("inbox_item_id", id);
  await supabase.from("calendar_events").delete().eq("inbox_item_id", id);
  await supabase.from("vault_items").delete().eq("inbox_item_id", id);
  await supabase.from("processing_logs").delete().eq("inbox_item_id", id);
  const { error } = await supabase.from("inbox_items").delete().eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/inbox");
  revalidatePath("/today");
  revalidatePath("/tasks");
  revalidatePath("/calendar");
  revalidatePath("/vault");
  return { ok: true as const };
}

export type { ExtractionResult };
