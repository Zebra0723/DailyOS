import { User, CreditCard, ShieldAlert, Palette, AtSign, Smartphone, Bell } from "lucide-react";
import { InstallApp } from "@/components/install-app";
import { PushToggle } from "@/components/push-toggle";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { SettingsDanger } from "@/components/settings-danger";
import { ExportDataButton } from "@/components/export-data-button";
import { SignOutButton } from "@/components/sign-out-button";
import { InviteButton } from "@/components/invite-button";
import { ModeToggle } from "@/components/mode-toggle";
import { AdminPanel } from "@/components/admin-panel";
import { CalendarSyncCard } from "@/components/calendar-sync-card";
import { UsernameForm } from "@/components/username-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { initials } from "@/lib/utils";
import { APP_VERSION } from "@/lib/version";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata = { title: "Settings · DailyOS" };

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email ?? "you@example.com";
  const username =
    (user?.user_metadata?.username as string | undefined) ??
    email.split("@")[0];
  const createdAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

  return (
    <div className="max-w-2xl">
      <PageHeader title="Settings" description="Manage your account and data." />

      <div className="space-y-6">
        {/* Account */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="size-4 text-primary" /> Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="grid size-12 place-items-center rounded-full bg-primary/10 text-base font-semibold text-primary">
                {initials(username)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{username}</p>
                <p className="truncate text-sm text-muted-foreground">{email}</p>
                <p className="text-xs text-muted-foreground">
                  Member since {createdAt}
                </p>
              </div>
              <SignOutButton />
            </div>
            <div className="mt-4 flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-xs text-sm text-muted-foreground">
                Invite a friend with your own link. When they subscribe to Plus
                or Pro, <strong className="text-foreground">you both</strong> get
                10% off — automatically emailed to each of you.
              </p>
              <InviteButton userId={user?.id} />
            </div>
          </CardContent>
        </Card>

        {/* Owner tools (admin only — renders nothing otherwise) */}
        <AdminPanel userId={user?.id} />

        {/* Username */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AtSign className="size-4 text-primary" /> Username
            </CardTitle>
            <CardDescription>
              The name DailyOS greets you with around the app.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UsernameForm initialUsername={username} />
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Palette className="size-4 text-primary" /> Appearance
            </CardTitle>
            <CardDescription>
              Choose light, dark, or match your device. Remembered on this device.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ModeToggle />
          </CardContent>
        </Card>

        {/* Notifications — opt-in only */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="size-4 text-primary" /> Notifications
            </CardTitle>
            <CardDescription>
              Get a nudge even when DailyOS is closed — for reminders you set,
              upcoming events, and reward codes about to expire. Off until you
              turn it on.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PushToggle />
          </CardContent>
        </Card>

        {/* Install app — subtly accented so it's easy to spot */}
        <Card className="border-primary/30 bg-accent/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Smartphone className="size-4 text-primary" /> Install DailyOS
            </CardTitle>
            <CardDescription>
              Add DailyOS to your home screen — it opens full-screen, works
              offline, and feels like a native app.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InstallApp />
          </CardContent>
        </Card>

        {/* Calendar sync (Pro) */}
        <CalendarSyncCard userId={user?.id} />

        {/* Subscription — link to its own dedicated section */}
        <Link href="/subscriptions" className="block">
          <Card className="transition-colors hover:bg-accent/40">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <CreditCard className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">Subscription &amp; plans</p>
                <p className="text-sm text-muted-foreground">
                  Compare Free, Plus and Pro, upgrade, or enter a code.
                </p>
              </div>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        {/* Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldAlert className="size-4 text-primary" /> Privacy &amp; data
            </CardTitle>
            <CardDescription>
              Your data is locked to your account with row-level security and
              private file storage. You&apos;re always in control.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Download a copy of everything — tasks, events, notes, inbox and
                vault — as a JSON file.
              </p>
              <ExportDataButton />
            </div>
            <SettingsDanger />
            <div className="flex flex-wrap gap-4 border-t pt-4 text-sm">
              <a href="/help" className="text-primary hover:underline">
                Help &amp; FAQs
              </a>
              <a href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </a>
              <a href="/terms" className="text-primary hover:underline">
                Terms of Service
              </a>
            </div>
          </CardContent>
        </Card>

        <p className="pt-2 text-center text-xs text-muted-foreground">
          DailyOS · {APP_VERSION}
        </p>
      </div>
    </div>
  );
}
