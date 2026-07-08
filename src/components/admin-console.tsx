"use client";

import * as React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  FlaskConical,
  CheckCircle2,
  XCircle,
  Database,
  Trash2,
  RotateCcw,
  ClipboardList,
  Circle,
  Heart,
} from "lucide-react";
import { usePlan, setPlan, setAdmin, type Tier } from "@/lib/use-pro";
import { createClient } from "@/lib/supabase/client";
import { buildDemoData } from "@/lib/homeos/demo";
import { homeOSStorageKeyFor } from "@/lib/homeos/store";
import { PageHeader } from "@/components/page-header";
import { DevicePreview } from "@/components/device-preview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type Setup = {
  aiConfigured: boolean;
  emailConfigured: boolean;
  referralsReady: boolean;
  rewardCodesReady: boolean;
  subscriptionsReady: boolean;
};

export function AdminConsole({
  userId,
  email,
  aiConfigured,
  version,
  setup,
}: {
  userId?: string;
  email: string;
  aiConfigured: boolean;
  version: string;
  setup?: Setup;
}) {
  const { mounted, admin, tier } = usePlan(userId);
  const { toast } = useToast();

  if (!mounted) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">Loading…</div>
    );
  }

  if (!admin) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <FlaskConical className="mx-auto size-8 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-semibold">Admin only</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This is an admin-only feature. Please return to the home page.
        </p>
        <Button asChild className="mt-5">
          <Link href="/today">Back to home</Link>
        </Button>
      </div>
    );
  }

  function applyTier(t: Tier) {
    void setPlan(t, userId);
    toast({ variant: "success", title: `Plan set to ${t}` });
  }

  function loadHomeDemo() {
    try {
      localStorage.setItem(
        homeOSStorageKeyFor(userId),
        JSON.stringify(buildDemoData()),
      );
      toast({ variant: "success", title: "HomeOS demo data loaded — open HomeOS" });
    } catch {
      toast({ variant: "error", title: "Couldn't write demo data" });
    }
  }

  function clearHome() {
    try {
      localStorage.removeItem(homeOSStorageKeyFor(userId));
      toast({ variant: "info", title: "HomeOS data cleared" });
    } catch {
      /* ignore */
    }
  }

  function resetOnboarding() {
    void createClient().auth.updateUser({ data: { onboarding: null } });
    toast({ variant: "info", title: "Onboarding reset — revisit /welcome" });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader
        title="Testing"
        description="Owner-only quick controls for testing DailyOS."
      />

      {/* Status */}
      <Card className="border-primary/30 bg-accent/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="size-4 text-primary" /> Status
            <Badge variant="success">Admin</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <Row label="Account" value={email} />
          <Row label="Current plan" value={tier} />
          <Row label="Version" value={version} />
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">AI provider</span>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 font-medium",
                aiConfigured
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-amber-600 dark:text-amber-400",
              )}
            >
              {aiConfigured ? (
                <>
                  <CheckCircle2 className="size-4" /> Configured (real AI)
                </>
              ) : (
                <>
                  <XCircle className="size-4" /> Not set (using fallbacks)
                </>
              )}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Simulate a plan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Simulate a plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {(["free", "plus", "pro"] as Tier[]).map((t) => (
              <Button
                key={t}
                variant={tier === t ? "default" : "outline"}
                size="sm"
                onClick={() => applyTier(t)}
              >
                {t === tier ? `${t} (current)` : `Set ${t}`}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Set <strong>Free</strong> to check paywalls; <strong>Pro</strong> to
            unlock everything.
          </p>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => setAdmin(true, userId)}>
              Admin on
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void setAdmin(false, userId);
                toast({ variant: "info", title: "Admin off (this page will hide)" });
              }}
            >
              Admin off
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="size-4 text-primary" /> Test data
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={loadHomeDemo}>
            <Database className="size-4" /> Load HomeOS demo
          </Button>
          <Button variant="outline" size="sm" onClick={clearHome}>
            <Trash2 className="size-4" /> Clear HomeOS
          </Button>
          <Button variant="outline" size="sm" onClick={resetOnboarding}>
            <RotateCcw className="size-4" /> Reset onboarding
          </Button>
        </CardContent>
      </Card>

      {/* Memories — where DailyOS started */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Heart className="size-4 text-primary" /> Memories
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border bg-card/60 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium">The first working DailyOS</p>
              <Badge variant="success">v1 · 23 Jun 2026</Badge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              The day the whole thing first stood up: the Life Inbox, AI that
              read receipts and letters, and tasks, calendar and the Vault to
              catch what it found. Rough around the edges, but it worked — and
              everything since grew from here.
            </p>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            From that first build to{" "}
            <strong className="text-foreground">{version}</strong>. Keep going. 💛
          </p>
        </CardContent>
      </Card>

      {/* What still needs your logins (Leo can't do these) */}
      {setup && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="size-4 text-primary" /> Your setup
              checklist
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              These need your own accounts and keys, so they&apos;re on you — not
              Leo. Each one lights up green here once it&apos;s live.
            </p>
            <SetupItem
              done={setup.emailConfigured}
              title="Transactional email (Resend)"
              detail="Create a Resend account, verify a sending domain, then add RESEND_API_KEY and EMAIL_FROM in Vercel. Until then, referral reward emails are skipped (referrals still count)."
            />
            <SetupItem
              done={setup.referralsReady}
              title="Run migration 0005_referrals.sql"
              detail="Paste supabase/migrations/0005_referrals.sql into the Supabase SQL editor so referrals are stored and countable."
            />
            <SetupItem
              done={setup.rewardCodesReady}
              title="Run migration 0006_reward_codes.sql"
              detail="Enables the single-use reward codes + the prize ladder (10% → 3mo Plus → 1yr Pro → lifetime). Until it's run, codes report 'not active yet'."
            />
            <SetupItem
              done={setup.subscriptionsReady}
              title="Payments (Stripe) — real 'pays' signal"
              detail="Run 0002_subscriptions.sql and add Stripe keys so a real subscription triggers rewards. For now, a friend entering a paid code stands in for a payment."
            />
            <SetupItem
              done={aiConfigured}
              title="AI provider key"
              detail="Add the AI provider key in Vercel for real inbox parsing and Ask DailyOS answers."
            />
            <SetupItem
              done={false}
              title="Google / Apple Calendar OAuth (two-way)"
              detail="One-way subscribe already works. Two-way import needs Google/Apple OAuth credentials you set up — a future step."
            />
          </CardContent>
        </Card>
      )}

      {/* Real-app preview across devices */}
      <DevicePreview />
    </div>
  );
}

function SetupItem({
  done,
  title,
  detail,
}: {
  done: boolean;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border p-3">
      {done ? (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
      ) : (
        <Circle className="mt-0.5 size-4 shrink-0 text-amber-500" />
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate font-medium">{value}</span>
    </div>
  );
}
