import {
  User,
  CreditCard,
  ShieldAlert,
  Cpu,
  CheckCircle2,
  XCircle,
  Lock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { SettingsDanger } from "@/components/settings-danger";
import { SignOutButton } from "@/components/sign-out-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { initials } from "@/lib/utils";

export const metadata = { title: "Settings · DailyOS" };

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email ?? "you@dailyos.app";
  const createdAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

  // Read-only view of AI config. Keys are NEVER sent to the client — we only
  // report whether the server has them set.
  const aiConfigured = Boolean(process.env.AI_PROVIDER_API_KEY);
  const aiModel = process.env.AI_MODEL ?? "gpt-4o-mini";
  const aiBase = process.env.AI_PROVIDER_BASE_URL ?? "https://api.openai.com/v1";

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
                {initials(email)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{email}</p>
                <p className="text-sm text-muted-foreground">
                  Member since {createdAt}
                </p>
              </div>
              <SignOutButton />
            </div>
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
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">Free plan</p>
                  <Badge variant="secondary">Current</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  25 inbox items / month
                </p>
              </div>
              <Badge variant="warning">Billing coming soon</Badge>
            </div>
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              Pro (£6/month) with unlimited items, priority processing and family
              sharing is on the way. Payments aren&apos;t live yet — no card needed.
            </div>
          </CardContent>
        </Card>

        {/* AI provider (dev only) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Cpu className="size-4 text-primary" /> AI provider
              <Badge variant="secondary">Development</Badge>
            </CardTitle>
            <CardDescription>
              Configured server-side via environment variables. Keys are never
              exposed to the browser.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Status">
              {aiConfigured ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-600">
                  <CheckCircle2 className="size-4" /> Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <XCircle className="size-4" /> Not configured
                </span>
              )}
            </Row>
            <Row label="Model">
              <code className="rounded bg-muted px-1.5 py-0.5">{aiModel}</code>
            </Row>
            <Row label="Base URL">
              <code className="rounded bg-muted px-1.5 py-0.5">{aiBase}</code>
            </Row>
            <Row label="API key">
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Lock className="size-3.5" />
                {aiConfigured ? "Set (hidden)" : "Add AI_PROVIDER_API_KEY"}
              </span>
            </Row>
            <p className="pt-1 text-xs text-muted-foreground">
              To change the provider, edit <code>.env.local</code> and restart the
              server. Works with any OpenAI-compatible API.
            </p>
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
      </div>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}
