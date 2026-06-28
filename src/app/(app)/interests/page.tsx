import { createClient } from "@/lib/supabase/server";
import { InterestsManager } from "@/components/interests-manager";

export const metadata = { title: "Interests · DailyOS" };

export default async function InterestsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return <InterestsManager userId={user?.id ?? "anon"} />;
}
