import { createClient } from "@/lib/supabase/server";
import { HomeOSShell } from "@/components/homeos/homeos-app";

export const metadata = { title: "HomeOS · DailyOS" };

export default async function HomeOSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return <HomeOSShell userId={user?.id}>{children}</HomeOSShell>;
}
