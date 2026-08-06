// ----------------------------------------------------------------------------
// Widget specs — the contract between the AI Feature Builder and the dashboard.
//
// A widget is DATA, never code. The AI describes what the user asked for as a
// declarative spec; a fixed set of trusted React primitives renders it. Nothing
// the model emits is ever evaluated, so a generated widget can't do anything a
// hand-written one couldn't.
//
// Two halves, stored separately:
//   • the SPEC  — the definition (what blocks, what labels). Rarely changes.
//   • the STATE — the user's data for one widget (ticks, counts, notes).
//
// Both are client-safe: no server-only imports here, so the renderer, the
// builder preview and the server action can all share this module.
// ----------------------------------------------------------------------------

import { z } from "zod";

/** Accent colours a widget may use. Mapped to real classes in the renderer —
 *  never interpolated into a class string, or Tailwind would purge them. */
export const ACCENTS = [
  "primary",
  "emerald",
  "sky",
  "amber",
  "violet",
  "rose",
] as const;
export type Accent = (typeof ACCENTS)[number];

/** Icon names the renderer knows how to draw. Kept small and concrete so the
 *  model picks from a real list instead of inventing lucide names. */
export const WIDGET_ICONS = [
  "activity",
  "book",
  "brain",
  "calendar",
  "check",
  "coins",
  "dumbbell",
  "flame",
  "heart",
  "leaf",
  "moon",
  "music",
  "pencil",
  "smile",
  "sparkles",
  "star",
  "sun",
  "target",
  "timer",
  "utensils",
] as const;
export type WidgetIcon = (typeof WIDGET_ICONS)[number];

const id = z.string().min(1).max(64);
const label = z.string().min(1).max(80);

// --- Blocks -----------------------------------------------------------------

const textBlock = z.object({
  kind: z.literal("text"),
  id,
  body: z.string().min(1).max(400),
});

const checklistBlock = z.object({
  kind: z.literal("checklist"),
  id,
  label,
  /** Starting items. The user can add and remove their own afterwards. */
  items: z.array(z.string().min(1).max(120)).max(30).default([]),
  /** Ticks clear at the start of each day — right for habits, wrong for a
   *  reading list, so the model chooses. */
  resetDaily: z.boolean().default(false),
});

const counterBlock = z.object({
  kind: z.literal("counter"),
  id,
  label,
  step: z.number().int().min(1).max(1000).default(1),
  target: z.number().int().min(1).max(1_000_000).nullable().default(null),
  unit: z.string().max(16).nullable().default(null),
  resetDaily: z.boolean().default(false),
});

const progressBlock = z.object({
  kind: z.literal("progress"),
  id,
  label,
  /** Id of the counter or checklist this bar tracks. */
  source: id,
});

const notesBlock = z.object({
  kind: z.literal("notes"),
  id,
  label,
  placeholder: z.string().max(120).default(""),
});

const ratingBlock = z.object({
  kind: z.literal("rating"),
  id,
  label,
  scale: z.number().int().min(3).max(10).default(5),
  icon: z.enum(["star", "heart", "circle"]).default("star"),
});

const countdownBlock = z.object({
  kind: z.literal("countdown"),
  id,
  label,
  /** ISO date (YYYY-MM-DD). The user can change it after the fact. */
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const timerBlock = z.object({
  kind: z.literal("timer"),
  id,
  label,
  minutes: z.number().int().min(1).max(180).default(25),
});

export const blockSchema = z.discriminatedUnion("kind", [
  textBlock,
  checklistBlock,
  counterBlock,
  progressBlock,
  notesBlock,
  ratingBlock,
  countdownBlock,
  timerBlock,
]);

export type WidgetBlock = z.infer<typeof blockSchema>;
export type BlockKind = WidgetBlock["kind"];

export const BLOCK_KINDS: BlockKind[] = [
  "text",
  "checklist",
  "counter",
  "progress",
  "notes",
  "rating",
  "countdown",
  "timer",
];

// --- Widget -----------------------------------------------------------------

export const widgetSpecSchema = z.object({
  id,
  title: label,
  /** One line the dashboard shows under the title. */
  description: z.string().max(160).default(""),
  icon: z.enum(WIDGET_ICONS).catch("sparkles"),
  accent: z.enum(ACCENTS).catch("primary"),
  blocks: z.array(blockSchema).min(1).max(8),
  /** Where it came from, so the UI can badge AI-built widgets. */
  source: z.enum(["ai", "builtin"]).default("ai"),
  createdAt: z.string().default(""),
});

export type WidgetSpec = z.infer<typeof widgetSpecSchema>;

/** What the model is asked to return — ids and timestamps are ours to assign. */
export const generatedWidgetSchema = widgetSpecSchema.omit({
  id: true,
  source: true,
  createdAt: true,
});

export type GeneratedWidget = z.infer<typeof generatedWidgetSchema>;

// --- Normalisation ----------------------------------------------------------

function slug(input: string, fallback: string): string {
  const s = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return s || fallback;
}

/**
 * Make a validated spec internally consistent. The model gets block ids and
 * cross-references wrong often enough that repairing beats rejecting:
 *   • block ids are made unique and non-empty
 *   • a `progress` bar pointing at a block that doesn't exist (or at one that
 *     has nothing to measure) is dropped rather than rendering an empty bar
 *   • a counter target of 0 becomes null ("no target") instead of a bar stuck
 *     at infinity
 */
export function normaliseBlocks(blocks: WidgetBlock[]): WidgetBlock[] {
  const seen = new Set<string>();
  const out: WidgetBlock[] = [];

  for (const [i, block] of blocks.entries()) {
    let blockId = slug(block.id, `${block.kind}-${i + 1}`);
    while (seen.has(blockId)) blockId = `${blockId}-${out.length + 1}`;
    seen.add(blockId);
    out.push({ ...block, id: blockId } as WidgetBlock);
  }

  // A progress bar can only measure a counter (against a target) or a checklist.
  const measurable = new Map(
    out
      .filter((b) => b.kind === "counter" || b.kind === "checklist")
      .map((b) => [b.id, b] as const),
  );

  return out.filter((b) => {
    if (b.kind !== "progress") return true;
    const src = measurable.get(b.source);
    if (!src) return false;
    if (src.kind === "counter" && !src.target) return false;
    return true;
  });
}

/** Turn a validated model response into a storable widget. */
export function toWidgetSpec(
  generated: GeneratedWidget,
  opts: { id: string; createdAt: string },
): WidgetSpec {
  return {
    ...generated,
    blocks: normaliseBlocks(generated.blocks),
    id: opts.id,
    source: "ai",
    createdAt: opts.createdAt,
  };
}

/** Stable id for a new widget: readable, and unique enough within one account. */
export function widgetIdFor(title: string, existing: string[]): string {
  const base = slug(title, "widget");
  if (!existing.includes(base)) return base;
  let n = 2;
  while (existing.includes(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}
