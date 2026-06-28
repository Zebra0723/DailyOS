"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { analyzeNote } from "@/lib/ai/note";
import type { Note, NoteAnalysis } from "@/lib/types";

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

/** Save a note, returning the saved row + the instant smart analysis. */
export async function createNote(content: string): Promise<
  | { ok: true; note: Note; analysis: NoteAnalysis }
  | { ok: false; error: string }
> {
  const trimmed = content.trim();
  if (!trimmed) return { ok: false, error: "Write something first." };

  const { supabase, user } = await requireUser();
  const analysis = analyzeNote(trimmed);

  const { data, error } = await supabase
    .from("notes")
    .insert({ user_id: user.id, content: trimmed, category: analysis.category })
    .select("*")
    .single<Note>();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not save note." };
  }

  revalidatePath("/notes");
  return { ok: true, note: data, analysis };
}

export async function deleteNote(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/notes");
  return { ok: true as const };
}
