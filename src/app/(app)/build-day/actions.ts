"use server";

import { buildDayPlan, type BuildDayInput, type DayPlan } from "@/lib/ai/build-day";

export type BuildDayResponse =
  | { ok: true; plan: DayPlan }
  | { ok: false; error: string };

export async function buildDay(input: BuildDayInput): Promise<BuildDayResponse> {
  try {
    if (!input.dayStart || !input.dayEnd) {
      return { ok: false, error: "Set the hours your day runs first." };
    }
    const plan = await buildDayPlan(input);
    if (plan.blocks.length === 0) {
      return { ok: false, error: "Couldn't build a plan from that. Try widening your hours." };
    }
    return { ok: true, plan };
  } catch {
    return { ok: false, error: "Something went wrong building your day. Please try again." };
  }
}
