"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Trash2, Link2, Repeat, Pencil, Loader2 } from "lucide-react";
import Link from "next/link";
import {
  setTaskStatus,
  deleteTask,
  deleteRecurringTask,
  updateTask,
} from "@/app/(app)/tasks/actions";
import { cn, formatDate, relativeDay } from "@/lib/utils";
import { PriorityBadge } from "@/components/badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import type { ExtractedTask, Priority } from "@/lib/types";

export function TaskItem({ task }: { task: ExtractedTask }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, setPending] = React.useState(false);
  const [confirmRepeat, setConfirmRepeat] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [title, setTitle] = React.useState(task.title);
  const [dueDate, setDueDate] = React.useState(task.due_date ?? "");
  const [priority, setPriority] = React.useState<Priority>(
    task.priority ?? "medium",
  );
  const done = task.status === "completed";
  const repeats = !!task.recurrence && task.recurrence !== "none";

  async function saveEdit() {
    if (pending || !title.trim()) return;
    setPending(true);
    const res = await updateTask(task.id, {
      title: title.trim(),
      due_date: dueDate || null,
      priority,
    });
    if (res.ok) {
      toast({ variant: "success", title: "Task updated" });
      setEditing(false);
      router.refresh();
    } else {
      toast({ variant: "error", title: "Couldn't update task" });
    }
    setPending(false);
  }

  async function removeThisOnly() {
    setPending(true);
    await deleteRecurringTask(task.id, "one");
    router.refresh();
  }
  async function removeFuture() {
    setPending(true);
    await deleteRecurringTask(task.id, "future");
    router.refresh();
  }

  const overdue =
    !done &&
    task.due_date &&
    new Date(task.due_date) < new Date(new Date().toDateString());

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors",
        pending && "opacity-60",
      )}
    >
      <button
        aria-label={done ? "Mark incomplete" : "Mark complete"}
        disabled={pending}
        onClick={async () => {
          setPending(true);
          await setTaskStatus(task.id, done ? "pending" : "completed");
          router.refresh();
          setPending(false);
        }}
        className={cn(
          "grid size-6 shrink-0 place-items-center rounded-full border transition-colors",
          done
            ? "border-primary bg-primary text-primary-foreground"
            : "border-input hover:border-primary",
        )}
      >
        {done && <Check className="size-4" />}
      </button>

      <div className="min-w-0 flex-1">
        <p className={cn("font-medium", done && "text-muted-foreground line-through")}>
          {task.title}
        </p>
        {task.description && (
          <p className="truncate text-sm text-muted-foreground">
            {task.description}
          </p>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {task.due_date && (
            <span
              className={cn(
                "text-xs",
                overdue ? "font-medium text-destructive" : "text-muted-foreground",
              )}
            >
              {relativeDay(task.due_date)} · {formatDate(task.due_date)}
            </span>
          )}
          {task.recurrence && task.recurrence !== "none" && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Repeat className="size-3" /> {task.recurrence}
            </span>
          )}
          {task.inbox_item_id && (
            <Link
              href={`/inbox/${task.inbox_item_id}`}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <Link2 className="size-3" /> Source
            </Link>
          )}
        </div>
      </div>

      <PriorityBadge priority={task.priority} />

      {!done && (
        <button
          aria-label="Edit task"
          disabled={pending}
          onClick={() => {
            setTitle(task.title);
            setDueDate(task.due_date ?? "");
            setPriority(task.priority ?? "medium");
            setEditing(true);
          }}
          className="text-muted-foreground transition-colors hover:text-primary"
        >
          <Pencil className="size-4" />
        </button>
      )}

      <button
        aria-label="Delete task"
        disabled={pending}
        onClick={async () => {
          // Recurring tasks ask "this one" vs "all future"; others delete now.
          if (repeats) {
            setConfirmRepeat(true);
            return;
          }
          setPending(true);
          await deleteTask(task.id);
          router.refresh();
        }}
        className="text-muted-foreground transition-colors hover:text-destructive"
      >
        <Trash2 className="size-4" />
      </button>

      {editing && (
        <div
          className="fixed inset-0 z-[65] grid place-items-center bg-foreground/30 p-4 backdrop-blur-sm"
          onClick={() => !pending && setEditing(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border bg-popover p-5 shadow-elevated"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-medium">Edit task</p>
            <div className="mt-4 space-y-3">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs doing?"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") void saveEdit();
                }}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
                <Select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                >
                  <option value="low">Low priority</option>
                  <option value="medium">Medium priority</option>
                  <option value="high">High priority</option>
                </Select>
              </div>
              {repeats && (
                <p className="text-xs text-muted-foreground">
                  This task repeats {task.recurrence}. Edits apply to this
                  occurrence.
                </p>
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditing(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={saveEdit}
                disabled={pending || !title.trim()}
              >
                {pending && <Loader2 className="size-4 animate-spin" />}
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {confirmRepeat && (
        <div
          className="fixed inset-0 z-[65] grid place-items-center bg-foreground/30 p-4 backdrop-blur-sm"
          onClick={() => setConfirmRepeat(false)}
        >
          <div
            className="w-full max-w-xs rounded-2xl border bg-popover p-5 text-center shadow-elevated"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-medium">Delete a repeating task</p>
            <p className="mt-1 text-sm text-muted-foreground">
              &ldquo;{task.title}&rdquo; repeats {task.recurrence}.
            </p>
            <div className="mt-4 grid gap-2">
              <Button
                variant="outline"
                disabled={pending}
                onClick={removeThisOnly}
              >
                Delete this one only
              </Button>
              <Button
                variant="destructive"
                disabled={pending}
                onClick={removeFuture}
              >
                Delete all future repeats
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmRepeat(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
