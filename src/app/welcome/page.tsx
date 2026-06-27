import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WelcomeScreen } from "@/components/welcome-screen";

export const metadata = { title: "Welcome · DailyOS" };

export default async function WelcomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name =
    (user.user_metadata?.username as string | undefined) ??
    user.email?.split("@")[0] ??
    "";

  return <WelcomeScreen name={name} />;
}
