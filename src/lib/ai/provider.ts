// ----------------------------------------------------------------------------
// Thin, swappable LLM provider layer.
//
// We target the OpenAI-compatible Chat Completions API so the same code works
// with OpenAI, Groq, Together, OpenRouter, a local Ollama, etc. Swapping
// providers is just changing AI_PROVIDER_BASE_URL / AI_MODEL / AI_PROVIDER_API_KEY.
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
  /** Encourage strict JSON output where the provider supports it. */
  json?: boolean;
  temperature?: number;
  /** Per-call timeout in ms. Defaults to 5s (fast inbox extraction); the
   *  assistant passes a longer budget for richer replies. */
  timeoutMs?: number;
}

export interface AIProvider {
  readonly name: string;
  readonly model: string;
  isConfigured(): boolean;
  chat(opts: ChatOptions): Promise<string>;
}

class OpenAICompatibleProvider implements AIProvider {
  readonly name = "openai-compatible";

  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
    readonly model: string,
  ) {}

  isConfigured(): boolean {
    // A Supabase key (sb_...) pasted here by mistake is not a valid AI key, so
    // treat the provider as unconfigured and let the local fallback handle it.
    return Boolean(
      this.baseUrl &&
        this.apiKey &&
        this.model &&
        !this.apiKey.startsWith("sb_"),
    );
  }

  async chat({ messages, json, temperature = 0.2, timeoutMs = 5_000 }: ChatOptions): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error(
        "AI provider is not configured. Set AI_PROVIDER_BASE_URL, AI_PROVIDER_API_KEY and AI_MODEL.",
      );
    }

    const res = await fetch(`${this.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        temperature,
        messages,
        ...(json ? { response_format: { type: "json_object" } } : {}),
      }),
      // Per-call budget (default 5s for fast inbox extraction).
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `AI provider returned ${res.status}: ${text.slice(0, 500)}`,
      );
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("AI provider returned an empty response.");
    }
    return content;
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
  const model = process.env.AI_MODEL?.trim() || defaultModelForHost(baseUrl);
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

/**
 * A sensible default model for the configured host, so setting just the key +
 * base URL works. Groq in particular rejects OpenAI model names, and its own
 * models get retired often — this points at a current one when AI_MODEL is
 * blank. (An explicitly-set AI_MODEL is always honoured, even if it's stale.)
 */
function defaultModelForHost(baseUrl: string): string {
  let host = "";
  try {
    host = new URL(baseUrl).host;
  } catch {
    host = baseUrl;
  }
  if (host.includes("groq.com")) return "llama-3.3-70b-versatile";
  if (host.includes("openrouter.ai")) return "openai/gpt-4o-mini";
  if (host.includes("together")) return "meta-llama/Llama-3.3-70B-Instruct-Turbo";
  return "gpt-4o-mini";
}

let cached: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (cached) return cached;
  const baseUrl = process.env.AI_PROVIDER_BASE_URL ?? "https://api.openai.com/v1";
  const model = process.env.AI_MODEL?.trim() || defaultModelForHost(baseUrl);
  cached = new OpenAICompatibleProvider(
    baseUrl,
    process.env.AI_PROVIDER_API_KEY ?? "",
    model,
  );
  return cached;
}
