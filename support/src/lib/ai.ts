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
  };
}

export type ChatResult = {
  ok: boolean;
  reply?: string;
  error?: string;
};

/** Core chat call. Env vars are the defaults; never throws. */
export async function runChat(opts: {
  prompt: string;
  system?: string;
  temperature?: number;
  model?: string;
  baseUrl?: string;
}): Promise<ChatResult> {
  const base = (opts.baseUrl?.trim() || process.env.AI_PROVIDER_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
  const key = process.env.AI_PROVIDER_API_KEY;
  const model = opts.model?.trim() || process.env.AI_MODEL || DEFAULT_MODEL;
  const temperature =
    typeof opts.temperature === "number" && Number.isFinite(opts.temperature)
      ? opts.temperature
      : DEFAULT_TEMPERATURE;
  if (!key) return { ok: false, error: "No AI_PROVIDER_API_KEY set in this project." };
  const messages: { role: "system" | "user"; content: string }[] = [];
  if (opts.system?.trim()) messages.push({ role: "system", content: opts.system.trim() });
  messages.push({ role: "user", content: opts.prompt });
  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, temperature, messages }),
      signal: AbortSignal.timeout(30_000),
    });
    const text = await res.text();
    if (!res.ok) return { ok: false, error: `${res.status}: ${text.slice(0, 400)}` };
    const data = JSON.parse(text) as { choices?: { message?: { content?: string } }[] };
    return { ok: true, reply: data.choices?.[0]?.message?.content ?? "(empty response)" };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/** Produce a short thematic summary of one open-ended survey question's
 *  answers: main themes, common requests, and overall sentiment.
 *  Never throws — degrades to a friendly message when the key is missing
 *  or there are no answers. */
export async function summarizeAnswers(
  question: string,
  answers: string[],
): Promise<ChatResult> {
  const cleaned = answers.map((a) => a.trim()).filter(Boolean);
  if (cleaned.length === 0) {
    return { ok: false, error: "No answers to summarize yet." };
  }
  if (!aiInfo().keyPresent) {
    return {
      ok: false,
      error:
        "AI summaries are off — set AI_PROVIDER_API_KEY in this project to enable them. The verbatim answers below are the full record.",
    };
  }
  // Cap the volume sent to the model so very large surveys stay within limits.
  const MAX = 300;
  const sample = cleaned.slice(0, MAX);
  const numbered = sample.map((a, i) => `${i + 1}. ${a.replace(/\s+/g, " ").slice(0, 600)}`).join("\n");
  const note =
    cleaned.length > MAX ? `\n\n(Showing the ${MAX} most recent of ${cleaned.length} answers.)` : "";
  const system =
    "You analyze open-ended survey responses for a product team. Be concise, concrete, and neutral. " +
    "Do not invent responses; summarize only what is present.";
  const prompt =
    `Survey question: "${question}"\n\n` +
    `Below are ${sample.length} responses. Write a short summary (about 120 words) covering:\n` +
    `- the main themes\n- the most common specific requests or points\n- the overall sentiment\n` +
    `Use a few short bullet points. Do not quote long passages.${note}\n\nResponses:\n${numbered}`;
  return runChat({ prompt, system });
}
