import { User, CreditCard, ShieldAlert, Palette, AtSign } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { SettingsDanger } from "@/components/settings-danger";
import { SignOutButton } from "@/components/sign-out-button";
import { ModeToggle } from "@/components/mode-toggle";
import { PricingTable } from "@/components/pricing-table";
import { UsernameForm } from "@/components/username-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { initials } from "@/lib/utils";
import { APP_VERSION } from "@/lib/version";

export const metadata = { title: "Settings · DailyOS" };

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email ?? "you@dailyos.app";
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
          </CardContent>
        </Card>

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

        {/* Billing placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="size-4 text-primary" /> Subscription
            </CardTitle>
            <CardDescription>Your plan and billing.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">Free plan</p>
                  <Badge variant="secondary">Current</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  15 life-admin updates &amp; 30 events / month · no Vault
                </p>
              </div>
              <Badge variant="warning">Billing coming soon</Badge>
            </div>
            <PricingTable compact />
          </CardContent>
        </Card>

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
          <CardContent>
            <SettingsDanger />
          </CardContent>
        </Card>

        <p className="pt-2 text-center text-xs text-muted-foreground">
          DailyOS · {APP_VERSION}
        </p>
      </div>
    </div>
  );
}
