"use client";

import * as React from "react";
import { Download, Share, CheckCircle2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Platform =
  | "ios" // iPhone / iPad (Safari)
  | "android" // Android
  | "mac-safari" // macOS desktop Safari
  | "firefox" // Firefox (no PWA install)
  | "desktop"; // desktop Chrome / Edge / other

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  const iOS =
    /iphone|ipad|ipod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (iOS) return "ios";
  if (/android/i.test(ua)) return "android";
  if (/firefox|fxios/i.test(ua)) return "firefox";
  const isSafari = /safari/i.test(ua) && !/chrome|chromium|crios|edg|opr/i.test(ua);
  if (isSafari && /macintosh/i.test(ua)) return "mac-safari";
  return "desktop";
}

/**
 * Offers a real "install this app" action for whatever device you're on:
 * the native prompt where the browser supports it (Android / desktop Chrome &
 * Edge), or clear step-by-step instructions for iOS Safari, macOS Safari, and
 * other desktop browsers. Hides itself once DailyOS is running installed.
 */
export function InstallApp() {
  const [deferred, setDeferred] = React.useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = React.useState(false);
  const [platform, setPlatform] = React.useState<Platform>("desktop");
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

    setPlatform(detectPlatform());
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

  // Native prompt available (Android / desktop Chrome & Edge) — one tap.
  if (deferred) {
    return (
      <Button onClick={install}>
        <Download className="size-4" /> Install DailyOS
      </Button>
    );
  }

  if (platform === "ios") {
    return (
      <Steps
        items={[
          <>Tap the <Share className="mx-1 inline size-4 align-text-bottom" /><strong>Share</strong> button in the Safari toolbar.</>,
          <>Scroll down and choose <strong>Add to Home Screen</strong>.</>,
          <>Open <strong>DailyOS</strong> from your home screen.</>,
        ]}
      />
    );
  }

  if (platform === "mac-safari") {
    return (
      <Steps
        items={[
          <>Click the <Share className="mx-1 inline size-4 align-text-bottom" /><strong>Share</strong> button in the Safari toolbar.</>,
          <>Choose <strong>Add to Dock</strong>.</>,
          <>Open <strong>DailyOS</strong> from your Dock or Launchpad.</>,
        ]}
      />
    );
  }

  if (platform === "android") {
    return (
      <Steps
        items={[
          <>Open the browser menu <MoreVertical className="mx-1 inline size-4 align-text-bottom" /> (top-right).</>,
          <>Tap <strong>Install app</strong> (or <strong>Add to Home screen</strong>).</>,
          <>Open <strong>DailyOS</strong> from your home screen.</>,
        ]}
      />
    );
  }

  if (platform === "firefox") {
    return (
      <p className="text-sm text-muted-foreground">
        Firefox can&apos;t install web apps. Open DailyOS in{" "}
        <strong className="text-foreground">Chrome, Edge or Safari</strong> and
        you&apos;ll get an install option.
      </p>
    );
  }

  // Desktop Chrome / Edge without a fired prompt (already dismissed, etc.).
  return (
    <Steps
      items={[
        <>Click the <strong>install icon</strong> in the address bar (a monitor/＋ icon), or open the browser menu <MoreVertical className="mx-1 inline size-4 align-text-bottom" />.</>,
        <>Choose <strong>Install DailyOS</strong>.</>,
        <>Launch <strong>DailyOS</strong> from your apps or dock.</>,
      ]}
    />
  );
}

function Steps({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="space-y-2.5 text-left text-sm">
      {items.map((item, i) => (
        <li key={i} className="flex items-center gap-3">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold">
            {i + 1}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}
