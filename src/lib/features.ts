// ----------------------------------------------------------------------------
// Which app sections a user has switched on.
//
// The customisation brief says new users start empty and add what they want.
// The dashboard grid became empty-first in v250; the NAVIGATION never did — it
// rendered a fixed list of every feature to everyone, which is why a new account
// still looked fully preloaded and why enabling something in Customise showed no
// sign of its existence. This module is the missing half: the catalogue of
// toggleable sections plus the rules for what a given account starts with.
//
// Pure data and pure functions only, so the defaulting and migration rules can
// be unit-tested without a browser or a database.
// ----------------------------------------------------------------------------

export type FeatureCategory = "LifeOS" | "HomeOS" | "Account";

export interface FeatureDef {
  /** Stable id stored in user_state — never reuse or rename these. */
  key: string;
  href: string;
  label: string;
  description: string;
  category: FeatureCategory;
  /** Always visible and not toggleable (the app needs a way home and a way to settings). */
  core?: boolean;
  /** Only ever shown to admins, regardless of the enabled set. */
  adminOnly?: boolean;
  /** In the starter set for a brand-new account. */
  starter?: boolean;
}

export const FEATURES: FeatureDef[] = [
  // ---- LifeOS -------------------------------------------------------------
  {
    key: "today",
    href: "/today",
    label: "Today",
    description: "Your dashboard. Always on — it's the way home.",
    category: "LifeOS",
    core: true,
  },
  {
    key: "tasks",
    href: "/tasks",
    label: "Tasks",
    description: "To-dos with due dates, priorities and repeats.",
    category: "LifeOS",
  },
  {
    key: "calendar",
    href: "/calendar",
    label: "Calendar",
    description: "Your events, and anything DailyOS extracts into one.",
    category: "LifeOS",
  },
  {
    key: "inbox",
    href: "/inbox",
    label: "The Drop",
    description: "Drop in a receipt, letter or screenshot and let DailyOS read it.",
    category: "LifeOS",
  },
  {
    key: "notes",
    href: "/notes",
    label: "Notes",
    description: "A scratchpad that syncs across your devices.",
    category: "LifeOS",
  },
  {
    key: "journal",
    href: "/journal",
    label: "Journal",
    description: "A private daily log.",
    category: "LifeOS",
  },
  {
    key: "vault",
    href: "/vault",
    label: "Vault",
    description: "Searchable storage for documents worth keeping.",
    category: "LifeOS",
  },
  {
    key: "assistant",
    href: "/assistant",
    label: "Ask DailyOS",
    description: "Your AI chief of staff.",
    category: "LifeOS",
  },
  {
    key: "build-day",
    href: "/build-day",
    label: "Build My Day",
    description: "Turn your hours and commitments into a calm schedule.",
    category: "LifeOS",
  },
  {
    key: "review",
    href: "/review",
    label: "Review",
    description: "A weekly look back at what you got done.",
    category: "LifeOS",
  },
  {
    key: "interests",
    href: "/interests",
    label: "Interests",
    description: "Name an interest, get a tiered plan for it.",
    category: "LifeOS",
  },
  {
    key: "world-clock",
    href: "/world-clock",
    label: "World Clock",
    description: "Time across the places you care about.",
    category: "LifeOS",
  },

  // ---- HomeOS -------------------------------------------------------------
  {
    key: "homeos",
    href: "/homeos",
    label: "HomeOS",
    description: "Subscriptions, deliveries, rooms, devices and home documents.",
    category: "HomeOS",
  },

  // ---- Account ------------------------------------------------------------
  {
    key: "subscriptions",
    href: "/subscriptions",
    label: "Subscription",
    description: "Your plan and billing.",
    category: "Account",
    core: true,
  },
  {
    key: "settings",
    href: "/settings",
    label: "Settings",
    description: "Account, appearance and data controls.",
    category: "Account",
    core: true,
  },
];

export const FEATURE_KEYS = FEATURES.map((f) => f.key);

/** Sections a user can actually switch on or off. */
export const TOGGLEABLE_FEATURES = FEATURES.filter((f) => !f.core && !f.adminOnly);

export function getFeature(key: string): FeatureDef | undefined {
  return FEATURES.find((f) => f.key === key);
}

/** What a brand-new account switches on before it customises anything. */
export function starterFeatureKeys(): string[] {
  return FEATURES.filter((f) => f.core || f.starter).map((f) => f.key);
}

/** Every non-admin section — what long-standing accounts are treated as having. */
export function allFeatureKeys(): string[] {
  return FEATURES.filter((f) => !f.adminOnly).map((f) => f.key);
}

/**
 * Accounts created before this switched on had no way to choose their sections,
 * so they are grandfathered in with everything already enabled. Taking features
 * away from a live account would read as data loss, not as customisation.
 */
export const FEATURE_CHOICE_LAUNCH_ISO = "2026-08-18T00:00:00.000Z";

/**
 * The enabled set for an account with nothing stored yet. New accounts start on
 * the small starter set; accounts that predate the launch keep everything.
 */
export function defaultFeatureKeys(_accountCreatedAtIso?: string | null): string[] {
  // Every section is preloaded now — the dashboard is no longer customisable,
  // so every account gets the full set regardless of when it was created.
  return allFeatureKeys();
}

/**
 * Clean a stored list: drop unknown keys (a feature we removed), force core
 * sections back on, and never let a stored value grant an admin-only section.
 */
export function normaliseFeatureKeys(_stored: unknown): string[] {
  // Sections are no longer customisable — everyone gets the full non-admin set,
  // so a previously-stored partial selection is upgraded to all.
  return allFeatureKeys();
}

// ---- Packs -----------------------------------------------------------------
// A pack is a named bundle of sections for one job, so someone starting from
// empty doesn't have to reason about fifteen individual toggles. Adding a pack
// is additive by design — it never switches anything off, so trying one can't
// cost you a section you already wanted.

export interface FeaturePack {
  key: string;
  name: string;
  /** The one thing this pack is for. */
  tagline: string;
  /** Feature keys the pack switches on. */
  features: string[];
  /**
   * Widget ids the pack puts on the dashboard, best-first — when a plan's
   * allowance runs out mid-pack the most useful ones are the ones that land.
   *
   * A pack that only switched on nav sections left the dashboard empty, which
   * read as "the pack did nothing". Sections are where things live; widgets are
   * what you actually see. See lib/widgets/packs.ts for the apply logic, which
   * is tier- and allowance-aware.
   */
  widgets: string[];
}

export const FEATURE_PACKS: FeaturePack[] = [
  {
    key: "starter",
    name: "Starter",
    tagline: "The essentials. A good first pick if you're not sure.",
    features: ["tasks", "calendar", "inbox"],
    widgets: ["stats-overview", "tasks-due", "upcoming-events", "quick-add"],
  },
  {
    key: "life-admin",
    name: "Life admin",
    tagline: "Handle the paperwork — capture it, file it, act on it.",
    features: ["inbox", "vault", "tasks", "calendar", "review"],
    widgets: ["recent-inbox", "needs-review", "tasks-due", "home-subscriptions"],
  },
  {
    key: "home",
    name: "Home",
    tagline: "Run the household — subscriptions, deliveries, rooms, devices.",
    features: ["homeos", "tasks", "calendar"],
    widgets: [
      "homeos-summary",
      "home-subscriptions",
      "home-deliveries",
      "home-alerts",
    ],
  },
  {
    key: "planning",
    name: "Planning",
    tagline: "Shape your time and look back on it.",
    features: ["build-day", "tasks", "calendar", "review"],
    widgets: ["tomorrow-preview", "tasks-due", "upcoming-events", "goals"],
  },
  {
    key: "thinking",
    name: "Thinking",
    tagline: "Somewhere to write things down and follow what interests you.",
    features: ["notes", "journal", "interests"],
    widgets: ["quick-notes", "micro-journal", "bookmarks"],
  },
];

export function getPack(key: string): FeaturePack | undefined {
  return FEATURE_PACKS.find((p) => p.key === key);
}

/** The enabled set after adding a pack. Additive — never removes a section. */
export function applyPack(enabled: Iterable<string>, packKey: string): string[] {
  const pack = getPack(packKey);
  const next = new Set(enabled);
  if (pack) for (const k of pack.features) next.add(k);
  return normaliseFeatureKeys(Array.from(next));
}

/** True once every section in the pack is already on. */
export function isPackApplied(enabled: Iterable<string>, packKey: string): boolean {
  const pack = getPack(packKey);
  if (!pack) return false;
  const on = new Set(enabled);
  return pack.features.every((k) => on.has(k));
}

/** Is this section visible, given the enabled set and whether the user is an admin? */
export function isFeatureVisible(
  feature: FeatureDef,
  enabled: Iterable<string>,
  isAdmin: boolean,
): boolean {
  if (feature.adminOnly) return isAdmin;
  if (feature.core) return true;
  for (const k of enabled) if (k === feature.key) return true;
  return false;
}
