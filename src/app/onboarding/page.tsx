import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingFlow } from "@/components/onboarding-flow";
import { isOnboarding } from "@/lib/onboarding";

export const metadata = { title: "Welcome to DailyOS" };

export default async function OnboardingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Already personalised? Skip straight in.
  if (isOnboarding(user.user_metadata?.onboarding)) redirect("/today");

  const initialName =
    (user.user_metadata?.username as string | undefined) ??
    user.email?.split("@")[0] ??
    "";

  return <OnboardingFlow initialName={initialName} />;
}
