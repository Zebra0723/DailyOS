import { createServiceClient } from "@/lib/supabase/service";

/** A single survey response row. Mirrors the `survey_responses` table. */
export interface SurveyResponse {
  id: string;
  user_id: string | null;
  email: string | null;
  q_frequency: string | null;
  q_helpful: string | null;
  q_recommend: string | null;
  q_improve: string | null;
  q_love: string | null;
  answers: Record<string, unknown> | null;
  created_at: string;
}

/** The fixed survey spec. Labels here are canonical and must match the
 *  survey form — the results page renders questions/options in this order. */
export const MULTIPLE_CHOICE = [
  {
    key: "q_frequency" as const,
    label: "How often do you use DailyOS?",
    options: ["Daily", "A few times a week", "Occasionally", "Rarely"],
  },
  {
    key: "q_helpful" as const,
    label: "How much has DailyOS helped with your life admin?",
    options: ["A lot", "Somewhat", "A little", "Not yet"],
  },
  {
    key: "q_recommend" as const,
    label: "How likely are you to recommend DailyOS?",
    options: ["Very likely", "Likely", "Neutral", "Unlikely"],
  },
];

export const OPEN_ENDED = [
  { key: "q_improve" as const, label: "What's the one thing we could improve?" },
  { key: "q_love" as const, label: "What do you love most about DailyOS?" },
];

/** Load survey responses safely. Never throws — the page renders a graceful
 *  message when the table is missing or a query fails. */
export async function loadSurveyResponses(): Promise<{
  items: SurveyResponse[];
  error: string | null;
}> {
  const admin = createServiceClient();
  try {
    const res = await admin
      .from("survey_responses")
      .select(
        "id,user_id,email,q_frequency,q_helpful,q_recommend,q_improve,q_love,answers,created_at",
      )
      .order("created_at", { ascending: false })
      .limit(2000);
    if (res.error) return { items: [], error: res.error.message };
    return { items: (res.data ?? []) as SurveyResponse[], error: null };
  } catch (e) {
    return { items: [], error: e instanceof Error ? e.message : String(e) };
  }
}
