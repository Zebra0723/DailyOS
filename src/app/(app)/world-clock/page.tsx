import { createClient } from "@/lib/supabase/server";
import { WorldClock } from "@/components/world-clock";

export const metadata = { title: "World Clock · DailyOS" };

export default async function WorldClockPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return <WorldClock userId={user?.id ?? "anon"} />;
}
