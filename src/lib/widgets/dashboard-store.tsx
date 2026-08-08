"use client";

// ----------------------------------------------------------------------------
// The dashboard's single source of truth.
//
// Previously the widget list lived in <Dashboard>, and the nav-triggered widget
// store reached it through a ref (`_registerDashboard`). That broke in three
// ways: a ref never re-renders, so the store showed a stale "Added" state; the
// store could be opened from pages where <Dashboard> isn't mounted, leaving the
// ref null or pointing at an unmounted component, so adding silently did
// nothing; and the two never agreed on the widget count.
//
// Holding the state in a provider above both fixes all of that: whoever is on
// screen reads and writes the same list.
// ----------------------------------------------------------------------------

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { usePlan } from "@/lib/use-pro";
import { widgetLimitFor, nextTierAfter, type PlanTier } from "@/lib/widgets";

const DASHBOARD_KEY = "dashboard";

interface DashboardState {
  widgets: string[];
}

export type AddResult =
  | { ok: true }
  | { ok: false; reason: "duplicate" }
  | { ok: false; reason: "limit"; limit: number; upgradeTo: "plus" | "pro" | null };

interface DashboardContextValue {
  widgets: string[];
  loaded: boolean;
  tier: PlanTier | string;
  /** Max widgets for this plan. `Infinity` on Pro. */
  limit: number;
  atLimit: boolean;
  addWidget: (id: string) => AddResult;
  removeWidget: (id: string) => void;
  moveWidget: (from: number, to: number) => void;
  setWidgets: (ids: string[]) => void;
}

const DashboardContext = React.createContext<DashboardContextValue | null>(null);

export function useDashboard(): DashboardContextValue {
  const ctx = React.useContext(DashboardContext);
  if (!ctx) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return ctx;
}

/** Safe variant for components that may render outside the provider. */
export function useDashboardOptional(): DashboardContextValue | null {
  return React.useContext(DashboardContext);
}

const localKeyFor = (userId?: string) =>
  userId ? `dailyos-dashboard:${userId}` : null;

export function DashboardProvider({
  userId,
  children,
}: {
  userId?: string;
  children: React.ReactNode;
}) {
  const { tier } = usePlan(userId);
  const [widgets, setWidgetsState] = React.useState<string[]>([]);
  const [loaded, setLoaded] = React.useState(false);

  const localKey = localKeyFor(userId);

  // Read with the server-provided userId rather than the client session. The
  // Supabase client's session can still be the previous account's immediately
  // after signup, which is how brand-new accounts ended up showing someone
  // else's widgets instead of an empty dashboard.
  React.useEffect(() => {
    let active = true;

    (async () => {
      if (!userId) {
        if (active) setLoaded(true);
        return;
      }

      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("user_state")
          .select("value")
          .eq("user_id", userId)
          .eq("key", DASHBOARD_KEY)
          .maybeSingle();
        if (!active) return;

        const remote = data?.value as DashboardState | null;
        if (Array.isArray(remote?.widgets)) {
          // An explicitly empty list is a real answer — a new account starts
          // blank and must stay blank.
          setWidgetsState(remote.widgets);
          setLoaded(true);
          return;
        }
      } catch {
        /* fall through to the local mirror */
      }

      if (!active) return;
      if (localKey) {
        try {
          const raw = localStorage.getItem(localKey);
          const parsed = raw ? JSON.parse(raw) : null;
          if (Array.isArray(parsed?.widgets)) setWidgetsState(parsed.widgets);
        } catch {
          /* ignore malformed cache */
        }
      }
      setLoaded(true);
    })();

    return () => {
      active = false;
    };
  }, [userId, localKey]);

  // Write with the same explicit userId, so a stale client session can't send
  // this account's dashboard to another row.
  const persist = React.useCallback(
    (next: string[]) => {
      setWidgetsState(next);
      if (localKey) {
        try {
          localStorage.setItem(localKey, JSON.stringify({ widgets: next }));
        } catch {
          /* quota — the remote copy is authoritative */
        }
      }
      if (!userId) return;
      void (async () => {
        try {
          const supabase = createClient();
          await supabase
            .from("user_state")
            .upsert(
              { user_id: userId, key: DASHBOARD_KEY, value: { widgets: next } },
              { onConflict: "user_id,key" },
            );
        } catch {
          /* best-effort; the local mirror still has it */
        }
      })();
    },
    [localKey, userId],
  );

  const limit = widgetLimitFor(tier);

  const addWidget = React.useCallback(
    (id: string): AddResult => {
      // Read through a functional update so two quick clicks can't both pass
      // the limit check against the same stale list.
      let result: AddResult = { ok: true };
      setWidgetsState((prev) => {
        if (prev.includes(id)) {
          result = { ok: false, reason: "duplicate" };
          return prev;
        }
        if (prev.length >= limit) {
          result = {
            ok: false,
            reason: "limit",
            limit,
            upgradeTo: nextTierAfter(tier),
          };
          return prev;
        }
        const next = [...prev, id];
        // persist() also calls setWidgetsState, which is a no-op re-entrancy
        // here; scheduling it keeps the reducer pure.
        queueMicrotask(() => persist(next));
        return next;
      });
      return result;
    },
    [limit, tier, persist],
  );

  const removeWidget = React.useCallback(
    (id: string) => persist(widgets.filter((w) => w !== id)),
    [persist, widgets],
  );

  const moveWidget = React.useCallback(
    (from: number, to: number) => {
      const next = [...widgets];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      persist(next);
    },
    [persist, widgets],
  );

  const value = React.useMemo<DashboardContextValue>(
    () => ({
      widgets,
      loaded,
      tier,
      limit,
      atLimit: widgets.length >= limit,
      addWidget,
      removeWidget,
      moveWidget,
      setWidgets: persist,
    }),
    [widgets, loaded, tier, limit, addWidget, removeWidget, moveWidget, persist],
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}
