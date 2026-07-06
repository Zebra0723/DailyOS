"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { createTask } from "@/app/(app)/tasks/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

/** A one-line "add a task" box for Today — capture a to-do without leaving the
 *  page. Optionally pass a due date (e.g. today's date) it should default to. */
export function QuickAddTask({ dueDate }: { dueDate?: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function add() {
    const t = title.trim();
    if (!t || busy) return;
    setBusy(true);
    const res = await createTask({ title: t, due_date: dueDate ?? null });
    setBusy(false);
    if (res.ok) {
      setTitle("");
      toast({ variant: "success", title: "Task added" });
      router.refresh();
    } else {
      toast({ variant: "error", title: "Couldn't add task" });
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void add();
      }}
      className="flex items-center gap-2"
    >
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Quick add a task for today…"
        className="flex-1"
      />
      <Button type="submit" disabled={busy || !title.trim()}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
        Add
      </Button>
    </form>
  );
}
