"use client";

import * as React from "react";
import { Download, Share, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/** Offers a real "install this app" action: the native prompt where available
 *  (Android / desktop Chrome/Edge), or the Share → Add to Home Screen steps on
 *  iOS. Hides itself once DailyOS is running as an installed app. */
export function InstallApp() {
  const [deferred, setDeferred] = React.useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = React.useState(false);
  const [isIOS, setIsIOS] = React.useState(false);
  const [standalone, setStandalone] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as InstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    const ua = navigator.userAgent || "";
    setIsIOS(/iphone|ipad|ipod/i.test(ua));
    const nav = navigator as Navigator & { standalone?: boolean };
    setStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
        nav.standalone === true,
    );

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!mounted) return null;

  if (standalone || installed) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
        DailyOS is installed on this device.
      </p>
    );
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferred(null);
  }

  if (deferred) {
    return (
      <Button onClick={install}>
        <Download className="size-4" /> Install DailyOS
      </Button>
    );
  }

  if (isIOS) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Share className="size-4 text-primary" />
        Tap the Share button, then <strong className="text-foreground">Add to
        Home Screen</strong>.
      </p>
    );
  }

  return (
    <p className="text-sm text-muted-foreground">
      Open your browser menu and choose <strong className="text-foreground">Install
      app</strong> (or <em>Add to Home Screen</em>) to keep DailyOS a tap away.
    </p>
  );
}
