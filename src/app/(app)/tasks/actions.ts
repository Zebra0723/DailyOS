"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Priority, TaskStatus } from "@/lib/types";

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

export interface TaskInput {
  title: string;
  description?: string | null;
  due_date?: string | null;
  priority?: Priority;
}

export async function createTask(input: TaskInput) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("extracted_tasks").insert({
    user_id: user.id,
    title: input.title.trim(),
    description: input.description ?? null,
    due_date: input.due_date || null,
    priority: input.priority ?? "medium",
    status: "pending",
  });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/tasks");
  revalidatePath("/today");
  return { ok: true as const };
}

export async function updateTask(id: string, input: Partial<TaskInput>) {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("extracted_tasks")
    .update({
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.due_date !== undefined ? { due_date: input.due_date || null } : {}),
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
    })
    .eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/tasks");
  revalidatePath("/today");
  return { ok: true as const };
}

export async function setTaskStatus(id: string, status: TaskStatus) {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("extracted_tasks")
    .update({ status })
    .eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/tasks");
  revalidatePath("/today");
  return { ok: true as const };
}

export async function deleteTask(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("extracted_tasks").delete().eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/tasks");
  revalidatePath("/today");
  return { ok: true as const };
}
