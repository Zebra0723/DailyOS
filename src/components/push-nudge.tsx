"use client";

import * as React from "react";
import { Bell, Loader2, Smartphone, X } from "lucide-react";
import {
  pushSupport,
  notificationPermission,
  isSubscribed,
  enablePush,
  type PushSupport,
} from "@/lib/push";
import { InstallApp } from "@/components/install-app";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

const DISMISS_KEY = "dailyos-push-nudge-dismissed";

/**
 * A one-tap "turn on notifications" prompt that lives right on Today, so it's
 * easy to find instead of buried in Settings. It shows only when this device
 * can receive push but hasn't opted in yet, and disappears the moment
 * notifications are on (or the user dismisses it). Settings still has the full
 * control (test, turn off).
 */
export function PushNudge() {
  const { toast } = useToast();
  const [support, setSupport] = React.useState<PushSupport | null>(null);
  const [permission, setPermission] =
    React.useState<NotificationPermission>("default");
  const [on, setOn] = React.useState<boolean | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    setDismissed(
      typeof window !== "undefined" &&
        window.localStorage.getItem(DISMISS_KEY) === "1",
    );
    setSupport(pushSupport());
    setPermission(notificationPermission());
    void isSubscribed().then(setOn);
  }, []);

  async function turnOn() {
    setBusy(true);
    try {
      const res = await enablePush();
      if (res === "subscribed") {
        setOn(true);
        toast({
          variant: "success",
          title: "Notifications on",
          description: "You'll get reminders even when the app is closed.",
        });
      } else if (res === "denied") {
        setPermission("denied");
        toast({
          variant: "info",
          title: "Permission blocked",
          description: "Allow notifications for DailyOS in your browser settings.",
        });
      } else {
        toast({ variant: "error", title: "Couldn't turn on notifications" });
      }
    } finally {
      setBusy(false);
    }
  }

  function dismiss() {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  }

  // Don't show until we know the state, once opted in, if dismissed, or when
  // the browser can't do push at all / has blocked it (nothing to offer).
  if (
    on === null ||
    support === null ||
    on === true ||
    dismissed ||
    support === "unsupported" ||
    support === "unconfigured" ||
    permission === "denied"
  ) {
    return null;
  }

  // iOS Safari: push only works from the installed app — point them there.
  if (support === "needs-install") {
    return (
      <div className="relative flex flex-col gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <DismissButton onClick={dismiss} />
        <div className="flex items-start gap-3 pr-6">
          <Smartphone className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <p className="font-medium">Get reminders on your iPhone</p>
            <p className="text-sm text-muted-foreground">
              Add DailyOS to your home screen, open it from there, then turn on
              notifications.
            </p>
          </div>
        </div>
        <div className="shrink-0">
          <InstallApp />
        </div>
      </div>
    );
  }

  // support === "ready" and not subscribed yet.
  return (
    <div className="relative flex flex-col gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
      <DismissButton onClick={dismiss} />
      <div className="flex items-start gap-3 pr-6">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
          <Bell className="size-5" />
        </span>
        <div>
          <p className="font-medium">Turn on notifications</p>
          <p className="text-sm text-muted-foreground">
            Get your reminders and event heads-ups even when DailyOS is closed.
          </p>
        </div>
      </div>
      <Button onClick={turnOn} disabled={busy} className="shrink-0">
        {busy ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Bell className="size-4" />
        )}
        Turn on
      </Button>
    </div>
  );
}

function DismissButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Dismiss"
      className="absolute right-2 top-2 grid size-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      <X className="size-4" />
    </button>
  );
}
