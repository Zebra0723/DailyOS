// ----------------------------------------------------------------------------
// Thin, swappable LLM provider layer.
//
// We target the OpenAI-compatible Chat Completions API so the same code works
// with OpenAI, Groq, Together, OpenRouter, a local Ollama, etc. Swapping
// providers is just changing AI_PROVIDER_BASE_URL / AI_MODEL / AI_PROVIDER_API_KEY.
//
// Model names rot — Groq in particular retires models often, which used to
// break every AI call until AI_MODEL was updated by hand. So the model is now
// resilient: if AI_MODEL is blank we ask the provider which models it has and
// pick a good one, and if a call fails because the model was decommissioned we
// refresh that list and retry once. Set AI_MODEL only to pin a specific model.
//
// This module is server-only: it reads the API key from the environment and
// must never be imported into a client component.
// ----------------------------------------------------------------------------

import "server-only";

export type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | ContentPart[];
}

export interface ChatOptions {
  messages: ChatMessage[];
  json?: boolean;
  temperature?: number;
  timeoutMs?: number;
}

export interface AIProvider {
  readonly name: string;
  readonly model: string;
  isConfigured(): boolean;
  chat(opts: ChatOptions): Promise<string>;
}

/** Pick a sensible chat model from a provider's /models list. Skips non-chat
 *  models (speech, guard, embeddings) and prefers capable general chat models. */
function chooseChatModel(ids: string[]): string | null {
  const notChat = /whisper|tts|text-to-speech|guard|embed|moderation|distil-whisper|playai/i;
  const candidates = ids.filter((id) => !notChat.test(id));
  const prefs: RegExp[] = [
    /llama-3\.3-70b/i,
    /llama-3\.1-70b/i,
    /llama-3\.3/i,
    /70b/i,
    /gpt-oss-120b/i,
    /gpt-oss/i,
    /qwen.*(32b|72b)/i,
    /kimi/i,
    /gemma2/i,
    /llama-3\.1-8b|8b-instant/i,
    /llama/i,
    /gpt-4o-mini/i,
    /gpt-4o/i,
  ];
  for (const p of prefs) {
    const hit = candidates.find((id) => p.test(id));
    if (hit) return hit;
  }
  return candidates[0] ?? ids[0] ?? null;
}

function isModelGoneError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("decommission") ||
    m.includes("model_not_found") ||
    m.includes("does not exist") ||
    m.includes("not found") ||
    (m.includes("model") && (m.includes("invalid") || m.includes("unsupported")))
  );
}

class OpenAICompatibleProvider implements AIProvider {
  readonly name = "openai-compatible";
  /** null → resolve automatically from the provider's /models list. */
  private resolvedModel: string | null;

  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
    configuredModel: string,
  ) {
    this.resolvedModel = configuredModel.trim() || null;
  }

  get model(): string {
    return this.resolvedModel ?? "(auto)";
  }

  isConfigured(): boolean {
    // A Supabase key (sb_...) pasted here by mistake is not a valid AI key, so
    // treat the provider as unconfigured and let the local fallback handle it.
    return Boolean(this.baseUrl && this.apiKey && !this.apiKey.startsWith("sb_"));
  }

  private root(): string {
    return this.baseUrl.replace(/\/$/, "");
  }

  /** Ask the provider which models it currently serves, and pick one. */
  private async pickModel(): Promise<string> {
    const res = await fetch(`${this.root()}/models`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) throw new Error(`Could not list models (${res.status}).`);
    const data = (await res.json()) as { data?: { id?: string }[] };
    const ids = (data.data ?? []).map((m) => m.id).filter((id): id is string => Boolean(id));
    const chosen = chooseChatModel(ids);
    if (!chosen) throw new Error("No usable chat model found on the provider.");
    return chosen;
  }

  private async request(model: string, opts: ChatOptions): Promise<string> {
    const { messages, json, temperature = 0.2, timeoutMs = 5_000 } = opts;
    const res = await fetch(`${this.root()}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature,
        messages,
        ...(json ? { response_format: { type: "json_object" } } : {}),
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`AI provider returned ${res.status}: ${text.slice(0, 500)}`);
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("AI provider returned an empty response.");
    return content;
  }

  async chat(opts: ChatOptions): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error(
        "AI provider is not configured. Set AI_PROVIDER_BASE_URL, AI_PROVIDER_API_KEY and AI_MODEL.",
      );
    }

    // Resolve a model if none is pinned.
    let model = this.resolvedModel;
    if (!model) {
      model = await this.pickModel();
      this.resolvedModel = model;
    }

    try {
      return await this.request(model, opts);
    } catch (err) {
      // If the model was retired/rejected, refresh the list, pick a live one and
      // retry once — this is what stops a decommissioned model breaking the AI.
      const message = err instanceof Error ? err.message : String(err);
      if (isModelGoneError(message)) {
        try {
          const fresh = await this.pickModel();
          if (fresh && fresh !== model) {
            this.resolvedModel = fresh;
            return await this.request(fresh, opts);
          }
        } catch {
          /* fall through to throw the original error */
        }
      }
      throw err;
    }
  }
}

/** Non-secret snapshot of the AI configuration, for the Settings self-test. */
export function getAIDiagnostics(): {
  configured: boolean;
  model: string;
  host: string;
  keyPresent: boolean;
  keyLooksLikeSupabase: boolean;
} {
  const baseUrl = process.env.AI_PROVIDER_BASE_URL ?? "https://api.openai.com/v1";
  const apiKey = process.env.AI_PROVIDER_API_KEY ?? "";
  const model = process.env.AI_MODEL?.trim() || "(auto — chosen from the provider)";
  let host = baseUrl;
  try {
    host = new URL(baseUrl).host;
  } catch {
    /* leave as-is */
  }
  return {
    configured: getAIProvider().isConfigured(),
    model,
    host,
    keyPresent: Boolean(apiKey),
    keyLooksLikeSupabase: apiKey.startsWith("sb_"),
  };
}

let cached: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (cached) return cached;
  cached = new OpenAICompatibleProvider(
    process.env.AI_PROVIDER_BASE_URL ?? "https://api.openai.com/v1",
    process.env.AI_PROVIDER_API_KEY ?? "",
    process.env.AI_MODEL ?? "",
  );
  return cached;
}
