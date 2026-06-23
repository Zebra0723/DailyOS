"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Trash2, Link2 } from "lucide-react";
import Link from "next/link";
import { setTaskStatus, deleteTask } from "@/app/(app)/tasks/actions";
import { cn, formatDate, relativeDay } from "@/lib/utils";
import { PriorityBadge } from "@/components/badges";
import type { ExtractedTask } from "@/lib/types";

export function TaskItem({ task }: { task: ExtractedTask }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const done = task.status === "completed";

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

      <button
        aria-label="Delete task"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          await deleteTask(task.id);
          router.refresh();
        }}
        className="text-muted-foreground transition-colors hover:text-destructive"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
