// ----------------------------------------------------------------------------
// DailyOS pricing plans. Display/UI only — no payment processing yet.
// Annual = ~2 months free (a slight discount vs paying monthly).
// ----------------------------------------------------------------------------

export interface Plan {
  key: "free" | "plus" | "pro";
  name: string;
  tagline: string;
  monthly: number; // £/month
  annual: number; // £/year
  highlight?: boolean;
  cta: string;
  features: string[];
}

export const PLANS: Plan[] = [
  {
    key: "free",
    name: "Free",
    tagline: "Get a feel for handled.",
    monthly: 0,
    annual: 0,
    cta: "Get started",
    features: [
      "Customisable dashboard with core widgets",
      "Tasks, Calendar, Inbox & Quick Add",
      "Habit Tracker & Quick Notes",
      "15 life-admin updates / month",
      "Cross-device sync",
    ],
  },
  {
    key: "plus",
    name: "Plus",
    tagline: "For a busy life, sorted.",
    monthly: 4,
    annual: 40,
    highlight: true,
    cta: "Start Plus",
    features: [
      "Everything in Free, plus:",
      "Goals widget",
      "HomeOS — subscriptions, deliveries, rooms & devices",
      "Bookmarks & Tomorrow Preview widgets",
      "Needs Review widget with smart alerts",
      "Searchable Vault & Smart Notepad",
      "Search across everything (⌘K)",
      "100 updates / month · unlimited events",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    tagline: "Your full chief of staff.",
    monthly: 8,
    annual: 80,
    cta: "Go Pro",
    features: [
      "Everything in Plus, plus:",
      "AI Feature Builder — describe a feature, we build it",
      "Ask DailyOS — your AI chief-of-staff assistant",
      "The assistant can act — complete & reschedule tasks",
      "Calendar sync — Apple & Google Calendar",
      "Unlimited life-admin updates",
      "Priority AI processing",
    ],
  },
];

/** Effective £/month when paying annually (rounded to 2dp). */
export function annualPerMonth(plan: Plan): number {
  return Math.round((plan.annual / 12) * 100) / 100;
}

/** Rough % saved by paying annually vs monthly. */
export function annualSavingPct(plan: Plan): number {
  if (!plan.monthly) return 0;
  const full = plan.monthly * 12;
  return Math.round(((full - plan.annual) / full) * 100);
}
