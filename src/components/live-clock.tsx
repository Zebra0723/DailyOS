"use client";

import * as React from "react";
import { Clock } from "lucide-react";

/** Live local time, ticking each minute. Mounts client-side to avoid a
 *  server/client time mismatch. */
export function LiveClock() {
  const [now, setNow] = React.useState<Date | null>(null);

  React.useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = now
    ? now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : "--:--";

  return (
    <span className="inline-flex items-center gap-1.5 tabular-nums">
      <Clock className="size-3.5 text-muted-foreground" />
      {time}
    </span>
  );
}
