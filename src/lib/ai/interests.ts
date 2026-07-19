// ----------------------------------------------------------------------------
// Interests — turn a stated interest into a genuinely useful mini-plan: a set of
// specific, tiered actions (do today → this week → go deeper → level up →
// community → spend wisely) plus a one-line "why it matters". Uses the shared
// LLM provider when configured, with a rich local fallback otherwise.
// Server-only.
// ----------------------------------------------------------------------------

import "server-only";
import { z } from "zod";
import { getAIProvider } from "./provider";
import { extractJson } from "@/lib/utils";

export interface InterestIdeas {
  /** One-line framing of why leaning into this is worth it. */
  intro: string;
  /** Tiered, specific, actionable suggestions (each already prefixed). */
  suggestions: string[];
  usedAI: boolean;
}

const Schema = z.object({
  intro: z.string().default(""),
  suggestions: z.array(z.string()).default([]),
});

const SYSTEM = [
  "You are a sharp personal coach helping someone genuinely live out an interest.",
  "Given ONE interest, return a short mini-plan the person would happily pay for.",
  "Write exactly 6 suggestions, each a single specific line, and each starting with one of these labels followed by a colon:",
  '"Today", "This week", "Go deeper", "Level up", "Community", "Spend wisely".',
  "Rules: be concrete and specific to THIS interest — name real kinds of resources, tools, places, techniques or milestones. No vague filler like 'spend 15 minutes on it' or 'follow an expert'. If you can, reference well-known specifics (a famous route, competition, maker, book type, technique) so it feels expert.",
  "Also return a one-sentence 'intro' explaining why leaning into this interest pays off.",
  'Respond as strict JSON: {"intro": string, "suggestions": string[]}',
].join("\n");

export async function suggestForInterest(interest: string): Promise<InterestIdeas> {
  const provider = getAIProvider();
  if (provider.isConfigured()) {
    try {
      const raw = await provider.chat({
        json: true,
        temperature: 0.7,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `Interest: ${interest}` },
        ],
      });
      const parsed = Schema.parse(JSON.parse(extractJson(raw)));
      if (parsed.suggestions.length > 0) {
        return {
          intro: parsed.intro || defaultIntro(interest),
          suggestions: parsed.suggestions.slice(0, 6),
          usedAI: true,
        };
      }
    } catch {
      /* fall through to local */
    }
  }
  return localIdeas(interest);
}


function defaultIntro(interest: string): string {
  return `A little structure turns "${interest}" from a someday wish into something you actually do — here's a plan.`;
}

// --- Rich local fallback -----------------------------------------------------
// Category-aware templates so that, even with no LLM key, the output is
// specific and genuinely useful rather than generic filler.

type Domain =
  | "sport"
  | "music"
  | "art"
  | "cook"
  | "collect"
  | "tech"
  | "language"
  | "outdoors"
  | "reading"
  | "generic";

function classify(lower: string): Domain {
  const has = (...w: string[]) => w.some((x) => lower.includes(x));
  if (has("tennis", "golf", "run", "gym", "climb", "football", "soccer", "swim", "sport", "yoga", "cycling", "bike", "boxing", "ski", "surf", "row"))
    return "sport";
  if (has("guitar", "piano", "music", "sing", "drum", "violin", "produce", "dj", "song"))
    return "music";
  if (has("paint", "draw", "art", "sketch", "photo", "design", "pottery", "sculpt", "illustrat"))
    return "art";
  if (has("cook", "bake", "coffee", "food", "wine", "cocktail", "brew", "barista", "pastry"))
    return "cook";
  if (has("watch", "patek", "rolex", "car", "sneaker", "stamp", "coin", "vinyl", "collect", "art collect", "whisky"))
    return "collect";
  if (has("code", "program", "ai", "robot", "3d print", "electronics", "arduino", "raspberry", "crypto", "data"))
    return "tech";
  if (has("french", "spanish", "language", "japanese", "german", "italian", "mandarin", "learn to speak"))
    return "language";
  if (has("hike", "camp", "fish", "garden", "bird", "forage", "kayak", "trek", "outdoor", "sail"))
    return "outdoors";
  if (has("read", "book", "novel", "poetry", "literature", "write", "writing"))
    return "reading";
  return "generic";
}

function localIdeas(interestRaw: string): InterestIdeas {
  const interest = interestRaw.trim().replace(/\.$/, "");
  const i = interest || "this";
  const domain = classify(i.toLowerCase());

  const byDomain: Record<Domain, string[]> = {
    sport: [
      `Today: do a 20-minute skills drill for ${i} and note one thing to improve`,
      `This week: book a court, class or session and put it in your calendar`,
      `Go deeper: pick one technique to fix and watch a coaching breakdown of it`,
      `Level up: sign up for a beginner-friendly local ladder, league or event`,
      `Community: find a local ${i} club or a regular meetup group to join`,
      `Spend wisely: upgrade the one piece of kit that's actually holding you back`,
    ],
    music: [
      `Today: learn or tighten one section of a piece on ${i} — hands slow, then up to speed`,
      `This week: record a 60-second clip so you can hear your own progress`,
      `Go deeper: learn the theory behind one thing you play by feel (a scale or chord shape)`,
      `Level up: set a "perform it" goal — an open mic, a friend, or a posted clip`,
      `Community: join an online ${i} community and share your recording for feedback`,
      `Spend wisely: a lesson or two with a real teacher beats months of guessing`,
    ],
    art: [
      `Today: do a 15-minute study of something in front of you for ${i}`,
      `This week: complete one finished small piece rather than more half-starts`,
      `Go deeper: copy a work you admire and note exactly what makes it work`,
      `Level up: start a consistent portfolio (a sketchbook or a folder) and date each piece`,
      `Community: post to an ${i} critique group and ask for one specific improvement`,
      `Spend wisely: buy fewer, better materials — good paper/tools change everything`,
    ],
    cook: [
      `Today: cook one thing you've never made in ${i} using what's already in the kitchen`,
      `This week: master a single technique (emulsion, sear, lamination) rather than a whole cuisine`,
      `Go deeper: learn the "why" — read up on what the heat/salt/acid is actually doing`,
      `Level up: cook the same dish three times, tweaking one variable each time`,
      `Community: find a local class or a ${i} group and swap results`,
      `Spend wisely: one great tool (a sharp knife, a scale, a thermometer) beats gadgets`,
    ],
    collect: [
      `Today: catalogue what you already own for ${i} — condition, value, what's missing`,
      `This week: set a focused "grail" list so you buy with intent, not impulse`,
      `Go deeper: learn how to spot authenticity and fair pricing before you buy`,
      `Level up: set a budget and a target piece, and track the market for it`,
      `Community: join a collectors' forum or local meet to buy, sell and learn`,
      `Spend wisely: condition and provenance hold value — buy the best example you can`,
    ],
    tech: [
      `Today: build the smallest possible working version of a ${i} idea (one hour, one feature)`,
      `This week: finish and ship one tiny project instead of starting three`,
      `Go deeper: read the docs or a paper behind the tool you use most`,
      `Level up: rebuild something you like from scratch to learn how it works`,
      `Community: join a ${i} community and share what you built for feedback`,
      `Spend wisely: put money toward a course or component that unblocks you, not gadgets`,
    ],
    language: [
      `Today: learn 10 high-frequency words in ${i} and use them in three sentences`,
      `This week: have one short real conversation (a tutor, an app partner, a friend)`,
      `Go deeper: switch one daily habit (a podcast, your phone) into ${i}`,
      `Level up: set a concrete milestone — order a meal, tell a story, pass a level`,
      `Community: find a language exchange partner or a local meetup`,
      `Spend wisely: a few tutor sessions on italki-style platforms beat endless free apps`,
    ],
    outdoors: [
      `Today: plan a specific ${i} outing with a real date, spot and kit list`,
      `This week: do a short, achievable version close to home to build the habit`,
      `Go deeper: learn one safety/skill essential (navigation, tides, knots, weather)`,
      `Level up: pick a "named" goal — a route, peak, or trip — and train toward it`,
      `Community: join a local ${i} group so you've got people and know-how`,
      `Spend wisely: invest in the safety and comfort items, rent the rest first`,
    ],
    reading: [
      `Today: read 10 pages of ${i} and jot one line about what stuck`,
      `This week: finish one thing rather than dipping into five`,
      `Go deeper: read a bit about the author or context to see more in the work`,
      `Level up: keep a simple log — title, date, one-line take — to build momentum`,
      `Community: join a book club or an online ${i} thread to discuss what you read`,
      `Spend wisely: a library card plus one well-chosen anthology goes a long way`,
    ],
    generic: [
      `Today: block 20 focused minutes on ${i} and finish one small, real thing`,
      `This week: schedule a recurring slot for ${i} so it survives a busy week`,
      `Go deeper: pick one sub-skill of ${i} and learn it properly this month`,
      `Level up: set a concrete, dated goal for ${i} you can actually hit`,
      `Community: find a club, class or online group for ${i} and introduce yourself`,
      `Spend wisely: put money toward the one thing that removes your biggest blocker`,
    ],
  };

  return {
    intro: defaultIntro(interest),
    suggestions: byDomain[domain],
    usedAI: false,
  };
}
