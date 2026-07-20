"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

const INTERVAL_MS = 30_000;

/** Small header control: toggle 30s auto-refresh (default off) + last-updated time.
 *  `renderedAt` is the server render timestamp — it changes on every refresh. */
export function AutoRefresh({ renderedAt }: { renderedAt: number }) {
  const router = useRouter();
  const [on, setOn] = useState(false);
  const [pending, start] = useTransition();
  const savedOn = useRef(on);
  savedOn.current = on;

  const time = new Date(renderedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  useEffect(() => {
    if (!on) return;
    const id = setInterval(() => {
      if (savedOn.current) start(() => router.refresh());
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, [on, router]);

  return (
    <div className="flex items-center gap-3 text-xs text-[#8a8073]">
      <span suppressHydrationWarning>Updated {time}</span>
      <button
        type="button"
        onClick={() => start(() => router.refresh())}
        disabled={pending}
        aria-label="Refresh now"
        className="rounded-lg border border-[#e6ded2] bg-[#fffdf9] p-1.5 text-[#6b6157] transition-colors hover:bg-[#f2e6da] disabled:opacity-50"
      >
        <RefreshCw className={`size-3.5 ${pending ? "animate-spin" : ""}`} />
      </button>
      <button
        type="button"
        onClick={() => setOn((v) => !v)}
        aria-pressed={on}
        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-medium transition-colors ${
          on
            ? "border-[#bf502b] bg-[#bf502b] text-white"
            : "border-[#e6ded2] bg-[#fffdf9] text-[#6b6157] hover:bg-[#f2e6da]"
        }`}
      >
        <span className={`size-1.5 rounded-full ${on ? "bg-white" : "bg-[#a89b8a]"}`} />
        Auto-refresh {on ? "on" : "off"}
      </button>
    </div>
  );
}
