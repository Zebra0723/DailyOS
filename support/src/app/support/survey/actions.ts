"use server";

import { requireAdminUser } from "@/lib/admin-server";
import { createServiceClient } from "@/lib/supabase/service";
import { summarizeAnswers } from "@/lib/ai";
import { OPEN_ENDED } from "@/lib/survey";

type SummaryResult = { ok: boolean; summary?: string; error?: string };

/** Summarize one open-ended question's answers with AI. Reads the answers
 *  server-side (read-only) so the client only sends which question to run. */
export async function summarizeQuestion(questionKey: string): Promise<SummaryResult> {
  await requireAdminUser();
  const spec = OPEN_ENDED.find((q) => q.key === questionKey);
  if (!spec) return { ok: false, error: "Unknown question." };

  let answers: string[] = [];
  try {
    const admin = createServiceClient();
    const res = await admin
      .from("survey_responses")
      .select(`${spec.key},created_at`)
      .order("created_at", { ascending: false })
      .limit(2000);
    if (res.error) return { ok: false, error: "Couldn't load answers to summarize." };
    answers = (res.data ?? [])
      .map((r) => (r as Record<string, unknown>)[spec.key])
      .filter((v): v is string => typeof v === "string" && v.trim().length > 0);
  } catch {
    return { ok: false, error: "Couldn't load answers to summarize." };
  }

  const out = await summarizeAnswers(spec.label, answers);
  if (!out.ok) return { ok: false, error: out.error ?? "AI summary failed." };
  return { ok: true, summary: out.reply };
}
