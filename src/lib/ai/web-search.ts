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
// ----------------------------------------------------------------------------

import "server-only";

export interface WebResult {
  title: string;
  url: string;
  snippet: string;
}

const UA =
  "Mozilla/5.0 (compatible; DailyOS/1.0; +https://daily-os-lac.vercel.app)";

/** True when any real web-search backend can run (keyed or keyless). */
export function webSearchAvailable(): boolean {
  return true; // DuckDuckGo works with no key, so search is always possible.
}

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

function parseDuckDuckGo(html: string): WebResult[] {
  const out: WebResult[] = [];
  const linkRe =
    /<a[^>]+class="[^"]*result__a[^"]*"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  const snippetRe =
    /<a[^>]+class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/g;

  const snippets: string[] = [];
  let sm: RegExpExecArray | null;
  while ((sm = snippetRe.exec(html))) snippets.push(stripTags(sm[1]));

  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = linkRe.exec(html)) && out.length < 8) {
    const url = decodeDdgHref(m[1]);
    const title = stripTags(m[2]);
    if (url && title) out.push({ title, url, snippet: snippets[i] ?? "" });
    i++;
  }
  return out;
}

/** DuckDuckGo wraps outbound links as /l/?uddg=<encoded-url>. Unwrap them. */
function decodeDdgHref(href: string): string {
  try {
    if (href.includes("uddg=")) {
      const u = new URL(
        href.startsWith("//") ? `https:${href}` : href,
        "https://duckduckgo.com",
      );
      const target = u.searchParams.get("uddg");
      if (target) return decodeURIComponent(target);
    }
  } catch {
    /* fall through */
  }
  return href.startsWith("http") ? href : "";
}

function stripTags(s: string): string {
  return s
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function clip(s: string, n: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n)}…` : t;
}

/** Render results as a compact block for the model's context. */
export function formatResults(query: string, results: WebResult[]): string {
  const lines = results.map(
    (r, i) => `[${i + 1}] ${r.title}\n${r.url}\n${r.snippet}`,
  );
  return `WEB SEARCH RESULTS for "${query}":\n${lines.join("\n\n")}`;
}
