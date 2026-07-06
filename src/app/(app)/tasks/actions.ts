"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { addDaysYmd, addMonthsYmd } from "@/lib/dates-tz";
import type { Priority, Recurrence, TaskStatus } from "@/lib/types";

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

/**
 * The next due date for a recurring task. Uses calendar-correct helpers so
 * month lengths and leap years are respected (a monthly task due Jan 31 next
 * falls due Feb 28, or Feb 29 in a leap year — never spilling into March) and
 * there's no timezone day-shift.
 */
function nextDue(due: string, rec: Recurrence): string {
  if (rec === "daily") return addDaysYmd(due, 1);
  if (rec === "weekly") return addDaysYmd(due, 7);
  if (rec === "monthly") return addMonthsYmd(due, 1);
  return due;
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

/**
 * Delete a recurring task with calendar-style semantics:
 * - "one":    remove just this occurrence but keep the series going (spawns the
 *             next occurrence, like skipping this one).
 * - "future": remove this occurrence and stop all future repeats.
 */
export async function deleteRecurringTask(id: string, mode: "one" | "future") {
  const { supabase, user } = await requireUser();

  if (mode === "one") {
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

  const { error } = await supabase.from("extracted_tasks").delete().eq("id", id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/tasks");
  revalidatePath("/today");
  return { ok: true as const };
}
