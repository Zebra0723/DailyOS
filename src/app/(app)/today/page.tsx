import { createClient } from "@/lib/supabase/server";
import { LiveClock } from "@/components/live-clock";
import { LanguagePicker } from "@/components/language-picker";
import { PushNudge } from "@/components/push-nudge";
import { Dashboard } from "@/components/dashboard";

export const metadata = { title: "Today · DailyOS" };

export default async function TodayPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const name =
    (user?.user_metadata?.username as string | undefined) ??
    user?.email?.split("@")[0] ??
    "there";

  const dateLabel = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="space-y-6">
      <header className="border-b border-foreground/15 pb-6">
        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          <span className="inline-flex items-center gap-x-3">
            <span>The Daily Brief</span>
            <LanguagePicker />
          </span>
          <span className="inline-flex items-center gap-x-2">
            <span className="hidden sm:inline">{dateLabel}</span>
            <span className="text-muted-foreground/40">&middot;</span>
            <LiveClock />
          </span>
        </div>
        <div className="mt-5">
          <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            {getGreeting()}, {name}
          </h1>
          <p className="mt-2 max-w-md text-muted-foreground">
            Your dashboard, your way. Add and arrange the widgets you need.
          </p>
        </div>
      </header>

      <PushNudge />

      <Dashboard userId={user?.id} />
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
