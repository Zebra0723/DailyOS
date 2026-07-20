"use client";

import * as React from "react";
import { saveRemote } from "@/lib/sync";

export const TZ_COOKIE = "dailyos-tz";

/** Records the browser's IANA timezone in a cookie so the server can compute
 *  "today"/"tomorrow" in the user's actual timezone, not UTC. Also persists it
 *  to user_state so the daily-brief cron can fire in the user's morning.
 *  Renders nothing. */
export function TimezoneSync() {
  React.useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (!tz) return;
      const current = document.cookie
        .split("; ")
        .find((c) => c.startsWith(`${TZ_COOKIE}=`))
        ?.split("=")[1];
      // Persist to the server once (best-effort) so a scheduled job knows the
      // user's timezone even with no request cookie.
      void saveRemote("timezone", tz);
      if (current === encodeURIComponent(tz)) return;
      const secure = location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `${TZ_COOKIE}=${encodeURIComponent(tz)}; path=/; max-age=31536000; SameSite=Lax${secure}`;
    } catch {
      /* Intl unavailable — server just falls back to UTC */
    }
  }, []);
  return null;
}
