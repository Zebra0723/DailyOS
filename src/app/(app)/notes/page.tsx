import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { NotesManager } from "@/components/notes-manager";
import type { Note } from "@/lib/types";

export const metadata = { title: "Notes · DailyOS" };

export default async function NotesPage() {
  const supabase = createClient();
  const [notesRes, { data: auth }] = await Promise.all([
    supabase.from("notes").select("*").order("created_at", { ascending: false }),
    supabase.auth.getUser(),
  ]);
  if (notesRes.error) throw new Error(`Couldn't load notes: ${notesRes.error.message}`);
  const data = notesRes.data;

  return (
    <div>
      <PageHeader
        title="Notes"
        description="Jot anything down. DailyOS files it — and offers a reminder when it spots one."
      />
      <NotesManager notes={(data ?? []) as Note[]} userId={auth.user?.id} />
    </div>
  );
}
