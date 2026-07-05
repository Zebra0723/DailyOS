"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Remove a single entry from the vault. This deletes only the vault record —
 * the original inbox item (and any tasks/events) stay put. RLS scopes the
 * delete to the signed-in user.
 */
export async function deleteVaultItem(id: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const { error } = await supabase.from("vault_items").delete().eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/vault");
  return { ok: true as const };
}
