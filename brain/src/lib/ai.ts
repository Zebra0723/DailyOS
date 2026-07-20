import "server-only";

// Talks to the same OpenAI-compatible AI provider the DailyOS app uses.
export function aiInfo() {
  const key = process.env.AI_PROVIDER_API_KEY ?? "";
  let host = "api.openai.com";
  try {
    host = new URL(process.env.AI_PROVIDER_BASE_URL ?? "https://api.openai.com/v1").host;
  } catch {
    /* keep default */
  }
  return {
    model: process.env.AI_MODEL ?? "gpt-4o-mini",
    host,
    keyPresent: Boolean(key),
    looksLikeSupabase: key.startsWith("sb_"),
  };
}

export async function testChat(prompt: string): Promise<{ ok: boolean; reply?: string; error?: string }> {
  const base = (process.env.AI_PROVIDER_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "");
  const key = process.env.AI_PROVIDER_API_KEY;
  const model = process.env.AI_MODEL ?? "gpt-4o-mini";
  if (!key) return { ok: false, error: "No AI_PROVIDER_API_KEY set in this project." };
  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, temperature: 0.4, messages: [{ role: "user", content: prompt }] }),
      signal: AbortSignal.timeout(15_000),
    });
    const text = await res.text();
    if (!res.ok) return { ok: false, error: `${res.status}: ${text.slice(0, 400)}` };
    const data = JSON.parse(text) as { choices?: { message?: { content?: string } }[] };
    return { ok: true, reply: data.choices?.[0]?.message?.content ?? "(empty response)" };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
