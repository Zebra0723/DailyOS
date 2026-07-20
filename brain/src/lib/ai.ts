import "server-only";

// Talks to the same OpenAI-compatible AI provider the DailyOS app uses.
// Defaults to Groq — override with AI_PROVIDER_BASE_URL / AI_MODEL for others.
const DEFAULT_BASE_URL = "https://api.groq.com/openai/v1";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";
const DEFAULT_TEMPERATURE = 0.4;

export function aiInfo() {
  const key = process.env.AI_PROVIDER_API_KEY ?? "";
  const baseUrl = process.env.AI_PROVIDER_BASE_URL ?? DEFAULT_BASE_URL;
  let host = "api.groq.com";
  try {
    host = new URL(baseUrl).host;
  } catch {
    /* keep default */
  }
  return {
    model: process.env.AI_MODEL ?? DEFAULT_MODEL,
    baseUrl,
    defaultTemperature: DEFAULT_TEMPERATURE,
    host,
    keyPresent: Boolean(key),
    looksLikeSupabase: key.startsWith("sb_"),
  };
}

export type ChatUsage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
};

export type ChatResult = {
  ok: boolean;
  reply?: string;
  error?: string;
  usage?: ChatUsage;
  latencyMs?: number;
};

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type ModelListResult = { ok: boolean; models?: string[]; error?: string };

/** Core chat call. Env vars are the defaults; any option overrides them so the
 *  Brain playground can try a different temperature / model / base URL. */
export async function runChat(opts: {
  prompt: string;
  temperature?: number;
  model?: string;
  baseUrl?: string;
}): Promise<ChatResult> {
  const base = (opts.baseUrl?.trim() || process.env.AI_PROVIDER_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
  const key = process.env.AI_PROVIDER_API_KEY;
  const model = opts.model?.trim() || process.env.AI_MODEL || DEFAULT_MODEL;
  const temperature = typeof opts.temperature === "number" && Number.isFinite(opts.temperature) ? opts.temperature : DEFAULT_TEMPERATURE;
  if (!key) return { ok: false, error: "No AI_PROVIDER_API_KEY set in this project." };
  const started = Date.now();
  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, temperature, messages: [{ role: "user", content: opts.prompt }] }),
      signal: AbortSignal.timeout(15_000),
    });
    const text = await res.text();
    const latencyMs = Date.now() - started;
    if (!res.ok) return { ok: false, error: `${res.status}: ${text.slice(0, 400)}`, latencyMs };
    const data = JSON.parse(text) as {
      choices?: { message?: { content?: string } }[];
      usage?: ChatUsage;
    };
    return {
      ok: true,
      reply: data.choices?.[0]?.message?.content ?? "(empty response)",
      usage: data.usage,
      latencyMs,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err), latencyMs: Date.now() - started };
  }
}

/** Multi-turn chat: sends a whole message history (plus an optional system
 *  message) to the provider so the Brain playground can hold a real
 *  conversation and preview the effective assistant persona. */
export async function runChatMessages(opts: {
  messages: ChatMessage[];
  system?: string;
  temperature?: number;
  model?: string;
  baseUrl?: string;
}): Promise<ChatResult> {
  const base = (opts.baseUrl?.trim() || process.env.AI_PROVIDER_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
  const key = process.env.AI_PROVIDER_API_KEY;
  const model = opts.model?.trim() || process.env.AI_MODEL || DEFAULT_MODEL;
  const temperature = typeof opts.temperature === "number" && Number.isFinite(opts.temperature) ? opts.temperature : DEFAULT_TEMPERATURE;
  if (!key) return { ok: false, error: "No AI_PROVIDER_API_KEY set in this project." };
  const messages: ChatMessage[] = [];
  if (opts.system?.trim()) messages.push({ role: "system", content: opts.system.trim() });
  for (const m of opts.messages) {
    if (m.content.trim()) messages.push({ role: m.role, content: m.content });
  }
  if (messages.every((m) => m.role === "system")) return { ok: false, error: "No user message to send." };
  const started = Date.now();
  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, temperature, messages }),
      signal: AbortSignal.timeout(30_000),
    });
    const text = await res.text();
    const latencyMs = Date.now() - started;
    if (!res.ok) return { ok: false, error: `${res.status}: ${text.slice(0, 400)}`, latencyMs };
    const data = JSON.parse(text) as {
      choices?: { message?: { content?: string } }[];
      usage?: ChatUsage;
    };
    return {
      ok: true,
      reply: data.choices?.[0]?.message?.content ?? "(empty response)",
      usage: data.usage,
      latencyMs,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err), latencyMs: Date.now() - started };
  }
}

/** Lists model ids from the OpenAI-compatible GET {baseUrl}/models endpoint
 *  (Groq supports it). Degrades to a friendly error if key/endpoint missing. */
export async function listModels(baseUrl?: string): Promise<ModelListResult> {
  const base = (baseUrl?.trim() || process.env.AI_PROVIDER_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
  const key = process.env.AI_PROVIDER_API_KEY;
  if (!key) return { ok: false, error: "No AI_PROVIDER_API_KEY set — can't list models." };
  try {
    const res = await fetch(`${base}/models`, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(15_000),
    });
    const text = await res.text();
    if (!res.ok) return { ok: false, error: `${res.status}: ${text.slice(0, 300)}` };
    const data = JSON.parse(text) as { data?: { id?: string }[] };
    const models = (data.data ?? []).map((m) => m.id).filter((id): id is string => Boolean(id));
    models.sort((a, b) => a.localeCompare(b));
    if (!models.length) return { ok: false, error: "Provider returned no models." };
    return { ok: true, models };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/** Backwards-compatible helper used by the Brain "Test the AI" button. */
export async function testChat(prompt: string): Promise<ChatResult> {
  return runChat({ prompt });
}
