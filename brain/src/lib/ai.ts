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

/** Backwards-compatible helper used by the Brain "Test the AI" button. */
export async function testChat(prompt: string): Promise<ChatResult> {
  return runChat({ prompt });
}
