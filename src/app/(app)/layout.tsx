import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

  return (
    <PwaGate>
      <div className="flex min-h-screen min-w-0 flex-col overflow-x-clip bg-background">
        <OfflineBanner />
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
    </PwaGate>
  );
}
