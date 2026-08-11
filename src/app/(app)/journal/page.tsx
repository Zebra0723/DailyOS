import { createClient } from "@/lib/supabase/server";
import { JournalManager } from "@/components/journal";

export const metadata = { title: "Journal · DailyOS" };

export default async function JournalPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return <JournalManager userId={user?.id ?? "anon"} />;
}
