"use client";

import * as React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  FlaskConical,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Database,
  Trash2,
  RotateCcw,
  ExternalLink,
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

type LinkItem = { href: string; label: string; note: string };

const GROUPS: { heading: string; items: LinkItem[] }[] = [
  {
    heading: "LifeOS",
    items: [
      { href: "/today", label: "Today", note: "Masthead, stats, launcher" },
      { href: "/inbox/new", label: "Add to Inbox", note: "Paste/upload + AI extract" },
      { href: "/inbox", label: "Inbox", note: "List + review states" },
      { href: "/build-day", label: "Build My Day", note: "Plan + edit blocks" },
      { href: "/interests", label: "Interests", note: "Tiered mini-plan" },
      { href: "/world-clock", label: "World Clock", note: "Add cities" },
      { href: "/notes", label: "Notes", note: "Capture + nudges" },
      { href: "/calendar", label: "Calendar", note: "Month grid + events" },
      { href: "/tasks", label: "Tasks", note: "Add/complete/filter" },
      { href: "/vault", label: "Vault", note: "Gated (Plus+)" },
    ],
  },
  {
    heading: "HomeOS (Pro)",
    items: [
      { href: "/homeos", label: "Dashboard", note: "Score + recommendations" },
      { href: "/homeos/urgent", label: "Urgent", note: "House concerns" },
      { href: "/homeos/subscriptions", label: "SubscriptionOS", note: "Renewals/trials" },
      { href: "/homeos/arrivals", label: "ArrivalOS", note: "Deliveries" },
      { href: "/homeos/rooms", label: "RoomOS", note: "Room items" },
      { href: "/homeos/devices", label: "DeviceOS", note: "Warranties/maintenance" },
      { href: "/homeos/vault", label: "Home Vault", note: "Documents" },
      { href: "/homeos/calendar", label: "Calendar", note: "Combined dates" },
      { href: "/homeos/alerts", label: "Alerts", note: "Open/snoozed" },
      { href: "/homeos/settings", label: "Settings", note: "Profile/thresholds/data" },
    ],
  },
  {
    heading: "Wellbeing & account",
    items: [
      { href: "/mindfulness", label: "Mindfulness", note: "Once-a-day flow" },
      { href: "/mood", label: "Mood", note: "Log mood" },
      { href: "/nudges", label: "Nudges", note: "Finale animation" },
      { href: "/settings", label: "Settings", note: "Plans, owner tools" },
      { href: "/privacy", label: "Privacy", note: "Legal page" },
      { href: "/terms", label: "Terms", note: "Legal page" },
    ],
  },
];

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
          This console is for admin accounts. Enter the ARLEOPRO code in Settings,
          or use the owner unlock, to access it.
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
      toast({ variant: "success", title: "HomeOS demo data loaded" });
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
    <div className="space-y-6">
      <PageHeader
        title="Testing console"
        description="Owner-only. Flip plans, seed data, and jump straight into every part of DailyOS."
      />

      {/* Status */}
      <Card className="border-primary/30 bg-accent/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="size-4 text-primary" /> Status
            <Badge variant="success">Admin</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <Row label="Account" value={email} />
          <Row label="Current plan" value={tier} />
          <Row label="Version" value={version} />
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">AI provider</span>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 font-medium",
                aiConfigured ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400",
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

      {/* Plan controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Simulate a plan</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
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
          <div className="mx-1 w-px bg-border" />
          <Button variant="outline" size="sm" onClick={() => setAdmin(true, userId)}>
            Admin on
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void setAdmin(false, userId);
              toast({ variant: "info", title: "Admin turned off on this device" });
            }}
          >
            Admin off
          </Button>
          <p className="mt-1 w-full text-xs text-muted-foreground">
            Set Free to see paywalls; Pro to unlock everything. Turning admin off
            hides this console.
          </p>
        </CardContent>
      </Card>

      {/* Data tools */}
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

      {/* Feature grid */}
      {GROUPS.map((g) => (
        <div key={g.heading}>
          <h2 className="mb-3 font-display text-lg font-semibold tracking-tight">
            {g.heading}
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {g.items.map((it) => (
              <Link key={it.href} href={it.href}>
                <Card className="h-full transition-colors hover:bg-accent/40">
                  <CardContent className="flex items-center gap-3 p-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 text-sm font-medium">
                        {it.label}
                        <span className="text-[11px] font-normal text-muted-foreground">
                          {it.href}
                        </span>
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{it.note}</p>
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}

      <p className="flex items-center justify-center gap-1.5 pt-2 text-center text-xs text-muted-foreground">
        <ExternalLink className="size-3" /> Links open the real pages — use your
        browser back button to return here.
      </p>
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
