import { createClient } from "@/lib/supabase/server";
import { TripsManager } from "@/components/trips-manager";

export const metadata = { title: "Trips · DailyOS" };

export default async function TripsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return <TripsManager userId={user?.id ?? "anon"} />;
}
