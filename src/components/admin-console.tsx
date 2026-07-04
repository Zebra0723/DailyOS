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
} from "lucide-react";
import { usePlan, setPlan, setAdmin, type Tier } from "@/lib/use-pro";
import { createClient } from "@/lib/supabase/client";
import { buildDemoData } from "@/lib/homeos/demo";
import { homeOSStorageKeyFor } from "@/lib/homeos/store";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export function AdminConsole({
  userId,
  email,
  aiConfigured,
  version,
}: {
  userId?: string;
  email: string;
  aiConfigured: boolean;
  version: string;
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
        <h1 className="mt-4 text-xl font-semibold">Owner testing area</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This is for admin accounts. Enter the ARLEOPRO code in Settings to
          access it.
        </p>
        <Button asChild className="mt-5">
          <Link href="/settings">Go to Settings</Link>
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
    <div className="mx-auto max-w-lg space-y-5">
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
