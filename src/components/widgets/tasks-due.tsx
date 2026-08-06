"use client";

import * as React from "react";
import Link from "next/link";
import { CheckSquare, Loader2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuickAddTask } from "@/components/quick-add-task";

interface Task {
  id: string;
  title: string;
  priority: string;
  status: string;
  due_date: string | null;
}

export function TasksDueWidget() {
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    const supabase = createClient();
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from("extracted_tasks")
      .select("*")
      .eq("status", "pending")
      .lte("due_date", today)
      .order("priority", { ascending: false });
    setTasks((data as Task[]) ?? []);
    setLoading(false);
  }, []);

  React.useEffect(() => { load(); }, [load]);

  async function complete(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    const supabase = createClient();
    await supabase.from("extracted_tasks").update({ status: "completed" }).eq("id", id);
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <CheckSquare className="size-4 text-primary" /> Due today
        </CardTitle>
        <Link href="/tasks" className="text-sm text-muted-foreground hover:text-foreground">
          All tasks
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        <QuickAddTask dueDate={today} />
        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="size-4 animate-spin text-muted-foreground" /></div>
        ) : tasks.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Nothing due today. Enjoy the calm.</p>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {tasks.map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-lg border p-3">
                <button onClick={() => complete(t.id)} className="grid size-5 shrink-0 place-items-center rounded border border-primary/40 text-primary/40 transition-colors hover:bg-primary hover:text-primary-foreground">
                  <Check className="size-3" />
                </button>
                <p className="text-sm">{t.title}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
