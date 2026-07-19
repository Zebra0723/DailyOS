// ----------------------------------------------------------------------------
// Web search for "Ask DailyOS". Lets the assistant look things up on the
// internet instead of being limited to the model's training data.
//
// Backends, in order of preference:
//   1. Tavily  — set TAVILY_API_KEY (free tier at tavily.com). Best quality,
//      returns clean titles + snippets built for LLMs.
//   2. Brave   — set BRAVE_API_KEY (free tier). Standard web results.
//   3. DuckDuckGo HTML — no key needed. A best-effort scrape so search works
//      out of the box; less reliable than the keyed options.
//
// Every path fails soft: on any error we return [] so the assistant simply
// answers without web context rather than erroring. Server-only.
//
// Pure parsing/formatting lives in ./web-search-parse (unit-tested there).
// ----------------------------------------------------------------------------

import "server-only";
import {
  parseDuckDuckGo,
  stripTags,
  clip,
  formatResults,
  looksLikeWebLookup,
  type WebResult,
} from "./web-search-parse";

export type { WebResult };
export { formatResults, looksLikeWebLookup };

const UA =
  "Mozilla/5.0 (compatible; DailyOS/1.0; +https://daily-os-lac.vercel.app)";

/**
 * Search the web and return up to 5 results. Never throws — returns [] on any
 * failure, timeout, or empty query.
 */
export async function searchWeb(
  query: string,
  timeoutMs = 6_000,
): Promise<WebResult[]> {
  const q = query.trim().replace(/\s+/g, " ").slice(0, 400);
  if (q.length < 3) return [];
  try {
    if (process.env.TAVILY_API_KEY) return await tavilySearch(q, timeoutMs);
    if (process.env.BRAVE_API_KEY) return await braveSearch(q, timeoutMs);
    return await duckDuckGoSearch(q, timeoutMs);
  } catch {
    return [];
  }
}

async function tavilySearch(
  query: string,
  timeoutMs: number,
): Promise<WebResult[]> {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query,
      max_results: 5,
      search_depth: "basic",
      include_answer: false,
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) return [];
  const data = (await res.json()) as {
    results?: { title?: string; url?: string; content?: string }[];
  };
  return (data.results ?? [])
    .map((r) => ({
      title: (r.title ?? "").trim(),
      url: (r.url ?? "").trim(),
      snippet: clip(r.content ?? "", 300),
    }))
    .filter((r) => r.url)
    .slice(0, 5);
}

async function braveSearch(
  query: string,
  timeoutMs: number,
): Promise<WebResult[]> {
  const res = await fetch(
    `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`,
    {
      headers: {
        Accept: "application/json",
        "X-Subscription-Token": process.env.BRAVE_API_KEY ?? "",
      },
      signal: AbortSignal.timeout(timeoutMs),
    },
  );
  if (!res.ok) return [];
  const data = (await res.json()) as {
    web?: { results?: { title?: string; url?: string; description?: string }[] };
  };
  return (data.web?.results ?? [])
    .map((r) => ({
      title: stripTags(r.title ?? ""),
      url: (r.url ?? "").trim(),
      snippet: clip(stripTags(r.description ?? ""), 300),
    }))
    .filter((r) => r.url)
    .slice(0, 5);
}

async function duckDuckGoSearch(
  query: string,
  timeoutMs: number,
): Promise<WebResult[]> {
  const res = await fetch(
    `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
    {
      headers: { "User-Agent": UA, Accept: "text/html" },
      signal: AbortSignal.timeout(timeoutMs),
    },
  );
  if (!res.ok) return [];
  return parseDuckDuckGo(await res.text()).slice(0, 5);
}
