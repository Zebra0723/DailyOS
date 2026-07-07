"use client";

import * as React from "react";
import { loadRemote, saveRemote } from "@/lib/sync";

// Backs the remaining browser-local data up to the account (Supabase user_state)
// so it survives a move to a native wrapper or a new device — not just this
// browser. It mirrors a whitelist of keys, restores anything missing on load,
// and re-saves when you leave. Best-effort: no-ops without the sync table / a
// session. (Plan, HomeOS, Interests and World Clock already sync on their own;
// tasks/events/notes/inbox/vault live in Supabase directly.)
const PREFIXES = [
  "dailyos-mindful-",
  "dailyos-mood-",
  "dailyos-nudges-",
  "dailyos-pinned-notes",
  "dailyos-ignored-codes",
];
const BACKUP_KEY = "device-state";

function snapshot(): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && PREFIXES.some((p) => k.startsWith(p))) {
        const v = localStorage.getItem(k);
        if (v != null) out[k] = v;
      }
    }
  } catch {
    /* ignore */
  }
  return out;
}

export function DeviceBackup() {
  React.useEffect(() => {
    let active = true;
    (async () => {
      const remote = await loadRemote<Record<string, string>>(BACKUP_KEY);
      if (!active) return;
      if (remote && typeof remote === "object") {
        let changed = false;
        for (const [k, v] of Object.entries(remote)) {
          try {
            // Fill only what this device is missing — never clobber local edits.
            if (localStorage.getItem(k) == null && typeof v === "string") {
              localStorage.setItem(k, v);
              changed = true;
            }
          } catch {
            /* ignore */
          }
        }
        if (changed) window.dispatchEvent(new Event("storage"));
      }
      // Push the merged local state up so the account has the latest.
      void saveRemote(BACKUP_KEY, snapshot());
    })();

    const onHide = () => {
      if (document.visibilityState === "hidden") void saveRemote(BACKUP_KEY, snapshot());
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      active = false;
      document.removeEventListener("visibilitychange", onHide);
    };
  }, []);

  return null;
}
