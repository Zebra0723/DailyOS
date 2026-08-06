"use client";

// ----------------------------------------------------------------------------
// Read-only access to the HomeOS blob for code that lives OUTSIDE HomeOSProvider
// — chiefly the dashboard widgets, which render on /today where the provider
// isn't mounted.
//
// Deliberately read-only. HomeOSProvider treats the remote copy as the winner on
// hydration, so anything that writes the blob from outside has to saveRemote too
// or the edit is silently reverted (see COMMS.md pitfall 7). Widgets are
// glanceable summaries that link into HomeOS to make changes, which sidesteps
// that class of bug entirely.
// ----------------------------------------------------------------------------

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { loadRemote } from "@/lib/sync";
import { homeOSStorageKeyFor, HOMEOS_SYNC_KEY } from "@/lib/homeos/store";
import { DEFAULT_SETTINGS, type HomeOSData } from "@/lib/homeos/types";

/**
 * Fill in collections a stored blob might predate, so a widget can map over any
 * of them without a defensive `?? []` at every call site. An older or partial
 * blob is otherwise a crash waiting to happen.
 */
function normalise(raw: HomeOSData): HomeOSData {
  return {
    ...raw,
    subscriptions: raw.subscriptions ?? [],
    arrivals: raw.arrivals ?? [],
    roomItems: raw.roomItems ?? [],
    devices: raw.devices ?? [],
    documents: raw.documents ?? [],
    alerts: raw.alerts ?? [],
    concerns: raw.concerns ?? [],
    todayActions: raw.todayActions ?? [],
    settings: { ...DEFAULT_SETTINGS, ...raw.settings },
  };
}

function looksLikeHomeOS(v: unknown): v is HomeOSData {
  return Boolean(v) && Array.isArray((v as HomeOSData).subscriptions);
}

function readLocal(key: string): HomeOSData | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return looksLikeHomeOS(parsed) ? normalise(parsed) : null;
  } catch {
    return null;
  }
}

export interface HomeOSSnapshot {
  /** The account's HomeOS data, or null when there is none yet. */
  data: HomeOSData | null;
  /** True once both the local read and the remote reconcile have settled. */
  ready: boolean;
}

/**
 * Snapshot of the signed-in account's HomeOS data: instant paint from this
 * device, then reconciled against the synced copy (remote wins, matching
 * HomeOSProvider).
 */
export function useHomeOSData(): HomeOSSnapshot {
  const [snapshot, setSnapshot] = React.useState<HomeOSSnapshot>({
    data: null,
    ready: false,
  });

  React.useEffect(() => {
    let active = true;

    (async () => {
      let userId: string | undefined;
      try {
        const {
          data: { session },
        } = await createClient().auth.getSession();
        userId = session?.user?.id;
      } catch {
        /* fall through — the anon key still reads this device's own blob */
      }
      if (!active) return;

      const local = readLocal(homeOSStorageKeyFor(userId));
      if (local) setSnapshot({ data: local, ready: false });

      const remote = await loadRemote<HomeOSData>(HOMEOS_SYNC_KEY);
      if (!active) return;
      setSnapshot({
        data: looksLikeHomeOS(remote) ? normalise(remote) : local,
        ready: true,
      });
    })();

    return () => {
      active = false;
    };
  }, []);

  return snapshot;
}
