// ----------------------------------------------------------------------------
// Build My Day — turns the user's hours + fixed commitments + goals into a
// schedule that's productive but calm (focus blocks, breaks, lunch, a reset).
// Uses the shared LLM provider when configured, with a local heuristic planner
// otherwise so it always returns a sensible plan. Server-only.
// ----------------------------------------------------------------------------

import "server-only";
import { z } from "zod";
import { getAIProvider } from "./provider";

export type BlockType =
  | "fixed"
  | "focus"
  | "admin"
  | "break"
  | "meal"
  | "wellbeing"
  | "buffer";

export interface DayBlock {
  start: string; // "HH:MM"
  end: string; // "HH:MM"
  title: string;
  type: BlockType;
  note?: string;
}

export type Pace = "calm" | "balanced" | "focused";

export interface BuildDayInput {
  dayStart: string;
  dayEnd: string;
  fixed: { start: string; end: string; label: string }[];
  goals: string[];
  pace: Pace;
}

export interface DayPlan {
  blocks: DayBlock[];
  summary: string;
  usedAI: boolean;
}

const Schema = z.object({
  blocks: z
    .array(
      z.object({
        start: z.string(),
        end: z.string(),
        title: z.string(),
        type: z
          .enum(["fixed", "focus", "admin", "break", "meal", "wellbeing", "buffer"])
          .default("focus"),
        note: z.string().optional(),
      }),
    )
    .default([]),
  summary: z.string().default(""),
});

export async function buildDayPlan(input: BuildDayInput): Promise<DayPlan> {
  const provider = getAIProvider();
  if (provider.isConfigured()) {
    try {
      const raw = await provider.chat({
        json: true,
        temperature: 0.4,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userPrompt(input) },
        ],
      });
      const parsed = Schema.parse(JSON.parse(extractJson(raw)));
      if (parsed.blocks.length > 0) {
        return { blocks: parsed.blocks, summary: parsed.summary, usedAI: true };
      }
    } catch {
      /* fall through to local */
    }
  }
  return localBuild(input);
}

const SYSTEM = [
  "You are a calm, practical day planner. Build a schedule that is productive but unhurried.",
  "Rules: keep all FIXED commitments exactly at their times; fill the rest with the user's goals as focus blocks;",
  "add a short break after long focus blocks; include lunch; include at least one short wellbeing/reset moment;",
  "never overpack — leave a little buffer; cover the day from start to end in order with no overlaps.",
  'Respond as strict JSON: {"blocks": [{"start":"HH:MM","end":"HH:MM","title":string,"type":"fixed|focus|admin|break|meal|wellbeing|buffer","note":string}], "summary": string}',
].join("\n");

function userPrompt(input: BuildDayInput): string {
  const fixed = input.fixed.length
    ? input.fixed.map((f) => `- ${f.start}–${f.end}: ${f.label}`).join("\n")
    : "- (none)";
  const goals = input.goals.length
    ? input.goals.map((g) => `- ${g}`).join("\n")
    : "- (none specified — suggest a light, balanced day)";
  return [
    `My day runs ${input.dayStart} to ${input.dayEnd}. Pace: ${input.pace}.`,
    `Fixed commitments:\n${fixed}`,
    `Things I want to get done:\n${goals}`,
  ].join("\n\n");
}

function extractJson(raw: string): string {
  const s = raw.indexOf("{");
  const e = raw.lastIndexOf("}");
  return s >= 0 && e > s ? raw.slice(s, e + 1) : raw;
}

// ---- Local heuristic planner ----------------------------------------------

function toMin(t: string): number {
  const [h, m] = t.split(":").map((x) => parseInt(x, 10));
  return (h || 0) * 60 + (m || 0);
}
function fmt(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function localBuild(input: BuildDayInput): DayPlan {
  const start = toMin(input.dayStart);
  const end = toMin(input.dayEnd);
  const focusLen = input.pace === "calm" ? 40 : input.pace === "focused" ? 85 : 55;
  const breakLen = input.pace === "focused" ? 10 : 15;

  const fixed = input.fixed
    .map((f) => ({ s: toMin(f.start), e: toMin(f.end), label: f.label.trim() || "Commitment" }))
    .filter((f) => f.e > f.s)
    .sort((a, b) => a.s - b.s);

  const goals = input.goals.map((g) => g.trim()).filter(Boolean);
  const blocks: DayBlock[] = [];
  let lunched = false;
  let reset = false;

  function fillGap(from: number, to: number) {
    let c = from;
    while (to - c >= 25) {
      // Lunch around midday if it lands here.
      if (!lunched && c >= 12 * 60 && c <= 14 * 60 && to - c >= 30) {
        const len = Math.min(45, to - c);
        blocks.push({ start: fmt(c), end: fmt(c + len), title: "Lunch", type: "meal", note: "Step away from the screen." });
        c += len;
        lunched = true;
        continue;
      }
      const len = Math.min(focusLen, to - c);
      const goal = goals.shift();
      blocks.push({
        start: fmt(c),
        end: fmt(c + len),
        title: goal ?? "Focus / catch-up",
        type: goal ? "focus" : "buffer",
        note: goal ? "Single task, notifications off." : "Open time — use it or rest.",
      });
      c += len;
      // Break after focus, if there's room.
      if (to - c >= breakLen + 10) {
        const isReset = !reset && c >= 14 * 60;
        blocks.push({
          start: fmt(c),
          end: fmt(c + breakLen),
          title: isReset ? "Mindful reset" : "Break",
          type: isReset ? "wellbeing" : "break",
          note: isReset ? "A minute of slow breathing." : "Stretch, water, look away from the screen.",
        });
        if (isReset) reset = true;
        c += breakLen;
      }
    }
    if (to - c >= 5) {
      blocks.push({ start: fmt(c), end: fmt(to), title: "Buffer / wind-down", type: "buffer" });
    }
  }

  let cursor = start;
  for (const f of fixed) {
    const s = Math.max(f.s, start);
    if (s > cursor) fillGap(cursor, s);
    if (f.e > cursor) {
      blocks.push({ start: fmt(Math.max(s, cursor)), end: fmt(f.e), title: f.label, type: "fixed" });
      cursor = f.e;
    }
  }
  if (cursor < end) fillGap(cursor, end);

  const summary =
    input.pace === "calm"
      ? "A gentle, spacious day — shorter focus blocks and plenty of breathing room."
      : input.pace === "focused"
        ? "A focused day with longer deep-work blocks — protect them and take the breaks."
        : "A balanced day — steady focus blocks with regular breaks to stay calm.";

  return { blocks, summary, usedAI: false };
}
