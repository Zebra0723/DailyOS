import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { TasksManager } from "@/components/tasks-manager";
import type { ExtractedTask } from "@/lib/types";

export const metadata = { title: "Tasks · DailyOS" };

export default async function TasksPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("extracted_tasks")
    .select("*")
    .order("status", { ascending: true })
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader
        title="Tasks"
        description="Everything you need to handle, in one tidy list."
      />
      <TasksManager tasks={(data ?? []) as ExtractedTask[]} />
    </div>
  );
}
