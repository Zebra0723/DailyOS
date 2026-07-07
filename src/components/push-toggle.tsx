"use client";

import * as React from "react";
import { Bell, BellOff, Loader2, Check, Smartphone, Send } from "lucide-react";
import {
  pushSupport,
  notificationPermission,
  isSubscribed,
  enablePush,
  disablePush,
  type PushSupport,
} from "@/lib/push";
import { sendTestPush } from "@/app/(app)/settings/push-actions";
import { InstallApp } from "@/components/install-app";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

/**
 * The push opt-in. Nothing is ever sent unless the user turns this on — one
 * explicit choice. Handles every state: unsupported browser, iOS-needs-install,
 * permission denied, on, and off. Lives in Settings.
 */
export function PushToggle() {
  const { toast } = useToast();
  const [support, setSupport] = React.useState<PushSupport | null>(null);
  const [permission, setPermission] =
    React.useState<NotificationPermission>("default");
  const [on, setOn] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [testing, setTesting] = React.useState(false);

  const refresh = React.useCallback(async () => {
    setSupport(pushSupport());
    setPermission(notificationPermission());
    setOn(await isSubscribed());
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  async function turnOn() {
    setBusy(true);
    try {
      const res = await enablePush();
      if (res === "subscribed") {
        toast({ variant: "success", title: "Notifications on" });
      } else if (res === "denied") {
        toast({
          variant: "info",
          title: "Permission blocked",
          description: "Allow notifications for DailyOS in your browser settings.",
        });
      } else {
        toast({ variant: "error", title: "Couldn't turn on notifications" });
      }
    } finally {
      await refresh();
      setBusy(false);
    }
  }

  async function turnOff() {
    setBusy(true);
    try {
      await disablePush();
      toast({ variant: "info", title: "Notifications off" });
    } finally {
      await refresh();
      setBusy(false);
    }
  }

  async function test() {
    setTesting(true);
    try {
      const res = await sendTestPush();
      if (res.ok) {
        toast({ variant: "success", title: "Test sent — watch for it!" });
      } else {
        toast({
          variant: "info",
          title: "Nothing sent",
          description: "No active device, or notifications aren't set up yet.",
        });
      }
    } catch {
      toast({ variant: "error", title: "Couldn't send a test" });
    } finally {
      setTesting(false);
    }
  }

  // Loading (first paint) — keep it quiet.
  if (support === null) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Checking…
      </div>
    );
  }

  if (support === "unconfigured") {
    return (
      <p className="text-sm text-muted-foreground">
        Push notifications aren&apos;t switched on for DailyOS just yet — check
        back soon.
      </p>
    );
  }

  if (support === "unsupported") {
    return (
      <p className="text-sm text-muted-foreground">
        This browser doesn&apos;t support notifications. Try DailyOS on Chrome,
        Edge, Firefox, or an installed iPhone app.
      </p>
    );
  }

  if (support === "needs-install") {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <Smartphone className="mt-0.5 size-4 shrink-0 text-primary" />
          <p>
            On iPhone &amp; iPad, notifications work once DailyOS is added to your
            home screen. Install it first, open it from the home screen, then come
            back here to turn them on.
          </p>
        </div>
        <InstallApp />
      </div>
    );
  }

  // support === "ready"
  if (permission === "denied") {
    return (
      <p className="text-sm text-muted-foreground">
        Notifications are blocked for DailyOS in your browser. Re-allow them in
        your browser&apos;s site settings, then reload this page.
      </p>
    );
  }

  if (on) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm">
          <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
          <span className="font-medium">Notifications are on for this device.</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={test} disabled={testing}>
            {testing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            Send a test
          </Button>
          <Button variant="ghost" size="sm" onClick={turnOff} disabled={busy}>
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <BellOff className="size-4" />
            )}
            Turn off
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button onClick={turnOn} disabled={busy}>
        {busy ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Bell className="size-4" />
        )}
        Turn on notifications
      </Button>
      <p className="text-xs text-muted-foreground">
        You&apos;ll only get useful nudges: reminders you set, events coming up,
        and reward codes about to expire. Turn them off any time.
      </p>
    </div>
  );
}
