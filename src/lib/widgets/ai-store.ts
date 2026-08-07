"use client";

// ----------------------------------------------------------------------------
// Persistence for AI-built widgets.
//
// Specs and state are stored under separate keys so ticking a checkbox doesn't
// rewrite every widget definition. Both mirror to localStorage for instant
// paint, then reconcile with user_state for cross-device sync — same shape as
// the rest of the app.
//
// Local keys are scoped per user. An unscoped key leaks between two accounts
// sharing a browser (see Common Pitfalls in COMMS.md).
// ----------------------------------------------------------------------------

import { loadRemote, saveRemote } from "@/lib/sync";
import { widgetSpecSchema, type WidgetSpec } from "./spec";
import { reconcileState, type WidgetState } from "./state";

export const AI_WIDGETS_KEY = "ai-widgets-v1";
export const widgetStateKey = (widgetId: string) => `widget-state:${widgetId}`;

/** Dashboard ids for AI widgets are namespaced so they can't collide with the
 *  built-in registry in `src/lib/widgets.ts`. */
export const AI_WIDGET_PREFIX = "ai:";
export const dashboardIdFor = (widgetId: string) => `${AI_WIDGET_PREFIX}${widgetId}`;
export const isAIWidgetId = (id: string) => id.startsWith(AI_WIDGET_PREFIX);
export const widgetIdFromDashboardId = (id: string) => id.slice(AI_WIDGET_PREFIX.length);

const localSpecsKey = (userId?: string) => `dailyos-ai-widgets:${userId ?? "anon"}`;
const localStateKey = (userId: string | undefined, widgetId: string) =>
  `dailyos-widget-state:${userId ?? "anon"}:${widgetId}`;

function readLocal<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeLocal(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota — the remote copy is still authoritative */
  }
}

/** Drop anything that no longer validates rather than failing the whole load,
 *  so one bad spec can't take the dashboard down. */
function parseSpecs(value: unknown): WidgetSpec[] {
  if (!value || typeof value !== "object") return [];
  const list = (value as { specs?: unknown }).specs;
  if (!Array.isArray(list)) return [];
  const out: WidgetSpec[] = [];
  for (const entry of list) {
    const parsed = widgetSpecSchema.safeParse(entry);
    if (parsed.success) out.push(parsed.data);
  }
  return out;
}

/** All of this account's AI-built widgets. Local first, then the synced copy. */
export async function loadSpecs(userId?: string): Promise<WidgetSpec[]> {
  const local = parseSpecs(readLocal(localSpecsKey(userId)));
  const remote = await loadRemote<{ specs: unknown }>(AI_WIDGETS_KEY);
  if (remote) {
    const parsed = parseSpecs(remote);
    writeLocal(localSpecsKey(userId), { specs: parsed });
    return parsed;
  }
  return local;
}

/** Read the local copy synchronously, for first paint before the sync lands. */
export function loadSpecsLocal(userId?: string): WidgetSpec[] {
  return parseSpecs(readLocal(localSpecsKey(userId)));
}

export async function saveSpecs(specs: WidgetSpec[], userId?: string): Promise<void> {
  writeLocal(localSpecsKey(userId), { specs });
  await saveRemote(AI_WIDGETS_KEY, { specs });
}

export async function addSpec(spec: WidgetSpec, userId?: string): Promise<WidgetSpec[]> {
  const existing = await loadSpecs(userId);
  const next = [...existing.filter((s) => s.id !== spec.id), spec];
  await saveSpecs(next, userId);
  return next;
}

export async function removeSpec(widgetId: string, userId?: string): Promise<WidgetSpec[]> {
  const existing = await loadSpecs(userId);
  const next = existing.filter((s) => s.id !== widgetId);
  await saveSpecs(next, userId);
  return next;
}

/** One widget's data, repaired against the current spec. */
export async function loadWidgetState(
  spec: WidgetSpec,
  userId?: string,
): Promise<WidgetState> {
  const local = readLocal<Partial<WidgetState>>(localStateKey(userId, spec.id));
  const remote = await loadRemote<Partial<WidgetState>>(widgetStateKey(spec.id));
  return reconcileState(spec, remote ?? local);
}

export function loadWidgetStateLocal(spec: WidgetSpec, userId?: string): WidgetState {
  return reconcileState(spec, readLocal<Partial<WidgetState>>(localStateKey(userId, spec.id)));
}

export async function saveWidgetState(
  widgetId: string,
  state: WidgetState,
  userId?: string,
): Promise<void> {
  writeLocal(localStateKey(userId, widgetId), state);
  await saveRemote(widgetStateKey(widgetId), state);
}
