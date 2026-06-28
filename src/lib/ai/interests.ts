// ----------------------------------------------------------------------------
// Interests — turn a stated interest into specific, actionable ways to embrace
// it (quick daily actions through to bigger, aspirational steps). Uses the
// shared LLM provider when configured, with a local fallback otherwise.
// Server-only.
// ----------------------------------------------------------------------------

import "server-only";
import { z } from "zod";
import { getAIProvider } from "./provider";

export interface InterestIdeas {
  suggestions: string[];
  usedAI: boolean;
}

const Schema = z.object({
  suggestions: z.array(z.string()).default([]),
});

const SYSTEM = [
  "You help people live out their interests. Given one interest, suggest 4-6 specific, actionable things they could do to bring it into their life.",
  "Mix quick wins (something they could do today) with bigger steps (a goal, a community to join, a purchase or aspirational move where relevant — e.g. joining a waiting list).",
  "Be concrete and tailored to the interest, not generic. Keep each item to one short line.",
  'Respond as strict JSON: {"suggestions": string[]}',
].join("\n");

export async function suggestForInterest(interest: string): Promise<InterestIdeas> {
  const provider = getAIProvider();
  if (provider.isConfigured()) {
    try {
      const raw = await provider.chat({
        json: true,
        temperature: 0.6,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `Interest: ${interest}` },
        ],
      });
      const parsed = Schema.parse(JSON.parse(extractJson(raw)));
      if (parsed.suggestions.length > 0) {
        return { suggestions: parsed.suggestions.slice(0, 6), usedAI: true };
      }
    } catch {
      /* fall through */
    }
  }
  return localIdeas(interest);
}

function extractJson(raw: string): string {
  const s = raw.indexOf("{");
  const e = raw.lastIndexOf("}");
  return s >= 0 && e > s ? raw.slice(s, e + 1) : raw;
}

function localIdeas(interestRaw: string): InterestIdeas {
  const interest = interestRaw.trim().replace(/\.$/, "");
  const lower = interest.toLowerCase();
  const has = (...w: string[]) => w.some((x) => lower.includes(x));

  const ideas: string[] = [
    `Spend 15–20 minutes on ${interest} today`,
    `Follow an expert, channel or community about ${interest}`,
    `Watch or read something to go a level deeper on ${interest}`,
    `Set one small goal for ${interest} this week`,
  ];

  // A few category-aware nudges.
  if (has("watch", "patek", "rolex", "car", "art", "wine", "collect"))
    ideas.push(`If the budget allows, take a real step — visit a dealer or join a waiting list for ${interest}`);
  if (has("tennis", "golf", "run", "gym", "climb", "football", "swim", "sport", "yoga"))
    ideas.push(`Book a session, court or class for ${interest} this week`);
  if (has("guitar", "piano", "music", "sing", "paint", "draw", "write", "photo"))
    ideas.push(`Practise ${interest} for 10 minutes and save what you make`);
  if (has("cook", "bake", "coffee", "food"))
    ideas.push(`Try one new ${interest} recipe or technique this week`);

  ideas.push(`Find a local club, class or event for ${interest}`);

  return { suggestions: Array.from(new Set(ideas)).slice(0, 6), usedAI: false };
}
