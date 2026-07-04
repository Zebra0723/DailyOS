"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Priority, Recurrence, TaskStatus } from "@/lib/types";

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

/** The next due date for a recurring task, based on its current due date. */
function nextDue(due: string, rec: Recurrence): string {
  const d = new Date(`${due}T00:00:00`);
  if (rec === "daily") d.setDate(d.getDate() + 1);
  else if (rec === "weekly") d.setDate(d.getDate() + 7);
  else if (rec === "monthly") d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}

/** True if the error looks like the recurrence column not being migrated yet. */
function isMissingRecurrence(msg?: string): boolean {
  return !!msg && /recurrence/i.test(msg);
}

export interface TaskInput {
  title: string;
  description?: string | null;
  due_date?: string | null;
  priority?: Priority;
  recurrence?: Recurrence;
}

export async function createTask(input: TaskInput) {
  const { supabase, user } = await requireUser();
  const base = {
    user_id: user.id,
    title: input.title.trim(),
    description: input.description ?? null,
    due_date: input.due_date || null,
    priority: input.priority ?? "medium",
    status: "pending" as const,
  };
  const recurrence = input.recurrence ?? "none";

  let { error } = await supabase
    .from("extracted_tasks")
    .insert({ ...base, recurrence });
  // If the recurrence column isn't migrated yet, save the task without it so
  // task creation still works.
  if (error && isMissingRecurrence(error.message)) {
    ({ error } = await supabase.from("extracted_tasks").insert(base));
  }
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
  const { supabase, user } = await requireUser();

  // Completing a recurring task spawns its next occurrence.
  if (status === "completed") {
    const { data: task } = await supabase
      .from("extracted_tasks")
      .select("*")
      .eq("id", id)
      .single();
    const rec = (task?.recurrence ?? "none") as Recurrence;
    if (task && rec !== "none" && task.due_date) {
      await supabase.from("extracted_tasks").insert({
        user_id: user.id,
        title: task.title,
        description: task.description ?? null,
        due_date: nextDue(task.due_date, rec),
        priority: task.priority ?? "medium",
        status: "pending",
        recurrence: rec,
      });
    }
  }

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
