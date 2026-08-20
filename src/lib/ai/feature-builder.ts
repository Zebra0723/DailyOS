import "server-only";

import { getAIProvider } from "./provider";
import {
  generatedWidgetSchema,
  toWidgetSpec,
  widgetIdFor,
  type GeneratedWidget,
  type WidgetSpec,
} from "@/lib/widgets/spec";
import { templateFor } from "@/lib/widgets/templates";

// ----------------------------------------------------------------------------
// The AI Feature Builder: plain English in, a declarative widget spec out.
//
// The model never writes code. It picks from a fixed block vocabulary, and the
// result is validated with zod and repaired before it is stored, so a bad
// response degrades to "couldn't build that" rather than a broken dashboard.
// ----------------------------------------------------------------------------

const SYSTEM_PROMPT = `You design small dashboard widgets for DailyOS, a personal life-admin app.

The user describes a feature they want in plain English. You return a SINGLE JSON
object describing that widget, and nothing else. No prose, no code fences.

You are NOT writing code. You are choosing from a fixed set of building blocks.

Top level:
{
  "title": "short name, max 80 chars",
  "description": "one line explaining what it does, max 160 chars",
  "icon": one of: activity, book, brain, calendar, check, coins, dumbbell, flame, heart, leaf, moon, music, pencil, smile, sparkles, star, sun, target, timer, utensils
  "accent": one of: primary, emerald, sky, amber, violet, rose
  "blocks": [ 1 to 8 blocks, see below ]
}

Every block has a unique lowercase "id" (a short slug like "workouts") and a "kind".

Block kinds:

1. { "kind": "text", "id": "...", "body": "a short static note, max 400 chars" }
   Use sparingly — for a tip or instruction. Never make a widget of only text.

2. { "kind": "checklist", "id": "...", "label": "...", "items": ["..."], "resetDaily": true|false }
   A tickable list. "items" seeds it (max 30); the user can add their own later.
   resetDaily true = ticks clear each day (habits, daily routines).
   resetDaily false = ticks persist (reading list, packing list, goals).

3. { "kind": "counter", "id": "...", "label": "...", "step": 1, "target": number|null, "unit": "..."|null, "resetDaily": true|false }
   A number the user increments. Use "target" for a daily/total goal, else null.
   "unit" is a short word like "glasses", "pages", "£", "reps".

4. { "kind": "progress", "id": "...", "label": "...", "source": "<id of a counter or checklist block>" }
   A progress bar measuring another block in THIS widget. The source MUST be the
   id of a checklist, or of a counter that has a target. Otherwise omit it.

5. { "kind": "notes", "id": "...", "label": "...", "placeholder": "..." }
   A free-text box.

6. { "kind": "rating", "id": "...", "label": "...", "scale": 3-10, "icon": "star"|"heart"|"circle" }
   A 1-to-N rating the user taps. Good for energy, effort, sleep quality.

7. { "kind": "countdown", "id": "...", "label": "...", "targetDate": "YYYY-MM-DD" }
   Days remaining until a date. Pick a sensible near-future date if the user
   didn't name one — they can change it.

8. { "kind": "timer", "id": "...", "label": "...", "minutes": 1-180 }
   A countdown timer the user starts. Good for focus sessions and meditation.

Rules:
- Build what the user actually asked for. Read their words closely.
- 2 to 4 blocks is usually right. Don't pad.
- Every block id must be unique within the widget.
- Seed checklists with genuinely useful starting items drawn from the user's
  description — not placeholders like "Item 1".
- If the request is vague, make a sensible, opinionated widget anyway.
- Match the icon and accent to the subject (dumbbell+emerald for fitness,
  coins+amber for money, moon+violet for sleep, book+sky for reading).

Example — user asks "a gym tracker, 4 sessions a week, and I want to note how I felt":
{
  "title": "Gym Tracker",
  "description": "Four sessions a week, and how each one felt.",
  "icon": "dumbbell",
  "accent": "emerald",
  "blocks": [
    { "kind": "counter", "id": "sessions", "label": "Sessions this week", "step": 1, "target": 4, "unit": "sessions", "resetDaily": false },
    { "kind": "progress", "id": "weekly-progress", "label": "Weekly goal", "source": "sessions" },
    { "kind": "rating", "id": "felt", "label": "How did today feel?", "scale": 5, "icon": "star" },
    { "kind": "notes", "id": "log", "label": "Session notes", "placeholder": "What did you train?" }
  ]
}`;

/** Strip markdown fences / stray prose and grab the first JSON object. */
function extractJsonBlock(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("No JSON object found in AI response.");
  }
  return candidate.slice(start, end + 1);
}

function parseGenerated(raw: string): GeneratedWidget {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = JSON.parse(extractJsonBlock(raw));
  }
  return generatedWidgetSchema.parse(parsed);
}

export interface BuildFeatureOptions {
  /** Ids already used by this account, so the new widget gets a free one. */
  existingIds?: string[];
  /** Injected in tests; defaults to now. */
  now?: Date;
}

/**
 * Turn a plain-English description into a validated widget spec.
 *
 * Falls back to a keyword-matched template when the AI provider isn't
 * configured or the model returns something unusable, so the feature still
 * does something useful on a deployment without an AI key.
 */
export async function buildFeature(
  description: string,
  opts: BuildFeatureOptions = {},
): Promise<{ spec: WidgetSpec; usedAI: boolean }> {
  const prompt = description.trim().slice(0, 600);
  const existing = opts.existingIds ?? [];
  const createdAt = (opts.now ?? new Date()).toISOString();

  const finish = (generated: GeneratedWidget, usedAI: boolean) => ({
    spec: toWidgetSpec(generated, {
      id: widgetIdFor(generated.title, existing),
      createdAt,
    }),
    usedAI,
  });

  const provider = getAIProvider();
  if (provider.isConfigured()) {
    try {
      const raw = await provider.chat({
        json: true,
        // A little warmth — widget design benefits from some invention, but not
        // so much that the model wanders off the block vocabulary.
        temperature: 0.5,
        // Longer than inbox extraction: this is one deliberate user action.
        timeoutMs: 20_000,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
      });
      return finish(parseGenerated(raw), true);
    } catch {
      // Fall through to the template below rather than failing the request.
    }
  }

  return finish(templateFor(prompt), false);
}
