"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarClock, Copy, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

export function CalendarSyncCard({ feedUrl }: { feedUrl: string | null }) {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="size-4 text-primary" /> Calendar sync
        </CardTitle>
        <CardDescription>
          Subscribe to your DailyOS events and due tasks in Apple Calendar,
          Google Calendar or any calendar app.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {feedUrl ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Input readOnly value={feedUrl} className="text-xs" />
              <Button type="button" variant="outline" size="icon" onClick={copy}>
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
            </div>
            <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">How to add it</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                <li>
                  <strong>iPhone / Apple:</strong> Calendar → Calendars → Add
                  Calendar → <em>Add Subscription Calendar</em> → paste the link.
                </li>
                <li>
                  <strong>Google Calendar:</strong> Other calendars → + → From
                  URL → paste the link.
                </li>
              </ul>
              <p className="mt-2 text-xs">
                It updates automatically. Keep this link private — anyone with it
                can see these events.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-3 rounded-lg border border-primary/20 bg-accent/30 p-4">
            <p className="text-sm">
              Calendar sync is a <strong>Pro</strong> feature.
            </p>
            <Button asChild size="sm">
              <Link href="#plans">
                <Sparkles className="size-4" /> See Pro
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
