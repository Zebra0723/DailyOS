import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Admin accounts get the green home-screen icon; everyone else keeps the red
// default. Server-rendered into the <head>, so iOS reads it on Add to Home Screen.
export async function generateMetadata(): Promise<Metadata> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.user_metadata?.admin) return {};
  return { icons: { apple: "/admin-app-icon.png" } };
}
import { TopNav, MobileNav, MobileHeader } from "@/components/app-nav";
import { FreePlanBanner } from "@/components/free-plan-banner";
import { CommandPalette } from "@/components/command-palette";
import { DueReminder } from "@/components/due-reminder";
import { LocalReminders } from "@/components/local-reminders";
import { AssistantFab } from "@/components/assistant-fab";
import { TimezoneSync } from "@/components/timezone-sync";
import { DeviceBackup } from "@/components/device-backup";
import { AppFooter } from "@/components/app-footer";
import { PwaGate } from "@/components/pwa-gate";
import { OfflineBanner } from "@/components/offline-banner";
import { AnnouncementBanner } from "@/components/announcement-banner";
import { SurveyProvider } from "@/components/survey/survey-provider";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware already guards these routes, but double-check on the server.
  if (!user) redirect("/login");

  // App-wide config set from the admin backend (announcement + maintenance).
  // Degrades to nothing if the app_config table isn't set up.
  let announcement = "";
  let maintenance = false;
  try {
    const { data: cfg } = await supabase
      .from("app_config")
      .select("value")
      .eq("key", "global")
      .maybeSingle();
    const v = (cfg?.value ?? {}) as { announcement?: string; maintenance?: boolean };
    announcement = v.announcement ?? "";
    maintenance = Boolean(v.maintenance);
  } catch {
    /* ignore */
  }
  const isAdmin = Boolean(user.user_metadata?.admin);

  if (maintenance && !isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-6 text-center">
        <div className="max-w-sm">
          <h1 className="font-display text-3xl font-bold">Back soon</h1>
          <p className="mt-3 text-muted-foreground">
            DailyOS is down for a quick bit of maintenance. Your data is safe —
            please check back in a little while.
          </p>
        </div>
      </div>
    );
  }

  return (
    <PwaGate>
      <SurveyProvider>
        <div className="flex min-h-screen min-w-0 flex-col overflow-x-clip bg-background">
          <OfflineBanner />
          <AnnouncementBanner text={announcement} />
          <TopNav email={user.email ?? "you@example.com"} userId={user.id} />
          <MobileHeader />
          <FreePlanBanner userId={user.id} />
          <main className="flex-1 pb-bottomnav md:pb-0">
            <div className="container max-w-6xl py-8 md:py-12">{children}</div>
            <AppFooter />
          </main>
          <MobileNav email={user.email ?? "you@example.com"} userId={user.id} />
          <AssistantFab />
          <CommandPalette />
          <DueReminder />
          <LocalReminders />
          <TimezoneSync />
          <DeviceBackup />
        </div>
      </SurveyProvider>
    </PwaGate>
  );
}
