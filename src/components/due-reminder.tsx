"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";

/**
 * In-app reminder: once per day, when you open the app, nudge you if any tasks
 * are due today or overdue. Best-effort and silent on any error. (Real push
 * notifications — arriving when the app is closed — need extra setup.)
 */
export function DueReminder() {
  const { toast } = useToast();

  React.useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const key = `dailyos-due-reminded:${today}`;
    try {
      if (localStorage.getItem(key)) return; // already checked today
    } catch {
      return;
    }

    let active = true;
    (async () => {
      try {
        const supabase = createClient();
        const { count, error } = await supabase
          .from("extracted_tasks")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending")
          .lte("due_date", today);
        if (!active || error) return;
        try {
          localStorage.setItem(key, "1"); // only remind once per day
        } catch {
          /* ignore */
        }
        if (count && count > 0) {
          toast({
            variant: "info",
            title: `${count} task${count > 1 ? "s" : ""} due today or overdue`,
          });
        }
      } catch {
        /* ignore */
      }
    })();

    return () => {
      active = false;
    };
  }, [toast]);

  return null;
}
