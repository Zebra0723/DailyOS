"use server";

import { requireAdminUser } from "@/lib/admin-server";
import { createServiceClient } from "@/lib/supabase/service";
import { runChat, runChatMessages, listModels, testChat, aiInfo, type ChatResult, type ChatMessage, type ModelListResult } from "@/lib/ai";

export type Preset = { name: string; text: string };

export type AIConfig = {
  systemPromptOverride: string;
  model: string;
  temperature: number;
  baseUrl: string;
  presets: Preset[];
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

/** Multi-turn playground call: sends the whole conversation history plus the
 *  current system-prompt override so the reply previews the real assistant. */
export async function runChatAction(
  messages: ChatMessage[],
  temperature: number,
  system: string,
): Promise<ChatResult> {
  await requireAdminUser();
  const cfg = await getAIConfig();
  return runChatMessages({
    messages,
    system: system?.trim() || undefined,
    temperature,
    model: cfg.model,
    baseUrl: cfg.baseUrl,
  });
}

/** Fetch the model ids the configured provider exposes (GET /models). */
export async function listModelsAction(): Promise<ModelListResult> {
  await requireAdminUser();
  const cfg = await getAIConfig();
  return listModels(cfg.baseUrl);
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
    presets: Array.isArray(v.presets) ? v.presets.filter((p): p is Preset => Boolean(p && typeof p.name === "string" && typeof p.text === "string")) : [],
  };
}

/** Save the current override text as a named preset (upsert by name), merged
 *  into ai_config.presets without clobbering the rest of the JSON. */
export async function savePresetAction(name: string, text: string): Promise<{ ok: boolean; error?: string; presets?: Preset[] }> {
  await requireAdminUser();
  const n = name.trim();
  if (!n) return { ok: false, error: "Preset name is required." };
  const current = await readConfig();
  const existing = Array.isArray(current.presets) ? current.presets.filter((p): p is Preset => Boolean(p && typeof p.name === "string" && typeof p.text === "string")) : [];
  const next = [...existing.filter((p) => p.name !== n), { name: n, text }];
  next.sort((a, b) => a.name.localeCompare(b.name));
  const error = await writeConfig({ presets: next });
  if (error) return { ok: false, error };
  return { ok: true, presets: next };
}

/** Delete a named preset from ai_config.presets. */
export async function deletePresetAction(name: string): Promise<{ ok: boolean; error?: string; presets?: Preset[] }> {
  await requireAdminUser();
  const current = await readConfig();
  const existing = Array.isArray(current.presets) ? current.presets.filter((p): p is Preset => Boolean(p && typeof p.name === "string" && typeof p.text === "string")) : [];
  const next = existing.filter((p) => p.name !== name);
  const error = await writeConfig({ presets: next });
  if (error) return { ok: false, error };
  return { ok: true, presets: next };
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
