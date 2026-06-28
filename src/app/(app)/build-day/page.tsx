import { createClient } from "@/lib/supabase/server";
import { ProGate } from "@/components/pro-gate";
import { BuildMyDay } from "@/components/build-my-day";

export const metadata = { title: "Build My Day · DailyOS" };

export default async function BuildDayPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <ProGate
      feature="Build My Day"
      tier="Plus"
      userId={user?.id}
      blurb="Let AI plan a productive-but-calm day around your hours and commitments. Build My Day is on Plus and Pro."
    >
      <BuildMyDay />
    </ProGate>
  );
}
