"use server";

import { requireAdminUser } from "@/lib/admin-server";
import { createServiceClient } from "@/lib/supabase/service";
import { runChat, testChat, aiInfo, type ChatResult } from "@/lib/ai";

export type AIConfig = {
  systemPromptOverride: string;
  model: string;
  temperature: number;
  baseUrl: string;
};

/** Raw stored blob (any subset of AIConfig may be present). */
async function readConfig(): Promise<Partial<AIConfig>> {
  try {
    const admin = createServiceClient();
    const { data } = await admin.from("app_config").select("value").eq("key", "ai_config").maybeSingle();
    return (data?.value ?? {}) as Partial<AIConfig>;
  } catch {
    return {};
  }
}

/** Merge a patch into the stored ai_config JSON without clobbering other keys. */
async function writeConfig(patch: Partial<AIConfig>): Promise<string | null> {
  const admin = createServiceClient();
  const current = await readConfig();
  const { error } = await admin.from("app_config").upsert({ key: "ai_config", value: { ...current, ...patch } });
  return error?.message ?? null;
}

export async function testAIAction(prompt: string) {
  await requireAdminUser();
  return testChat(prompt || "Reply with a short hello.");
}

/** Playground call: uses the saved model/base-URL overrides + the chosen
 *  temperature, and returns reply + latency + token usage. */
export async function runPlaygroundAction(prompt: string, temperature: number): Promise<ChatResult> {
  await requireAdminUser();
  const cfg = await getAIConfig();
  return runChat({
    prompt: prompt || "Reply with a short hello.",
    temperature,
    model: cfg.model,
    baseUrl: cfg.baseUrl,
  });
}

/** Effective config: stored override value, falling back to the env defaults. */
export async function getAIConfig(): Promise<AIConfig> {
  const v = await readConfig();
  const info = aiInfo();
  return {
    systemPromptOverride: v.systemPromptOverride ?? "",
    model: v.model ?? info.model,
    temperature: typeof v.temperature === "number" ? v.temperature : info.defaultTemperature,
    baseUrl: v.baseUrl ?? info.baseUrl,
  };
}

/** Save an extra instruction the DailyOS assistant will follow (stored in
 *  app_config.ai_config; the main app reads it on each chat). */
export async function saveAIConfig(systemPromptOverride: string): Promise<{ ok: boolean; error?: string }> {
  await requireAdminUser();
  const error = await writeConfig({ systemPromptOverride: systemPromptOverride.trim() });
  if (error) return { ok: false, error };
  return { ok: true };
}

/** Save the model / temperature / base-URL overrides. These are optional — the
 *  main app + Brain fall back to env vars when a value is unset. */
export async function saveAISettings(settings: {
  model: string;
  temperature: number;
  baseUrl: string;
}): Promise<{ ok: boolean; error?: string }> {
  await requireAdminUser();
  const temperature = Math.min(2, Math.max(0, Number(settings.temperature) || 0));
  const error = await writeConfig({
    model: settings.model.trim(),
    temperature,
    baseUrl: settings.baseUrl.trim(),
  });
  if (error) return { ok: false, error };
  return { ok: true };
}
