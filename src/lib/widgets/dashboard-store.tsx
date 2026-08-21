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
import { widgetLimitFor, type PlanTier } from "@/lib/widgets";
import { decideAdd, type AddResult } from "./add-decision";

const DASHBOARD_KEY = "dashboard";

interface DashboardState {
  widgets: string[];
  /** ms epoch of the write that produced this copy — newer copy wins on load. */
  updatedAt?: number;
}

export type { AddResult };

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
  const { tier, admin, resolved: planResolved } = usePlan(userId);
  const [widgets, setWidgetsState] = React.useState<string[]>([]);
  const [loaded, setLoaded] = React.useState(false);

  const localKey = localKeyFor(userId);

  // Read with the server-provided userId rather than the client session. The
  // Supabase client's session can still be the previous account's immediately
  // after signup, which is how brand-new accounts ended up showing someone
  // else's widgets instead of an empty dashboard.
  React.useEffect(() => {
    let active = true;

    const readLocal = (): DashboardState | null => {
      if (!localKey) return null;
      try {
        const raw = localStorage.getItem(localKey);
        const parsed = raw ? (JSON.parse(raw) as DashboardState) : null;
        return parsed && Array.isArray(parsed.widgets) ? parsed : null;
      } catch {
        return null; /* malformed cache */
      }
    };

    const loadLocal = () => {
      const local = readLocal();
      if (local) setWidgetsState(local.widgets);
      setLoaded(true);
    };

    if (!userId) {
      if (active) setLoaded(true);
      return () => { active = false; };
    }

    const timeout = setTimeout(() => {
      if (!active) return;
      loadLocal();
    }, 4000);

    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("user_state")
          .select("value")
          .eq("user_id", userId)
          .eq("key", DASHBOARD_KEY)
          .maybeSingle();
        if (!active) return;

        clearTimeout(timeout);
        const remote = data?.value as DashboardState | null;
        if (Array.isArray(remote?.widgets)) {
          // The local mirror is written synchronously on every change; the
          // remote copy is async and best-effort, so after a failed or raced
          // upsert it can be stale. Whichever copy was written last wins —
          // taking the remote unconditionally is how widgets added just
          // before a reload used to vanish.
          const local = readLocal();
          if (local && (local.updatedAt ?? 0) > (remote.updatedAt ?? 0)) {
            setWidgetsState(local.widgets);
            setLoaded(true);
            void supabase
              .from("user_state")
              .upsert(
                { user_id: userId, key: DASHBOARD_KEY, value: local },
                { onConflict: "user_id,key" },
              );
            return;
          }
          // An explicitly empty list is a real answer — a new account starts
          // blank and must stay blank.
          setWidgetsState(remote.widgets);
          setLoaded(true);
          return;
        }
      } catch {
        if (!active) return;
        clearTimeout(timeout);
      }

      if (!active) return;
      loadLocal();
    })();

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [userId, localKey]);

  // Write with the same explicit userId, so a stale client session can't send
  // this account's dashboard to another row.
  const persist = React.useCallback(
    (next: string[]) => {
      setWidgetsState(next);
      const stamped: DashboardState = { widgets: next, updatedAt: Date.now() };
      if (localKey) {
        try {
          localStorage.setItem(localKey, JSON.stringify(stamped));
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
              { user_id: userId, key: DASHBOARD_KEY, value: stamped },
              { onConflict: "user_id,key" },
            );
        } catch {
          /* best-effort; the local mirror still has it */
        }
      })();
    },
    [localKey, userId],
  );

  // Until usePlan resolves it reports "free", which would cap a Pro user at the
  // free allowance and silently reject their adds. Don't enforce a limit we
  // aren't sure about yet, and never limit admins.
  const limitKnown = planResolved && !admin;
  const limit = limitKnown ? widgetLimitFor(tier) : Infinity;

  // Adds decided in this tick but not yet flushed to state, so two fast clicks
  // can't both pass the limit check against the same list.
  const pendingRef = React.useRef<string[]>([]);

  const addWidget = React.useCallback(
    (id: string): AddResult => {
      // Decide synchronously and return the real answer. This used to run
      // inside a setState updater, which React defers to the next render — so
      // the caller always got back "ok" and a rejected add produced no message
      // at all. That is what made adding look like it silently did nothing.
      const current = [...widgets, ...pendingRef.current];

      const decision = decideAdd({ current, id, limit, tier });
      if (!decision.ok) return decision;

      pendingRef.current = [...pendingRef.current, id];
      // Clear the pending entry once the state that contains it has landed.
      queueMicrotask(() => {
        pendingRef.current = pendingRef.current.filter((p) => p !== id);
      });

      persist([...current, id]);
      return { ok: true };
    },
    [widgets, limit, tier, persist],
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
