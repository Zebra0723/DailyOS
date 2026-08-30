import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/admin-user";
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
import { BirthdayBanner } from "@/components/birthday-banner";
import { SurveyProvider } from "@/components/survey/survey-provider";
import { BugReportProvider } from "@/components/bug/bug-report-provider";
import { WidgetStoreProvider } from "@/components/widget-store";
import { DashboardProvider } from "@/lib/widgets/dashboard-store";
import { FeaturesProvider } from "@/lib/features-store";
import { GuidedTour } from "@/components/guided-tour";
import { DiscoverySurvey } from "@/components/discovery-survey";
import { RetroModeProvider } from "@/components/retro-mode";

// Gate on live config: this layout decides maintenance mode from app_config on
// every request, so it must never be statically cached or serve a stale read.
export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  // Read app_config with the SERVICE client, not the user's client. app_config
  // has RLS that doesn't grant normal users SELECT, so the user-scoped read
  // always came back null — which is why maintenance mode never showed for
  // anyone (it silently read as "off"). The service client bypasses RLS, the
  // same way the admin app and the settings page already read this row.
  const admin = createServiceClient();
  const [{ data: { user } }, cfgResult] = await Promise.all([
    supabase.auth.getUser(),
    admin.from("app_config").select("value").eq("key", "global").maybeSingle().then(
      (r) => r.data,
      () => null,
    ),
  ]);

  if (!user) redirect("/login");

  const cfg = (cfgResult?.value ?? {}) as {
    announcement?: string;
    maintenance?: boolean;
    hiddenBanners?: string[];
    maintenanceAllowlist?: string[];
  };
  const announcement = cfg.announcement ?? "";
  const maintenance = Boolean(cfg.maintenance);
  const hidden = new Set(cfg.hiddenBanners ?? []);
  const isAdmin = isAdminUser(user);

  // Admins and any account on the owner-picked allowlist keep full access
  // during maintenance; everyone else is held at the "back soon" screen.
  const allowlist = new Set(
    (cfg.maintenanceAllowlist ?? []).map((e) => e.toLowerCase()),
  );
  const maintenanceExempt =
    isAdmin || allowlist.has((user.email ?? "").toLowerCase());

  if (maintenance && !maintenanceExempt) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-6 text-center">
        <div className="max-w-sm">
          <h1 className="font-display text-3xl font-bold">Back soon</h1>
          <p className="mt-3 text-muted-foreground">
            DailyOS is down for a quick bit of maintenance. Your data is safe —
            please check back in a little while.
          </p>
          {/* Team access: sign out and sign back in with an authorised
              account. A non-allowlisted login simply lands back here. */}
          <a
            href="/auth/signout"
            className="mt-6 inline-flex items-center justify-center rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Log in to a different account
          </a>
        </div>
      </div>
    );
  }

  return (
    <PwaGate>
      <RetroModeProvider>
      <SurveyProvider>
        <BugReportProvider>
        <FeaturesProvider
          userId={user.id}
          accountCreatedAt={user.created_at}
          isAdmin={isAdmin}
        >
        <DashboardProvider userId={user.id}>
        <WidgetStoreProvider>
        <div className="flex min-h-screen min-w-0 flex-col overflow-x-clip bg-background">
          {!hidden.has("birthday") && <BirthdayBanner />}
          {!hidden.has("offline") && <OfflineBanner />}
          <AnnouncementBanner text={announcement} />
          <TopNav email={user.email ?? "you@example.com"} userId={user.id} username={(user.user_metadata?.username as string | undefined) ?? undefined} />
          <MobileHeader />
          {!hidden.has("free-plan") && <FreePlanBanner userId={user.id} />}
          <main className="flex-1 pb-bottomnav md:pb-0">
            <div className="container max-w-6xl py-8 md:py-12">{children}</div>
            <AppFooter />
          </main>
          <MobileNav email={user.email ?? "you@example.com"} userId={user.id} username={(user.user_metadata?.username as string | undefined) ?? undefined} />
          <AssistantFab />
          <CommandPalette />
          <DueReminder />
          <LocalReminders />
          <TimezoneSync />
          <DeviceBackup />
          <GuidedTour />
          <DiscoverySurvey userId={user.id} />
        </div>
        </WidgetStoreProvider>
        </DashboardProvider>
        </FeaturesProvider>
        </BugReportProvider>
      </SurveyProvider>
      </RetroModeProvider>
    </PwaGate>
  );
}
