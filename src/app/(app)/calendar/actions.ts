"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

export interface EventInput {
  title: string;
  description?: string | null;
  start_time: string;
  end_time?: string | null;
  location?: string | null;
}

export async function createEvent(input: EventInput) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("calendar_events").insert({
    user_id: user.id,
    title: input.title.trim(),
    description: input.description ?? null,
    start_time: input.start_time,
    end_time: input.end_time || null,
    location: input.location ?? null,
  });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/calendar");
  revalidatePath("/today");
  return { ok: true as const };
}

export async function updateEvent(id: string, input: EventInput) {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("calendar_events")
    .update({
      title: input.title.trim(),
      description: input.description ?? null,
      start_time: input.start_time,
      end_time: input.end_time || null,
      location: input.location ?? null,
    })
    .eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/calendar");
  revalidatePath("/today");
  return { ok: true as const };
}

export async function deleteEvent(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("calendar_events").delete().eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/calendar");
  revalidatePath("/today");
  return { ok: true as const };
}
