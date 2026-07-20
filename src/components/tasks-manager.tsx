"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, CheckSquare } from "lucide-react";
import { createTask } from "@/app/(app)/tasks/actions";
import { TaskItem } from "@/components/task-item";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import type { ExtractedTask, Priority, Recurrence } from "@/lib/types";

type DueFilter = "all" | "today" | "week" | "overdue" | "none";
type PriorityFilter = "all" | Priority;
type StatusFilter = "active" | "completed" | "all";

function withinDays(date: string, days: number) {
  const d = new Date(date);
  const now = new Date(new Date().toDateString());
  const limit = new Date(now);
  limit.setDate(limit.getDate() + days);
  return d >= now && d <= limit;
}

export function TasksManager({ tasks }: { tasks: ExtractedTask[] }) {
  const router = useRouter();
  const { toast } = useToast();

  const [due, setDue] = React.useState<DueFilter>("all");
  const [priority, setPriority] = React.useState<PriorityFilter>("all");
  const [status, setStatus] = React.useState<StatusFilter>("active");

  // Quick-add
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");
  const [newPriority, setNewPriority] = React.useState<Priority>("medium");
  const [recurrence, setRecurrence] = React.useState<Recurrence>("none");
  const [saving, setSaving] = React.useState(false);

  const filtered = React.useMemo(() => {
    const today = new Date(new Date().toDateString());
    return tasks.filter((t) => {
      if (status === "active" && t.status !== "pending") return false;
      if (status === "completed" && t.status !== "completed") return false;
      if (priority !== "all" && t.priority !== priority) return false;
      if (due !== "all") {
        if (due === "none") return !t.due_date;
        if (!t.due_date) return false;
        const d = new Date(t.due_date);
        if (due === "today") return d.getTime() === today.getTime();
        if (due === "week") return withinDays(t.due_date, 7);
        if (due === "overdue") return d < today;
      }
      return true;
    });
  }, [tasks, status, priority, due]);

  async function add() {
    if (!title.trim()) return;
    setSaving(true);
    const res = await createTask({
      title,
      due_date: dueDate || null,
      priority: newPriority,
      recurrence,
    });
    setSaving(false);
    if (res.ok) {
      toast({ variant: "success", title: "Task added" });
      setTitle("");
      setDueDate("");
      setNewPriority("medium");
      setRecurrence("none");
      setOpen(false);
      router.refresh();
    } else {
      toast({ variant: "error", title: "Could not add task" });
    }
  }

  return (
    <div className="space-y-4">
      {/* Quick add */}
      {open ? (
        <Card>
          <CardContent className="space-y-3 pt-5">
            <Input
              autoFocus
              placeholder="What needs doing?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <DatePicker value={dueDate} onChange={setDueDate} />
              <Select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as Priority)}
              >
                <option value="low">Low priority</option>
                <option value="medium">Medium priority</option>
                <option value="high">High priority</option>
              </Select>
            </div>
            <Select
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value as Recurrence)}
              aria-label="Repeat"
            >
              <option value="none">Doesn&apos;t repeat</option>
              <option value="daily">Repeats daily</option>
              <option value="weekly">Repeats weekly</option>
              <option value="monthly">Repeats monthly</option>
            </Select>
            {recurrence !== "none" && !dueDate && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Add a due date so the repeat has a starting point.
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={add} disabled={saving || !title.trim()}>
                {saving && <Loader2 className="size-4 animate-spin" />}
                Add task
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button onClick={() => setOpen(true)} className="w-full sm:w-auto">
          <Plus className="size-4" /> New task
        </Button>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Select
          className="w-auto"
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
        >
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="all">All statuses</option>
        </Select>
        <Select
          className="w-auto"
          value={due}
          onChange={(e) => setDue(e.target.value as DueFilter)}
        >
          <option value="all">Any date</option>
          <option value="overdue">Overdue</option>
          <option value="today">Due today</option>
          <option value="week">Next 7 days</option>
          <option value="none">No date</option>
        </Select>
        <Select
          className="w-auto"
          value={priority}
          onChange={(e) => setPriority(e.target.value as PriorityFilter)}
        >
          <option value="all">Any priority</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </Select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        tasks.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title="No tasks yet"
            description="Add a task manually, or approve an item in the Drop to turn its to-dos into tasks automatically."
            actionLabel="Add to the Drop"
            actionHref="/inbox/new"
          />
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No tasks match these filters.
          </p>
        )
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {filtered.map((t) => (
            <TaskItem key={t.id} task={t} />
          ))}
        </div>
      )}
    </div>
  );
}
