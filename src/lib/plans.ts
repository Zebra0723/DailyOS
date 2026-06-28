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
      "Tasks & Today dashboard",
      "A daily mindful moment",
      "No Vault",
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
      "Searchable Vault",
      "100 life-admin updates / month",
      "Unlimited calendar events",
      "Smart Notepad",
      "Full Wellbeing — Mood & Nudges",
      "Reminders",
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
      "Unlimited life-admin updates",
      "Priority AI processing",
      "Day-before notifications",
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
