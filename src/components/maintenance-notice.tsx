"use client";

import * as React from "react";
import { Wrench } from "lucide-react";

/**
 * A prominent site-wide banner shown while maintenance mode is on. Driven by
 * the `dailyos-maint` cookie that the middleware stamps on every request from
 * the live app_config — so it shows correctly on STATIC pages (the landing,
 * legal pages) too, which a server-rendered banner couldn't, since those are
 * frozen at build time. The public site stays live during maintenance; only
 * signed-in non-allowlisted accounts are walled off, so this notice is how
 * everyone else knows work is underway.
 */
export function MaintenanceNotice() {
  const [on, setOn] = React.useState(false);

  React.useEffect(() => {
    const cookie = document.cookie
      .split("; ")
      .find((c) => c.startsWith("dailyos-maint="));
    setOn(cookie?.split("=")[1] === "1");
  }, []);

  if (!on) return null;

  return (
    <div className="flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-center text-sm font-semibold text-amber-950">
      <Wrench className="size-4 shrink-0" />
      <span>
        DailyOS is undergoing scheduled maintenance — some things may be
        temporarily unavailable.
      </span>
    </div>
  );
}
