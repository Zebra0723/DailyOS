import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { NotesManager } from "@/components/notes-manager";
import type { Note } from "@/lib/types";

export const metadata = { title: "Notes · DailyOS" };

export default async function NotesPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("notes")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader
        title="Notes"
        description="Jot anything down. DailyOS files it — and offers a reminder or a breather when it spots one."
      />
      <NotesManager notes={(data ?? []) as Note[]} />
    </div>
  );
}
