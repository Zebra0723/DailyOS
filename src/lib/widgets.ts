import type { LucideIcon } from "lucide-react";
import {
  CheckSquare,
  CalendarDays,
  Inbox,
  AlertTriangle,
  BarChart3,
  Plus,
  Bookmark,
  Target,
  StickyNote,
  CalendarClock,
  Sparkles,
  Home,
  Flame,
  Gauge,
  CreditCard,
  Truck,
  Cpu,
  Sofa,
  BellRing,
  CalendarRange,
  FolderLock,
  BookOpen,
} from "lucide-react";

export type WidgetCategory = "lifeos" | "homeos" | "productivity" | "wellness" | "ai";
export type PlanTier = "free" | "plus" | "pro";

export interface WidgetDef {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  category: WidgetCategory;
  tier: PlanTier;
  span?: "full";
}

export const WIDGET_CATEGORIES: { key: WidgetCategory; label: string }[] = [
  { key: "lifeos", label: "LifeOS" },
  { key: "homeos", label: "HomeOS" },
  { key: "productivity", label: "Productivity" },
  { key: "wellness", label: "Wellness" },
  { key: "ai", label: "AI" },
];

export const WIDGETS: WidgetDef[] = [
  {
    id: "stats-overview",
    name: "Stats Overview",
    description: "Quick counts of tasks due, events, and items to review.",
    icon: BarChart3,
    category: "lifeos",
    tier: "free",
    span: "full",
  },
  {
    id: "tasks-due",
    name: "Tasks Due Today",
    description: "Tasks due today with quick completion.",
    icon: CheckSquare,
    category: "lifeos",
    tier: "free",
  },
  {
    id: "upcoming-events",
    name: "Upcoming Events",
    description: "Your next calendar events at a glance.",
    icon: CalendarDays,
    category: "lifeos",
    tier: "free",
  },
  {
    id: "quick-add",
    name: "Quick Add",
    description: "Add a task or drop an item without leaving the page.",
    icon: Plus,
    category: "lifeos",
    tier: "free",
  },
  {
    id: "recent-inbox",
    name: "Recent Inbox",
    description: "Your latest items from the Drop.",
    icon: Inbox,
    category: "lifeos",
    tier: "free",
  },
  {
    id: "quick-notes",
    name: "Quick Notes",
    description: "A scratchpad right on your dashboard.",
    icon: StickyNote,
    category: "lifeos",
    tier: "free",
  },
  {
    id: "needs-review",
    name: "Needs Review",
    description: "Items DailyOS extracted that need your approval.",
    icon: AlertTriangle,
    category: "lifeos",
    tier: "plus",
  },
  {
    id: "bookmarks",
    name: "Bookmarks",
    description: "Inbox items you pinned for quick access.",
    icon: Bookmark,
    category: "lifeos",
    tier: "plus",
  },
  {
    id: "tomorrow-preview",
    name: "Tomorrow Preview",
    description: "A heads-up on what's due tomorrow.",
    icon: CalendarClock,
    category: "lifeos",
    tier: "plus",
  },
  {
    id: "homeos-summary",
    name: "HomeOS Summary",
    description: "Quick snapshot of your household — deliveries, alerts, devices.",
    icon: Home,
    category: "homeos",
    tier: "plus",
  },
  {
    id: "home-control-score",
    name: "Home Control Score",
    description: "How on top of the house you are, and what's dragging it down.",
    icon: Gauge,
    category: "homeos",
    tier: "plus",
  },
  {
    id: "home-subscriptions",
    name: "Home Subscriptions",
    description: "Monthly spend, upcoming renewals and what you could cancel.",
    icon: CreditCard,
    category: "homeos",
    tier: "plus",
  },
  {
    id: "home-deliveries",
    name: "Deliveries",
    description: "What's arriving today, what's coming, and what's gone wrong.",
    icon: Truck,
    category: "homeos",
    tier: "plus",
  },
  {
    id: "home-devices",
    name: "Devices",
    description: "Device health, maintenance due and warranties running out.",
    icon: Cpu,
    category: "homeos",
    tier: "plus",
  },
  {
    id: "home-rooms",
    name: "Rooms",
    description: "Room-by-room progress and what you've spent kitting them out.",
    icon: Sofa,
    category: "homeos",
    tier: "plus",
  },
  {
    id: "home-alerts",
    name: "Home Alerts",
    description: "Open household alerts, most urgent first.",
    icon: BellRing,
    category: "homeos",
    tier: "plus",
  },
  {
    id: "home-calendar",
    name: "Home Calendar",
    description: "Renewals, deliveries, warranties and maintenance coming up.",
    icon: CalendarRange,
    category: "homeos",
    tier: "plus",
  },
  {
    id: "home-vault",
    name: "Home Vault",
    description: "Household documents, and which ones are about to expire.",
    icon: FolderLock,
    category: "homeos",
    tier: "plus",
  },
  {
    id: "habit-tracker",
    name: "Habit Tracker",
    description: "Track daily habits and build streaks.",
    icon: Flame,
    category: "wellness",
    tier: "free",
  },
  {
    id: "goals",
    name: "Goals",
    description: "Set goals, track progress, stay accountable.",
    icon: Target,
    category: "productivity",
    tier: "plus",
  },
  {
    id: "micro-journal",
    name: "One Line a Day",
    description: "Write one sentence each day. Build a streak. Revisit your past self.",
    icon: BookOpen,
    category: "wellness",
    tier: "free",
  },
  {
    id: "ai-builder",
    name: "AI Feature Builder",
    description: "Describe a feature in plain English and DailyOS builds it for you.",
    icon: Sparkles,
    category: "ai",
    tier: "pro",
  },
];

export function getWidget(id: string): WidgetDef | undefined {
  return WIDGETS.find((w) => w.id === id);
}

/**
 * How many widgets a plan may keep on the dashboard at once. This is the count
 * limit — which widgets a plan may use at all is the per-widget `tier` above.
 * Pro is deliberately uncapped.
 */
export const WIDGET_LIMITS: Record<PlanTier, number> = {
  free: 5,
  plus: 12,
  pro: Infinity,
};

export function widgetLimitFor(tier: PlanTier | string): number {
  if (tier === "pro") return WIDGET_LIMITS.pro;
  if (tier === "plus") return WIDGET_LIMITS.plus;
  return WIDGET_LIMITS.free;
}

/** The plan a user must be on to exceed `tier`'s limit, or null at the top. */
export function nextTierAfter(tier: PlanTier | string): "plus" | "pro" | null {
  if (tier === "pro") return null;
  return tier === "plus" ? "pro" : "plus";
}
