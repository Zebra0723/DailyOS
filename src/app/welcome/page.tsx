import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WelcomeScreen } from "@/components/welcome-screen";

export const metadata = { title: "Welcome · DailyOS" };

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: { replay?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // First-run only: once the tour has been seen (finished or skipped) we stamp
  // `onboarded` on the account, so hitting /welcome again — including right
  // after onboarding, or on a normal login — bounces straight to Today. The
  // ?replay=1 escape hatch lets people re-take the tour on demand from Settings.
  const replay = searchParams?.replay === "1";
  if (user.user_metadata?.onboarded === true && !replay) redirect("/today");

  const name =
    (user.user_metadata?.username as string | undefined) ??
    user.email?.split("@")[0] ??
    "";

  return <WelcomeScreen name={name} />;
}
