"use client";

import * as React from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";

const KEY = "dailyos-cookie-consent";

/**
 * A lightweight cookie notice. DailyOS only uses strictly-necessary cookies
 * today, so this is an acknowledgement rather than a consent gate — but it's
 * wired so that if optional (analytics/marketing) cookies are added later, the
 * stored choice can gate them.
 */
export function CookieBanner() {
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      /* ignore */
    }
  }, []);

  function choose(value: "accepted" | "necessary") {
    try {
      localStorage.setItem(KEY, value);
    } catch {
      /* ignore */
    }
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-x-4 bottom-20 z-[60] mx-auto max-w-md rounded-2xl border bg-card p-4 shadow-elevated md:bottom-4 md:left-4 md:right-auto md:mx-0">
      <div className="flex items-start gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
          <Cookie className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium">We use cookies</p>
          <p className="mt-1 text-sm text-muted-foreground">
            DailyOS uses only the essential cookies needed to sign you in and
            remember your settings. We don&rsquo;t use tracking or ads. See our{" "}
            <Link href="/cookies" className="font-medium text-primary hover:underline">
              Cookie Policy
            </Link>
            .
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => choose("accepted")}>
              Got it
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => choose("necessary")}
            >
              Essential only
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
