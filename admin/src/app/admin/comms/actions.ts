"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/admin-server";
import { createServiceClient } from "@/lib/supabase/service";

const MAX_LEN = 4000;

export async function postMessage(body: string) {
  const user = await requireAdminUser();
  const clean = (body ?? "").trim().slice(0, MAX_LEN);
  if (!clean) return { ok: false as const };
  const admin = createServiceClient();
  // Author has seen their own message from the start.
  await admin
    .from("admin_messages")
    .insert({ author_email: user.email, body: clean, read_by: [user.email] });
  revalidatePath("/admin/comms");
  revalidatePath("/admin", "layout");
  return { ok: true as const };
}

export async function deleteMessage(id: string) {
  const user = await requireAdminUser();
  const admin = createServiceClient();
  // Only the author may delete their own message.
  const { data } = await admin
    .from("admin_messages")
    .select("author_email")
    .eq("id", id)
    .maybeSingle();
  if (!data || data.author_email !== user.email) return { ok: false as const };
  await admin.from("admin_messages").delete().eq("id", id);
  revalidatePath("/admin/comms");
  revalidatePath("/admin", "layout");
  return { ok: true as const };
}

/** Best-effort: mark every message as read by the current admin. Never throws. */
export async function markAllRead(_email?: string) {
  const user = await requireAdminUser();
  const email = user.email ?? "";
  if (!email) return;
  try {
    const admin = createServiceClient();
    const { data, error } = await admin
      .from("admin_messages")
      .select("id, read_by")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error || !data) return;
    const toUpdate = data.filter((m: { read_by: unknown }) => {
      const arr = Array.isArray(m.read_by) ? (m.read_by as string[]) : [];
      return !arr.includes(email);
    });
    for (const m of toUpdate) {
      const arr = Array.isArray(m.read_by) ? (m.read_by as string[]) : [];
      await admin
        .from("admin_messages")
        .update({ read_by: [...arr, email] })
        .eq("id", (m as { id: string }).id);
    }
    if (toUpdate.length) revalidatePath("/admin", "layout");
  } catch {
    /* read_by column missing or transient error — badge is nice-to-have */
  }
}
