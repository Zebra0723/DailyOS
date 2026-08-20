// ----------------------------------------------------------------------------
// Keyword-matched widget templates.
//
// The fallback for the AI Feature Builder: used when no AI provider is
// configured, or when the model returns something that won't validate. The user
// still gets a real, working widget shaped roughly like what they asked for
// rather than an error, and they can edit it afterwards.
// ----------------------------------------------------------------------------

import type { GeneratedWidget } from "./spec";

interface Template {
  /** Matched case-insensitively against the user's description. */
  keywords: string[];
  build: (description: string) => GeneratedWidget;
}

/** Title-case the user's own words so the widget feels like theirs. */
function titleFrom(description: string, fallback: string): string {
  const cleaned = description
    .replace(/^(build|make|create|add|i want|i'd like|give me)\s+(me\s+)?(a|an|the)?\s*/i, "")
    .replace(/[.!?].*$/s, "")
    .trim();
  if (!cleaned) return fallback;
  const short = cleaned.slice(0, 60);
  return short.charAt(0).toUpperCase() + short.slice(1);
}

const TEMPLATES: Template[] = [
  {
    keywords: ["gym", "workout", "fitness", "exercise", "training", "run", "lift"],
    build: (d) => ({
      title: titleFrom(d, "Fitness Tracker"),
      description: "Sessions, effort and how each one felt.",
      icon: "dumbbell",
      accent: "emerald",
      blocks: [
        { kind: "counter", id: "sessions", label: "Sessions this week", step: 1, target: 4, unit: "sessions", resetDaily: false },
        { kind: "progress", id: "weekly", label: "Weekly goal", source: "sessions" },
        { kind: "rating", id: "effort", label: "How did it feel?", scale: 5, icon: "star" },
        { kind: "notes", id: "log", label: "Session notes", placeholder: "What did you train?" },
      ],
    }),
  },
  {
    keywords: ["read", "book", "reading list", "library"],
    build: (d) => ({
      title: titleFrom(d, "Reading List"),
      description: "What you're reading and how far you've got.",
      icon: "book",
      accent: "sky",
      blocks: [
        { kind: "checklist", id: "books", label: "To read", items: [], resetDaily: false },
        { kind: "counter", id: "pages", label: "Pages today", step: 10, target: 30, unit: "pages", resetDaily: true },
        { kind: "progress", id: "daily", label: "Today's reading", source: "pages" },
      ],
    }),
  },
  {
    keywords: ["budget", "expense", "spend", "money", "cost", "saving", "finance"],
    build: (d) => ({
      title: titleFrom(d, "Spending Tracker"),
      description: "What you've spent and what's left.",
      icon: "coins",
      accent: "amber",
      blocks: [
        { kind: "counter", id: "spent", label: "Spent this month", step: 5, target: 400, unit: "£", resetDaily: false },
        { kind: "progress", id: "budget", label: "Against budget", source: "spent" },
        { kind: "notes", id: "log", label: "What on?", placeholder: "Groceries, travel…" },
      ],
    }),
  },
  {
    keywords: ["meal", "recipe", "food", "dinner", "cook", "eat"],
    build: (d) => ({
      title: titleFrom(d, "Meal Planner"),
      description: "This week's meals and the shopping for them.",
      icon: "utensils",
      accent: "rose",
      blocks: [
        { kind: "checklist", id: "meals", label: "This week's meals", items: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], resetDaily: false },
        { kind: "checklist", id: "shopping", label: "Shopping list", items: [], resetDaily: false },
      ],
    }),
  },
  {
    keywords: ["sleep", "bed", "rest", "wake"],
    build: (d) => ({
      title: titleFrom(d, "Sleep Log"),
      description: "Hours slept and how rested you felt.",
      icon: "moon",
      accent: "violet",
      blocks: [
        { kind: "counter", id: "hours", label: "Hours slept", step: 1, target: 8, unit: "hours", resetDaily: true },
        { kind: "rating", id: "rested", label: "How rested?", scale: 5, icon: "circle" },
      ],
    }),
  },
  {
    keywords: ["study", "revision", "focus", "deep work", "learn"],
    build: (d) => ({
      title: titleFrom(d, "Study Sessions"),
      description: "Focused blocks and what you covered.",
      icon: "brain",
      accent: "sky",
      blocks: [
        { kind: "timer", id: "focus", label: "Focus block", minutes: 25 },
        { kind: "counter", id: "blocks", label: "Blocks today", step: 1, target: 4, unit: "blocks", resetDaily: true },
        { kind: "progress", id: "daily", label: "Today", source: "blocks" },
        { kind: "notes", id: "covered", label: "What did you cover?", placeholder: "Topics, chapters…" },
      ],
    }),
  },
  {
    keywords: ["habit", "streak", "routine", "daily"],
    build: (d) => ({
      title: titleFrom(d, "Daily Habits"),
      description: "The small things, ticked off each day.",
      icon: "flame",
      accent: "amber",
      blocks: [
        { kind: "checklist", id: "habits", label: "Today's habits", items: [], resetDaily: true },
        { kind: "progress", id: "done", label: "Today", source: "habits" },
      ],
    }),
  },
];

/** A general tracker for anything that doesn't match a template. */
function genericTemplate(description: string): GeneratedWidget {
  return {
    title: titleFrom(description, "My Tracker"),
    description: "A simple tracker you can shape as you go.",
    icon: "target",
    accent: "primary",
    blocks: [
      { kind: "checklist", id: "items", label: "Things to do", items: [], resetDaily: false },
      { kind: "progress", id: "done", label: "Progress", source: "items" },
      { kind: "notes", id: "notes", label: "Notes", placeholder: "Anything worth remembering." },
    ],
  };
}

/**
 * Pick the closest template for a description. Scores by how many of a
 * template's keywords appear, so "track my gym workouts and sleep" lands on
 * fitness rather than whichever template happens to be listed first.
 */
export function templateFor(description: string): GeneratedWidget {
  const haystack = description.toLowerCase();
  let best: { template: Template; score: number } | null = null;

  for (const template of TEMPLATES) {
    const score = template.keywords.filter((k) => haystack.includes(k)).length;
    if (score > 0 && (!best || score > best.score)) best = { template, score };
  }

  return best ? best.template.build(description) : genericTemplate(description);
}
