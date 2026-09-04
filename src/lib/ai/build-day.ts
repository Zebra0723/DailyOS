// ----------------------------------------------------------------------------
// Build My Day — turns the user's hours + fixed commitments + goals into a
// schedule that's productive but calm (focus blocks, breaks, meals, a reset).
// It also plans travel: given where you're going and when you need to be there,
// it works out when to leave and when to wake up, and places a "get ready" and
// a "travel" block. Uses the shared LLM provider when configured, with a local
// heuristic planner otherwise so it always returns a sensible plan. Server-only.
// ----------------------------------------------------------------------------

import "server-only";
import { z } from "zod";
import { getAIProvider } from "./provider";
import { extractJson } from "@/lib/utils";

export type BlockType =
  | "fixed"
  | "focus"
  | "admin"
  | "break"
  | "meal"
  | "wellbeing"
  | "buffer"
  | "travel";

export interface DayBlock {
  start: string; // "HH:MM"
  end: string; // "HH:MM"
  title: string;
  type: BlockType;
  note?: string;
}

export type Pace = "calm" | "balanced" | "focused";
export type EnergyPeak = "morning" | "afternoon" | "evening";
export type TravelMode = "walk" | "cycle" | "drive" | "transit";

/** Which meals to schedule, and (optionally) when. */
export interface MealPrefs {
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  breakfastAt?: string;
  lunchAt?: string;
  dinnerAt?: string;
}

/** A trip to fit into the day. travelMins is the door-to-door journey time. */
export interface TravelPlan {
  start: string;
  destination: string;
  mode: TravelMode;
  arriveBy: string; // "HH:MM"
  travelMins: number;
  getReadyMins: number;
}

export interface BuildDayInput {
  dayStart: string;
  dayEnd: string;
  fixed: { start: string; end: string; label: string }[];
  goals: string[];
  pace: Pace;
  meals?: MealPrefs;
  travel?: TravelPlan;
  energyPeak?: EnergyPeak;
}

export interface DayPlan {
  blocks: DayBlock[];
  summary: string;
  usedAI: boolean;
  /** Set when a trip was planned: when to wake, when to leave, and a one-liner. */
  wakeUp?: string;
  leaveBy?: string;
  travelNote?: string;
}

const Schema = z.object({
  blocks: z
    .array(
      z.object({
        start: z.string(),
        end: z.string(),
        title: z.string(),
        type: z
          .enum(["fixed", "focus", "admin", "break", "meal", "wellbeing", "buffer", "travel"])
          .default("focus"),
        note: z.string().optional(),
      }),
    )
    .default([]),
  summary: z.string().default(""),
});

// ---- Time helpers ----------------------------------------------------------

function toMin(t: string): number {
  const [h, m] = t.split(":").map((x) => parseInt(x, 10));
  return (h || 0) * 60 + (m || 0);
}
function fmt(min: number): string {
  const wrapped = ((min % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
function to12h(t: string): string {
  const mins = toMin(t);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h < 12 ? "am" : "pm";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12}${period}` : `${h12}:${String(m).padStart(2, "0")}${period}`;
}

// ---- Anchors: everything with a fixed time (commitments, travel, meals) -----

interface Anchor {
  s: number;
  e: number;
  label: string;
  type: BlockType;
  note?: string;
}

const MEAL_DEFAULTS = {
  breakfast: { at: "08:00", mins: 30, note: "Fuel up before the day starts." },
  lunch: { at: "13:00", mins: 45, note: "Step away from the screen." },
  dinner: { at: "19:00", mins: 45, note: "Wind down and eat properly." },
} as const;

/**
 * Build the fixed-time anchors and, if there's a trip, the wake-up / leave-by
 * times. This is deterministic and shared by both the AI and local planners, so
 * the "when to leave / wake up" headline is always right.
 */
function buildAnchors(input: BuildDayInput): {
  anchors: Anchor[];
  dayStart: string;
  wakeUp?: string;
  leaveBy?: string;
  travelNote?: string;
} {
  const anchors: Anchor[] = input.fixed
    .map((f) => ({ s: toMin(f.start), e: toMin(f.end), label: f.label.trim() || "Commitment", type: "fixed" as BlockType }))
    .filter((f) => f.e > f.s);

  let dayStart = input.dayStart;
  let wakeUp: string | undefined;
  let leaveBy: string | undefined;
  let travelNote: string | undefined;

  // Travel: work backwards from "arrive by".
  const t = input.travel;
  if (t && t.destination.trim() && t.arriveBy && t.travelMins > 0) {
    const arrive = toMin(t.arriveBy);
    const leave = arrive - t.travelMins;
    leaveBy = fmt(leave);
    anchors.push({
      s: leave,
      e: arrive,
      label: `Travel to ${t.destination.trim()}`,
      type: "travel",
      note: `${modeVerb(t.mode)} — about ${fmtDur(t.travelMins)}${t.start.trim() ? ` from ${t.start.trim()}` : ""}.`,
    });
    if (t.getReadyMins > 0) {
      const wake = leave - t.getReadyMins;
      wakeUp = fmt(wake);
      anchors.push({
        s: wake,
        e: leave,
        label: "Wake up & get ready",
        type: "fixed",
        note: `Up, ready and out the door by ${to12h(leaveBy)}.`,
      });
    }
    // If the trip starts before the stated day, pull the day start earlier.
    const earliest = wakeUp ? toMin(wakeUp) : leave;
    if (earliest < toMin(dayStart)) dayStart = fmt(earliest);
    travelNote = `Leave by ${to12h(leaveBy)} to reach ${t.destination.trim()} by ${to12h(t.arriveBy)}${
      wakeUp ? `, so wake up around ${to12h(wakeUp)}` : ""
    }.`;
  }

  // Meals.
  const m = input.meals;
  if (m) {
    const add = (on: boolean, at: string | undefined, def: (typeof MEAL_DEFAULTS)[keyof typeof MEAL_DEFAULTS], label: string) => {
      if (!on) return;
      const s = toMin(at && at.trim() ? at : def.at);
      anchors.push({ s, e: s + def.mins, label, type: "meal", note: def.note });
    };
    add(m.breakfast, m.breakfastAt, MEAL_DEFAULTS.breakfast, "Breakfast");
    add(m.lunch, m.lunchAt, MEAL_DEFAULTS.lunch, "Lunch");
    add(m.dinner, m.dinnerAt, MEAL_DEFAULTS.dinner, "Dinner");
  }

  // Resolve overlaps by sorting; the scheduler skips anything that collides.
  anchors.sort((a, b) => a.s - b.s);
  return { anchors, dayStart, wakeUp, leaveBy, travelNote };
}

function modeVerb(mode: TravelMode): string {
  switch (mode) {
    case "walk": return "Walk";
    case "cycle": return "Cycle";
    case "transit": return "Public transport";
    default: return "Drive";
  }
}
function fmtDur(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? (m ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

// ---- Public entry ----------------------------------------------------------

export async function buildDayPlan(input: BuildDayInput): Promise<DayPlan> {
  const derived = buildAnchors(input);

  const provider = getAIProvider();
  if (provider.isConfigured()) {
    try {
      const raw = await provider.chat({
        json: true,
        temperature: 0.4,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userPrompt(input, derived) },
        ],
      });
      const parsed = Schema.parse(JSON.parse(extractJson(raw)));
      if (parsed.blocks.length > 0) {
        return {
          blocks: parsed.blocks,
          summary: parsed.summary,
          usedAI: true,
          wakeUp: derived.wakeUp,
          leaveBy: derived.leaveBy,
          travelNote: derived.travelNote,
        };
      }
    } catch {
      /* fall through to local */
    }
  }

  const local = localBuild(input, derived);
  return { ...local, wakeUp: derived.wakeUp, leaveBy: derived.leaveBy, travelNote: derived.travelNote };
}

/**
 * Estimate door-to-door travel time (minutes) between two places for a mode.
 * Uses the LLM when configured; returns null otherwise so the caller can ask
 * the user to enter it. Best-effort — a rough number the user can adjust.
 */
export async function estimateTravelMins(
  start: string,
  destination: string,
  mode: TravelMode,
): Promise<number | null> {
  const provider = getAIProvider();
  if (!provider.isConfigured()) return null;
  if (!destination.trim()) return null;
  try {
    const raw = await provider.chat({
      json: true,
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "You estimate realistic door-to-door travel time. Reply ONLY as JSON " +
            '{"minutes": number}. If you cannot estimate, use {"minutes": 0}.',
        },
        {
          role: "user",
          content: `From "${start || "home"}" to "${destination}" by ${mode}. Roughly how many minutes, allowing for normal conditions?`,
        },
      ],
    });
    const parsed = JSON.parse(extractJson(raw)) as { minutes?: unknown };
    const mins = typeof parsed.minutes === "number" ? Math.round(parsed.minutes) : 0;
    return mins > 0 && mins < 24 * 60 ? mins : null;
  } catch {
    return null;
  }
}

// ---- AI prompt -------------------------------------------------------------

const SYSTEM = [
  "You are a calm, practical day planner. Build a schedule that is productive but unhurried.",
  "INTERPRET each goal — don't just echo it. Understand what the goal actually IS and schedule it accordingly:",
  "- A sport, workout or activity (e.g. 'tennis', 'gym', 'run', 'yoga') → an activity block titled naturally (e.g. 'Tennis'), type 'wellbeing', with a fitting length (a sport is usually 60–90 min, not a 'focus' slot), and a note like 'Warm up, then play.' NEVER write 'Work on tennis'.",
  "- Deep/creative work or study (e.g. 'finish the report', 'revise biology') → 'focus', note how to protect it.",
  "- Errands, admin, calls, chores (e.g. 'call mum', 'email', 'laundry') → 'admin', batched sensibly.",
  "- Meals/food → 'meal'.",
  "Title every block as the real activity in natural language (e.g. 'Tennis', 'Finish the report', 'Call Mum') — never prefix with 'Work on'. Give each a short, specific, helpful note.",
  "Rules: keep all FIXED commitments (including any travel and 'get ready' blocks) EXACTLY at their given times and types;",
  "keep the MEALS at their given times, type 'meal';",
  "give each goal a sensibly-sized block matched to what it is;",
  "SCHEDULE demanding, high-focus work during the user's stated energy peak, and lighter tasks outside it;",
  "EASE INTO THE DAY: don't put the most important or demanding task in the very first slot — start with a short, gentle settle-in (~15–20 min) then move into the real work.",
  "SPREAD tasks naturally across the day rather than stacking them all in the morning;",
  "add a short break after long focus blocks; include at least one short wellbeing/reset moment;",
  "never overpack — leave a little buffer; cover the day from start to end in order with no overlaps.",
  'Respond as strict JSON: {"blocks": [{"start":"HH:MM","end":"HH:MM","title":string,"type":"fixed|focus|admin|break|meal|wellbeing|buffer|travel","note":string}], "summary": string}',
].join("\n");

function userPrompt(input: BuildDayInput, derived: ReturnType<typeof buildAnchors>): string {
  const commitments = derived.anchors.length
    ? derived.anchors
        .map((a) => `- ${fmt(a.s)}–${fmt(a.e)}: ${a.label} [type: ${a.type}]`)
        .join("\n")
    : "- (none)";
  const goals = input.goals.length
    ? input.goals.map((g) => `- ${g}`).join("\n")
    : "- (none specified — suggest a light, balanced day)";
  const lines = [
    `My day runs ${derived.dayStart} to ${input.dayEnd}. Pace: ${input.pace}.`,
    input.energyPeak ? `My energy is highest in the ${input.energyPeak} — put demanding work then.` : "",
    derived.travelNote ? `Travel: ${derived.travelNote} Keep the travel and get-ready blocks exactly as given.` : "",
    `Fixed commitments, travel and meals (keep exactly):\n${commitments}`,
    `Things I want to get done:\n${goals}`,
  ].filter(Boolean);
  return lines.join("\n\n");
}

// ---- Local heuristic planner ----------------------------------------------

function interpretGoal(goal: string): {
  title: string;
  type: BlockType;
  note: string;
  mins: number;
} {
  const g = goal.toLowerCase();
  const title = goal.charAt(0).toUpperCase() + goal.slice(1);
  const has = (...words: string[]) => words.some((w) => g.includes(w));

  if (
    has("gym","run","jog","walk","yoga","swim","tennis","football","soccer","basketball","workout","work out","exercise","cycle","bike","pilates","stretch","climb","boxing","pad el","padel","golf","sport","hike","dance")
  ) {
    return { title, type: "wellbeing", note: "Warm up, then enjoy it — leave work behind.", mins: 75 };
  }
  if (has("lunch","dinner","breakfast","brunch","eat","meal","cook","food")) {
    return { title, type: "meal", note: "Step away from the screen.", mins: 45 };
  }
  if (has("call","phone","ring ","meet","catch up","coffee with","see ","visit")) {
    return { title, type: "admin", note: "Be present — give them your attention.", mins: 30 };
  }
  if (has("email","admin","tidy","clean","laundry","errand","shop","buy","pay ","bills","book ","organise","organize","sort ")) {
    return { title, type: "admin", note: "Batch the little jobs together.", mins: 30 };
  }
  if (has("read","study","revise","learn","research","practise","practice","memoris","memoriz")) {
    return { title, type: "focus", note: "One topic, notifications off.", mins: 50 };
  }
  if (has("rest","relax","nap","unwind","meditat","breathe","break")) {
    return { title, type: "wellbeing", note: "Genuinely switch off for a bit.", mins: 20 };
  }
  return { title, type: "focus", note: "Single task, notifications off.", mins: 0 };
}

function localBuild(input: BuildDayInput, derived: ReturnType<typeof buildAnchors>): DayPlan {
  const start = toMin(derived.dayStart);
  const end = toMin(input.dayEnd);
  const focusLen = input.pace === "calm" ? 40 : input.pace === "focused" ? 85 : 55;
  const breakLen = input.pace === "focused" ? 10 : 15;

  // Anchors that fall within the day, non-overlapping (earlier wins).
  const anchors: Anchor[] = [];
  let lastEnd = -1;
  for (const a of derived.anchors) {
    if (a.e <= start || a.s >= end) continue;
    if (a.s < lastEnd) continue; // skip a colliding anchor
    anchors.push(a);
    lastEnd = a.e;
  }

  const goals = input.goals.map((g) => g.trim()).filter(Boolean);
  const blocks: DayBlock[] = [];
  let reset = false;
  let easedIn = false;

  function fillGap(from: number, to: number) {
    let c = from;
    while (to - c >= 25) {
      if (!easedIn && c === start && to - c >= 50) {
        const len = 20;
        blocks.push({
          start: fmt(c),
          end: fmt(c + len),
          title: "Ease into the day",
          type: "admin",
          note: "Coffee, glance over your plan, clear a few quick messages.",
        });
        c += len;
        easedIn = true;
        continue;
      }
      easedIn = true;
      const goal = goals.shift();
      const interp = goal ? interpretGoal(goal) : null;
      const ideal = interp && interp.mins > 0 ? interp.mins : focusLen;
      const len = Math.min(ideal, to - c);
      blocks.push({
        start: fmt(c),
        end: fmt(c + len),
        title: interp?.title ?? "Focus / catch-up",
        type: interp?.type ?? "buffer",
        note: interp?.note ?? "Open time — use it or rest.",
      });
      c += len;
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
  for (const a of anchors) {
    const s = Math.max(a.s, start);
    if (s > cursor) fillGap(cursor, s);
    if (a.e > cursor) {
      blocks.push({ start: fmt(Math.max(s, cursor)), end: fmt(a.e), title: a.label, type: a.type, note: a.note });
      cursor = a.e;
    }
  }
  if (cursor < end) fillGap(cursor, end);

  const summaryBase =
    input.pace === "calm"
      ? "A gentle, spacious day — shorter focus blocks and plenty of breathing room."
      : input.pace === "focused"
        ? "A focused day with longer deep-work blocks — protect them and take the breaks."
        : "A balanced day — steady focus blocks with regular breaks to stay calm.";
  const summary = derived.travelNote ? `${derived.travelNote} ${summaryBase}` : summaryBase;

  return { blocks, summary, usedAI: false };
}
