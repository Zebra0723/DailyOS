"use client";

import * as React from "react";

export const TZ_COOKIE = "dailyos-tz";

/** Records the browser's IANA timezone in a cookie so the server can compute
 *  "today"/"tomorrow" in the user's actual timezone, not UTC. Renders nothing. */
export function TimezoneSync() {
  React.useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (!tz) return;
      const current = document.cookie
        .split("; ")
        .find((c) => c.startsWith(`${TZ_COOKIE}=`))
        ?.split("=")[1];
      if (current === encodeURIComponent(tz)) return;
      const secure = location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `${TZ_COOKIE}=${encodeURIComponent(tz)}; path=/; max-age=31536000; SameSite=Lax${secure}`;
    } catch {
      /* Intl unavailable — server just falls back to UTC */
    }
  }, []);
  return null;
}
