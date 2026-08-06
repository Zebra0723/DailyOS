"use client";

import * as React from "react";
import { CalendarClock, Check, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Task { id: string; title: string; priority: string }

export function TomorrowPreviewWidget() {
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      const supabase = createClient();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tStr = tomorrow.toISOString().slice(0, 10);
      const { data } = await supabase
        .from("extracted_tasks")
        .select("id, title, priority")
        .eq("status", "pending")
        .eq("due_date", tStr)
        .order("priority", { ascending: false });
      setTasks((data as Task[]) ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="size-4 text-primary" /> Due tomorrow
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="size-4 animate-spin text-muted-foreground" /></div>
        ) : tasks.length === 0 ? (
          <p className="py-2 text-center text-sm text-muted-foreground">Nothing due tomorrow.</p>
        ) : (
          <>
            <p className="mb-3 text-sm text-muted-foreground">A heads-up so tomorrow doesn&apos;t sneak up.</p>
            <div className="grid grid-cols-1 gap-2">
              {tasks.map((t) => (
                <div key={t.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <Check className="size-4 text-muted-foreground" />
                  <p className="text-sm">{t.title}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
