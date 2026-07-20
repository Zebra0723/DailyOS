"use server";

import { requireAdminUser } from "@/lib/admin-server";
import { createServiceClient } from "@/lib/supabase/service";
import { testChat } from "@/lib/ai";

export async function testAIAction(prompt: string) {
  await requireAdminUser();
  return testChat(prompt || "Reply with a short hello.");
}

export async function getAIConfig(): Promise<{ systemPromptOverride: string }> {
  try {
    const admin = createServiceClient();
    const { data } = await admin.from("app_config").select("value").eq("key", "ai_config").maybeSingle();
    const v = (data?.value ?? {}) as { systemPromptOverride?: string };
    return { systemPromptOverride: v.systemPromptOverride ?? "" };
  } catch {
    return { systemPromptOverride: "" };
  }
}

/** Save an extra instruction the DailyOS assistant will follow (stored in
 *  app_config.ai_config; the main app reads it on each chat). */
export async function saveAIConfig(systemPromptOverride: string): Promise<{ ok: boolean; error?: string }> {
  await requireAdminUser();
  const admin = createServiceClient();
  const { error } = await admin
    .from("app_config")
    .upsert({ key: "ai_config", value: { systemPromptOverride: systemPromptOverride.trim() } });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
