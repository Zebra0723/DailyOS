"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";

/** The shape the survey modal submits — each field optional (partial allowed). */
export interface SurveyPayload {
  q_frequency?: string | null;
  q_helpful?: string | null;
  q_recommend?: string | null;
  q_improve?: string | null;
  q_love?: string | null;
}

const TEXT_LIMIT = 2000;

/**
 * Submit the mini-survey → lands in `public.survey_responses`.
 * Fills user_id/email from the session, stores each chosen option string
 * verbatim in its column, and mirrors everything into the `answers` jsonb.
 */
export async function submitSurvey(
  payload: SurveyPayload,
): Promise<{ ok: boolean; error?: string }> {
  const clip = (v: unknown) =>
    typeof v === "string" && v.trim() ? v.trim().slice(0, TEXT_LIMIT) : null;

  const q_frequency = clip(payload.q_frequency);
  const q_helpful = clip(payload.q_helpful);
  const q_recommend = clip(payload.q_recommend);
  const q_improve = clip(payload.q_improve);
  const q_love = clip(payload.q_love);

  // Require at least one answer — no empty submissions.
  if (!q_frequency && !q_helpful && !q_recommend && !q_improve && !q_love) {
    return { ok: false, error: "Answer at least one question first." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const answers = {
    q_frequency,
    q_helpful,
    q_recommend,
    q_improve,
    q_love,
  };

  try {
    const admin = createServiceClient();
    const { error } = await admin.from("survey_responses").insert({
      user_id: user?.id ?? null,
      email: user?.email ?? null,
      q_frequency,
      q_helpful,
      q_recommend,
      q_improve,
      q_love,
      answers,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
