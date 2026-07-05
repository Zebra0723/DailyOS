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
      "15 life-admin updates / month",
      "30 calendar events / month",
      "Tasks, Today & one Calendar",
      "Interests & World Clock",
      "Cross-device sync",
      "A daily mindful moment",
      "No Vault, no AI assistant",
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
      "HomeOS — subscriptions, deliveries, rooms & devices",
      "Build My Day — AI plans a calm, productive day",
      "Searchable Vault",
      "Repeating tasks & in-app reminders",
      "Search across everything (⌘K)",
      "Smart Notepad",
      "Full Wellbeing — Mood & Nudges",
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
      "Ask DailyOS — your AI chief-of-staff assistant",
      "The assistant can act — complete & reschedule tasks",
      "Unlimited life-admin updates",
      "Priority AI processing",
      "Family sharing (coming soon)",
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
