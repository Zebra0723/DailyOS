"use client";

// Which app sections this account has switched on, shared by the nav and the
// Customise screen so the two can never disagree.
//
// Two lessons are baked in from the dashboard's history:
//   • Read and write with the server-provided userId, never the client session's
//     — the Supabase client can still hold the previous account right after
//     signup, which is how new accounts ended up showing someone else's state.
//   • Scope the local mirror per user (COMMS pitfall 6). An unscoped key leaks
//     between two accounts sharing one browser or PWA.

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import {
  defaultFeatureKeys,
  normaliseFeatureKeys,
  FEATURES,
  isFeatureVisible,
  type FeatureDef,
} from "@/lib/features";

const FEATURES_KEY = "features";

const localKeyFor = (userId?: string) =>
  userId ? `dailyos-features:${userId}` : null;

interface FeaturesContextValue {
  enabled: Set<string>;
  /** True once the stored value (or its absence) has been resolved. */
  loaded: boolean;
  isAdmin: boolean;
  isEnabled: (key: string) => boolean;
  setEnabled: (key: string, on: boolean) => void;
  toggle: (key: string) => void;
  /** Sections to render, in catalogue order, already filtered for this user. */
  visibleFeatures: FeatureDef[];
}

const FeaturesContext = React.createContext<FeaturesContextValue | null>(null);

export function useFeatures(): FeaturesContextValue {
  const ctx = React.useContext(FeaturesContext);
  if (!ctx) throw new Error("useFeatures must be used within a FeaturesProvider");
  return ctx;
}

/** For components that may render outside the provider (e.g. marketing pages). */
export function useFeaturesOptional(): FeaturesContextValue | null {
  return React.useContext(FeaturesContext);
}

export function FeaturesProvider({
  userId,
  accountCreatedAt,
  isAdmin = false,
  children,
}: {
  userId?: string;
  /** user.created_at — decides what an account with nothing stored starts with. */
  accountCreatedAt?: string | null;
  isAdmin?: boolean;
  children: React.ReactNode;
}) {
  const [enabled, setEnabledState] = React.useState<Set<string>>(new Set());
  const [loaded, setLoaded] = React.useState(false);

  const localKey = localKeyFor(userId);

  React.useEffect(() => {
    let active = true;

    (async () => {
      if (!userId) {
        if (active) {
          setEnabledState(new Set(defaultFeatureKeys(accountCreatedAt)));
          setLoaded(true);
        }
        return;
      }

      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("user_state")
          .select("value")
          .eq("user_id", userId)
          .eq("key", FEATURES_KEY)
          .maybeSingle();
        if (!active) return;

        const stored = (data?.value as { enabled?: unknown } | null)?.enabled;
        if (Array.isArray(stored)) {
          // A stored list is a real answer even when short — someone who
          // switched everything off must stay switched off.
          setEnabledState(new Set(normaliseFeatureKeys(stored)));
          setLoaded(true);
          return;
        }
      } catch {
        /* fall through to the local mirror, then to defaults */
      }

      if (!active) return;

      if (localKey) {
        try {
          const raw = localStorage.getItem(localKey);
          const parsed = raw ? (JSON.parse(raw) as { enabled?: unknown }) : null;
          if (Array.isArray(parsed?.enabled)) {
            setEnabledState(new Set(normaliseFeatureKeys(parsed.enabled)));
            setLoaded(true);
            return;
          }
        } catch {
          /* ignore a malformed cache */
        }
      }

      setEnabledState(new Set(defaultFeatureKeys(accountCreatedAt)));
      setLoaded(true);
    })();

    return () => {
      active = false;
    };
  }, [userId, accountCreatedAt, localKey]);

  /** Write the enabled set to storage. State is moved by setEnabled, not here. */
  const persist = React.useCallback(
    (next: Set<string>) => {
      const list = normaliseFeatureKeys(Array.from(next));

      if (localKey) {
        try {
          localStorage.setItem(localKey, JSON.stringify({ enabled: list }));
        } catch {
          /* quota — the stored copy is authoritative anyway */
        }
      }
      if (!userId) return;

      void (async () => {
        try {
          const supabase = createClient();
          await supabase
            .from("user_state")
            .upsert(
              { user_id: userId, key: FEATURES_KEY, value: { enabled: list } },
              { onConflict: "user_id,key" },
            );
        } catch {
          /* offline — the local mirror carries it until the next write */
        }
      })();
    },
    [localKey, userId],
  );

  // Toggling only moves state. The updater has to stay pure — an earlier version
  // called persist() from inside it, and persist calls setEnabledState itself,
  // so this was setState-within-a-setState-updater. React is free to discard
  // that, which is exactly why switching a section on left no visible trace.
  const setEnabled = React.useCallback((key: string, on: boolean) => {
    setEnabledState((prev) => {
      if (prev.has(key) === on) return prev; // no-op keeps the reference stable
      const next = new Set(prev);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });
  }, []);

  // Writing is a side effect, so it belongs in an effect. hydratedRef skips the
  // first settled value — that one came *from* storage, and echoing it back
  // would overwrite a good remote copy with whatever this device fell back to.
  const hydratedRef = React.useRef(false);
  React.useEffect(() => {
    if (!loaded) return;
    if (!hydratedRef.current) {
      hydratedRef.current = true;
      return;
    }
    persist(enabled);
  }, [enabled, loaded, persist]);

  const value = React.useMemo<FeaturesContextValue>(() => {
    const isEnabled = (key: string) => {
      const def = FEATURES.find((f) => f.key === key);
      return def ? isFeatureVisible(def, enabled, isAdmin) : false;
    };
    return {
      enabled,
      loaded,
      isAdmin,
      isEnabled,
      setEnabled,
      toggle: (key: string) => setEnabled(key, !enabled.has(key)),
      visibleFeatures: FEATURES.filter((f) => isFeatureVisible(f, enabled, isAdmin)),
    };
  }, [enabled, loaded, isAdmin, setEnabled]);

  return (
    <FeaturesContext.Provider value={value}>{children}</FeaturesContext.Provider>
  );
}
