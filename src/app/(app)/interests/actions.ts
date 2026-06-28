"use server";

import { suggestForInterest, type InterestIdeas } from "@/lib/ai/interests";

export type InterestResponse =
  | { ok: true; ideas: InterestIdeas }
  | { ok: false; error: string };

export async function getInterestIdeas(interest: string): Promise<InterestResponse> {
  const trimmed = interest.trim();
  if (trimmed.length < 2) {
    return { ok: false, error: "Tell me a bit more about the interest." };
  }
  try {
    const ideas = await suggestForInterest(trimmed);
    return { ok: true, ideas };
  } catch {
    return { ok: false, error: "Couldn't get ideas right now. Please try again." };
  }
}
