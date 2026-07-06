"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarClock, CalendarPlus, Copy, Check, Sparkles, Loader2 } from "lucide-react";
import { usePlan, tierMeets } from "@/lib/use-pro";
import { getCalendarFeedUrl } from "@/app/(app)/settings/calendar-actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

export function CalendarSyncCard({ userId }: { userId?: string }) {
  const { mounted, tier } = usePlan(userId);
  const { toast } = useToast();
  const isPro = tierMeets(tier, "Pro");
  const [feedUrl, setFeedUrl] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    if (isPro && !feedUrl) {
      getCalendarFeedUrl().then((r) => {
        if (active && r.ok && r.url) setFeedUrl(r.url);
      });
    }
    return () => {
      active = false;
    };
  }, [isPro, feedUrl]);

  async function copy() {
    if (!feedUrl) return;
    try {
      await navigator.clipboard.writeText(feedUrl);
      setCopied(true);
      toast({ variant: "success", title: "Calendar link copied" });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ variant: "info", title: feedUrl });
    }
  }

  // A webcal:// URL opens Apple Calendar's subscribe prompt straight away;
  // Google's add-by-URL deep link does the same for Google Calendar.
  const webcalUrl = feedUrl?.replace(/^https?:\/\//, "webcal://") ?? "";
  const googleUrl = feedUrl
    ? `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(webcalUrl)}`
    : "";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="size-4 text-primary" /> Calendar sync
        </CardTitle>
        <CardDescription>
          Add your DailyOS events and due tasks to Apple Calendar, Google
          Calendar or any calendar app — in one tap.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!mounted ? (
          <div className="grid place-items-center py-6 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : !isPro ? (
          <div className="flex flex-col items-start gap-3 rounded-lg border border-primary/20 bg-accent/30 p-4">
            <p className="text-sm">
              Calendar sync is a <strong>Pro</strong> feature.
            </p>
            <Button asChild size="sm">
              <Link href="/subscriptions">
                <Sparkles className="size-4" /> See Pro
              </Link>
            </Button>
          </div>
        ) : !feedUrl ? (
          <div className="grid place-items-center py-6 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <Button asChild>
                <a href={webcalUrl}>
                  <CalendarPlus className="size-4" /> Add to Apple Calendar
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href={googleUrl} target="_blank" rel="noreferrer">
                  <CalendarPlus className="size-4" /> Add to Google Calendar
                </a>
              </Button>
            </div>

            <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2">
              <span className="text-xs text-muted-foreground">
                Using another app? Copy the private link instead.
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={copy}
                className="shrink-0"
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                Copy link
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Tap a button and confirm in your calendar app. It updates
              automatically — keep the link private, as anyone with it can see
              these events.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
