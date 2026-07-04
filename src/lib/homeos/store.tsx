"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { loadRemote, saveRemote, debounce } from "@/lib/sync";
import { regenerateAlerts as computeAlerts } from "./alerts";
import { buildDemoData } from "./demo";
import { nowIso } from "./dates";
import {
  DEFAULT_SETTINGS,
  type DailyOSTodayAction,
  type HomeAlert,
  type HomeArrival,
  type HomeConcern,
  type HomeDevice,
  type HomeDocument,
  type HomeOSData,
  type HomeOSSettings,
  type HomeProfile,
  type HomeSubscription,
  type RoomItem,
} from "./types";

const STORAGE_BASE = "dailyos-homeos-v1";
// Cross-device sync key (scoped to the user server-side by RLS).
const SYNC_KEY = "homeos-v1";

/** Storage is scoped per user so HomeOS data never leaks between accounts. */
function storageKeyFor(userId: string | null | undefined): string {
  return `${STORAGE_BASE}:${userId ?? "anon"}`;
}

function uid(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

type New<T> = Omit<T, "id" | "createdAt" | "updatedAt">;

function emptyData(): HomeOSData {
  const now = nowIso();
  return {
    homeProfile: {
      id: uid("home"),
      name: "Main Home",
      addressLabel: "",
      householdMembers: [],
      createdAt: now,
      updatedAt: now,
    },
    subscriptions: [],
    arrivals: [],
    roomItems: [],
    devices: [],
    documents: [],
    alerts: [],
    concerns: [],
    todayActions: [],
    settings: DEFAULT_SETTINGS,
  };
}

/** Recompute auto alerts (preserving user status) and keep any manual alerts. */
function recompute(data: HomeOSData): HomeOSData {
  const auto = computeAlerts(data, data.alerts);
  const manual = data.alerts.filter((a) => a.key.startsWith("manual:"));
  return { ...data, alerts: [...manual, ...auto] };
}

function loadFromStorage(key: string): HomeOSData | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as HomeOSData;
    if (!parsed || !Array.isArray(parsed.subscriptions)) return null;
    // Backfill in case the shape grew since it was saved.
    parsed.settings = { ...DEFAULT_SETTINGS, ...parsed.settings };
    if (!Array.isArray(parsed.concerns)) parsed.concerns = [];
    return parsed;
  } catch {
    return null;
  }
}

export interface HomeOSContextValue {
  data: HomeOSData;
  ready: boolean;

  updateProfile: (patch: Partial<HomeProfile>) => void;
  updateSettings: (patch: Partial<HomeOSSettings>) => void;

  addSubscription: (input: New<HomeSubscription>) => void;
  updateSubscription: (id: string, patch: Partial<HomeSubscription>) => void;
  deleteSubscription: (id: string) => void;

  addArrival: (input: New<HomeArrival>) => void;
  updateArrival: (id: string, patch: Partial<HomeArrival>) => void;
  deleteArrival: (id: string) => void;

  addRoomItem: (input: New<RoomItem>) => void;
  updateRoomItem: (id: string, patch: Partial<RoomItem>) => void;
  deleteRoomItem: (id: string) => void;

  addDevice: (input: New<HomeDevice>) => void;
  updateDevice: (id: string, patch: Partial<HomeDevice>) => void;
  deleteDevice: (id: string) => void;

  addDocument: (input: New<HomeDocument>) => void;
  updateDocument: (id: string, patch: Partial<HomeDocument>) => void;
  deleteDocument: (id: string) => void;

  addAlert: (input: { title: string; message: string; severity: HomeAlert["severity"]; module: HomeAlert["module"] }) => void;
  updateAlert: (id: string, patch: Partial<HomeAlert>) => void;
  deleteAlert: (id: string) => void;
  resolveAlert: (id: string) => void;
  snoozeAlert: (id: string, days?: number) => void;
  reopenAlert: (id: string) => void;

  addConcern: (text: string) => void;
  toggleConcern: (id: string) => void;
  deleteConcern: (id: string) => void;

  addTodayAction: (input: Omit<DailyOSTodayAction, "id" | "createdAt">) => void;
  updateTodayAction: (id: string, patch: Partial<DailyOSTodayAction>) => void;
  deleteTodayAction: (id: string) => void;

  regenerateAlerts: () => void;
  resetDemoData: () => void;
  clearHomeOSData: () => void;
  exportHomeOSJSON: () => string;
  importHomeOSJSON: (json: string) => { ok: boolean; error?: string };
}

const HomeOSContext = React.createContext<HomeOSContextValue | null>(null);

export function HomeOSProvider({
  children,
  userId,
}: {
  children: React.ReactNode;
  userId?: string;
}) {
  const [data, setData] = React.useState<HomeOSData | null>(null);
  const keyRef = React.useRef<string>(storageKeyFor("anon"));
  // Only push to the remote (cross-device) store once the initial pull has
  // finished, so a fresh device's empty state can't clobber synced data.
  const hydratedRef = React.useRef(false);
  const pushRemote = React.useMemo(
    () => debounce((v: HomeOSData) => void saveRemote(SYNC_KEY, v), 800),
    [],
  );

  React.useEffect(() => {
    let active = true;
    hydratedRef.current = false;

    (async () => {
      // Resolve the per-account key. Prefer the server userId (no network, so
      // HomeOS never stalls); otherwise fall back to the session.
      let uid = userId;
      if (!uid) {
        try {
          const {
            data: { session },
          } = await createClient().auth.getSession();
          uid = session?.user?.id;
        } catch {
          /* uid stays undefined */
        }
      }
      if (!active) return;
      keyRef.current = storageKeyFor(uid);

      // 1. Instant paint from local storage.
      const local = loadFromStorage(keyRef.current) ?? emptyData();
      setData(recompute(local));

      // 2. Cross-device pull (best-effort). If the remote has data, it wins;
      //    otherwise seed the remote from local so other devices can pick it up.
      const remote = await loadRemote<HomeOSData>(SYNC_KEY);
      if (!active) return;
      if (remote && Array.isArray(remote.subscriptions)) {
        remote.settings = { ...DEFAULT_SETTINGS, ...remote.settings };
        if (!Array.isArray(remote.concerns)) remote.concerns = [];
        setData(recompute(remote));
      } else {
        void saveRemote(SYNC_KEY, local);
      }
      hydratedRef.current = true;
    })();

    return () => {
      active = false;
    };
  }, [userId]);

  React.useEffect(() => {
    if (data) {
      try {
        localStorage.setItem(keyRef.current, JSON.stringify(data));
      } catch {
        /* ignore quota errors in the prototype */
      }
      if (hydratedRef.current) pushRemote(data);
    }
  }, [data, pushRemote]);

  const mutate = React.useCallback((fn: (d: HomeOSData) => HomeOSData) => {
    setData((prev) => (prev ? recompute(fn(prev)) : prev));
  }, []);

  // Generic add/update/delete builders for the entity collections.
  function makeAdd<T extends { id: string; createdAt: string; updatedAt: string }>(
    keyName: keyof HomeOSData,
    prefix: string,
  ) {
    return (input: New<T>) =>
      mutate((d) => {
        const now = nowIso();
        const item = { ...input, id: uid(prefix), createdAt: now, updatedAt: now } as unknown as T;
        return { ...d, [keyName]: [item, ...(d[keyName] as unknown as T[])] };
      });
  }
  function makeUpdate<T extends { id: string; updatedAt: string }>(keyName: keyof HomeOSData) {
    return (id: string, patch: Partial<T>) =>
      mutate((d) => ({
        ...d,
        [keyName]: (d[keyName] as unknown as T[]).map((x) =>
          x.id === id ? { ...x, ...patch, updatedAt: nowIso() } : x,
        ),
      }));
  }
  function makeDelete<T extends { id: string }>(keyName: keyof HomeOSData) {
    return (id: string) =>
      mutate((d) => ({
        ...d,
        [keyName]: (d[keyName] as unknown as T[]).filter((x) => x.id !== id),
      }));
  }

  const value = React.useMemo<HomeOSContextValue>(() => {
    return {
      data: data ?? emptyData(),
      ready: data !== null,

      updateProfile: (patch) =>
        mutate((d) => ({
          ...d,
          homeProfile: { ...d.homeProfile, ...patch, updatedAt: nowIso() },
        })),
      updateSettings: (patch) =>
        mutate((d) => ({ ...d, settings: { ...d.settings, ...patch } })),

      addSubscription: makeAdd<HomeSubscription>("subscriptions", "sub"),
      updateSubscription: makeUpdate<HomeSubscription>("subscriptions"),
      deleteSubscription: makeDelete<HomeSubscription>("subscriptions"),

      addArrival: makeAdd<HomeArrival>("arrivals", "arr"),
      updateArrival: makeUpdate<HomeArrival>("arrivals"),
      deleteArrival: makeDelete<HomeArrival>("arrivals"),

      addRoomItem: makeAdd<RoomItem>("roomItems", "room"),
      updateRoomItem: makeUpdate<RoomItem>("roomItems"),
      deleteRoomItem: makeDelete<RoomItem>("roomItems"),

      addDevice: makeAdd<HomeDevice>("devices", "dev"),
      updateDevice: makeUpdate<HomeDevice>("devices"),
      deleteDevice: makeDelete<HomeDevice>("devices"),

      addDocument: makeAdd<HomeDocument>("documents", "doc"),
      updateDocument: makeUpdate<HomeDocument>("documents"),
      deleteDocument: makeDelete<HomeDocument>("documents"),

      addAlert: (input) =>
        mutate((d) => {
          const now = nowIso();
          const id = uid("alert");
          const alert: HomeAlert = {
            id,
            key: `manual:${id}`,
            title: input.title,
            message: input.message,
            severity: input.severity,
            module: input.module,
            linkedEntityType: null,
            status: "Open",
            createdAt: now,
            updatedAt: now,
          };
          return { ...d, alerts: [alert, ...d.alerts] };
        }),
      updateAlert: makeUpdate<HomeAlert>("alerts"),
      deleteAlert: makeDelete<HomeAlert>("alerts"),
      resolveAlert: (id) =>
        mutate((d) => ({
          ...d,
          alerts: d.alerts.map((a) =>
            a.id === id ? { ...a, status: "Resolved", updatedAt: nowIso() } : a,
          ),
        })),
      snoozeAlert: (id, days = 3) =>
        mutate((d) => {
          const until = new Date();
          until.setDate(until.getDate() + days);
          return {
            ...d,
            alerts: d.alerts.map((a) =>
              a.id === id
                ? { ...a, status: "Snoozed", snoozedUntil: until.toISOString(), updatedAt: nowIso() }
                : a,
            ),
          };
        }),
      reopenAlert: (id) =>
        mutate((d) => ({
          ...d,
          alerts: d.alerts.map((a) =>
            a.id === id ? { ...a, status: "Open", snoozedUntil: undefined, updatedAt: nowIso() } : a,
          ),
        })),

      addConcern: (text) =>
        mutate((d) => {
          const trimmed = text.trim();
          if (!trimmed) return d;
          const now = nowIso();
          const concern: HomeConcern = {
            id: uid("concern"),
            text: trimmed,
            resolved: false,
            createdAt: now,
            updatedAt: now,
          };
          return { ...d, concerns: [concern, ...(d.concerns ?? [])] };
        }),
      toggleConcern: (id) =>
        mutate((d) => ({
          ...d,
          concerns: (d.concerns ?? []).map((c) =>
            c.id === id ? { ...c, resolved: !c.resolved, updatedAt: nowIso() } : c,
          ),
        })),
      deleteConcern: (id) =>
        mutate((d) => ({
          ...d,
          concerns: (d.concerns ?? []).filter((c) => c.id !== id),
        })),

      addTodayAction: (input) =>
        mutate((d) => {
          const action: DailyOSTodayAction = {
            ...input,
            id: uid("today"),
            createdAt: nowIso(),
          };
          return { ...d, todayActions: [action, ...d.todayActions] };
        }),
      updateTodayAction: (id, patch) =>
        mutate((d) => ({
          ...d,
          todayActions: d.todayActions.map((t) =>
            t.id === id ? { ...t, ...patch } : t,
          ),
        })),
      deleteTodayAction: (id) =>
        mutate((d) => ({
          ...d,
          todayActions: d.todayActions.filter((t) => t.id !== id),
        })),

      regenerateAlerts: () => mutate((d) => d),
      resetDemoData: () => setData(recompute(buildDemoData())),
      clearHomeOSData: () => setData(recompute(emptyData())),
      exportHomeOSJSON: () => JSON.stringify(data ?? emptyData(), null, 2),
      importHomeOSJSON: (json) => {
        try {
          const parsed = JSON.parse(json) as HomeOSData;
          if (!parsed || !Array.isArray(parsed.subscriptions)) {
            return { ok: false, error: "That doesn't look like HomeOS data." };
          }
          parsed.settings = { ...DEFAULT_SETTINGS, ...parsed.settings };
          if (!Array.isArray(parsed.concerns)) parsed.concerns = [];
          setData(recompute(parsed));
          return { ok: true };
        } catch (e) {
          return { ok: false, error: e instanceof Error ? e.message : "Invalid JSON." };
        }
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, mutate]);

  return <HomeOSContext.Provider value={value}>{children}</HomeOSContext.Provider>;
}

export function useHomeOS(): HomeOSContextValue {
  const ctx = React.useContext(HomeOSContext);
  if (!ctx) throw new Error("useHomeOS must be used within a HomeOSProvider");
  return ctx;
}

/** Read HomeOS Today actions outside the provider (e.g. on the DailyOS Today page). */
export function readHomeOSTodayActions(userId?: string | null): DailyOSTodayAction[] {
  try {
    const raw = localStorage.getItem(storageKeyFor(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HomeOSData;
    return Array.isArray(parsed.todayActions) ? parsed.todayActions : [];
  } catch {
    return [];
  }
}

export { STORAGE_BASE as HOMEOS_STORAGE_BASE, storageKeyFor as homeOSStorageKeyFor };
