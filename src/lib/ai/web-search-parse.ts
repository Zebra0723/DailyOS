// Pure parsing/formatting helpers for web search. No network, no server-only —
// kept separate from web-search.ts so they can be unit-tested directly.

export interface WebResult {
  title: string;
  url: string;
  snippet: string;
}

/** Strip HTML tags and decode the handful of entities DuckDuckGo emits. */
export function stripTags(s: string): string {
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

/** Collapse whitespace and clip to n chars with an ellipsis. */
export function clip(s: string, n: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n)}…` : t;
}

/** DuckDuckGo wraps outbound links as /l/?uddg=<encoded-url>. Unwrap them. */
export function decodeDdgHref(href: string): string {
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

/** Parse the DuckDuckGo HTML results page into structured results. */
export function parseDuckDuckGo(html: string): WebResult[] {
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

/** Render results as a compact block for the model's context. */
export function formatResults(query: string, results: WebResult[]): string {
  const lines = results.map(
    (r, i) => `[${i + 1}] ${r.title}\n${r.url}\n${r.snippet}`,
  );
  return `WEB SEARCH RESULTS for "${query}":\n${lines.join("\n\n")}`;
}
