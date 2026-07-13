import { describe, it, expect } from "vitest";
import {
  stripTags,
  clip,
  decodeDdgHref,
  parseDuckDuckGo,
  formatResults,
  looksLikeWebLookup,
} from "./web-search-parse";

describe("stripTags", () => {
  it("removes tags and decodes entities", () => {
    expect(stripTags("<b>Fish &amp; Chips</b>")).toBe("Fish & Chips");
    expect(stripTags("Tom&#x27;s &quot;place&quot;")).toBe('Tom\'s "place"');
  });

  it("collapses whitespace", () => {
    expect(stripTags("a\n  b   c")).toBe("a b c");
  });
});

describe("clip", () => {
  it("leaves short strings untouched", () => {
    expect(clip("hello", 100)).toBe("hello");
  });

  it("truncates long strings with an ellipsis", () => {
    const out = clip("a".repeat(50), 10);
    expect(out).toBe("aaaaaaaaaa…");
    expect(out.length).toBe(11); // 10 chars + ellipsis
  });
});

describe("decodeDdgHref", () => {
  it("unwraps a uddg redirect link to the real url", () => {
    const href =
      "//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2Fpage&rut=abc";
    expect(decodeDdgHref(href)).toBe("https://example.com/page");
  });

  it("passes through a plain absolute url", () => {
    expect(decodeDdgHref("https://example.com")).toBe("https://example.com");
  });

  it("drops a relative link with no target", () => {
    expect(decodeDdgHref("/settings")).toBe("");
  });
});

describe("parseDuckDuckGo", () => {
  const html = `
    <div class="result">
      <a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fen.wikipedia.org%2FParis">Paris</a>
      <a class="result__snippet" href="//duckduckgo.com/l/?uddg=x">Paris is the <b>capital</b> of France.</a>
    </div>
    <div class="result">
      <a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2Ffrance">France guide</a>
      <a class="result__snippet">Everything about France &amp; its cities.</a>
    </div>`;

  it("extracts titles, unwrapped urls and snippets", () => {
    const results = parseDuckDuckGo(html);
    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({
      title: "Paris",
      url: "https://en.wikipedia.org/Paris",
      snippet: "Paris is the capital of France.",
    });
    expect(results[1].url).toBe("https://example.com/france");
    expect(results[1].snippet).toBe("Everything about France & its cities.");
  });

  it("returns [] for html with no results", () => {
    expect(parseDuckDuckGo("<html><body>nothing here</body></html>")).toEqual([]);
  });
});

describe("looksLikeWebLookup", () => {
  it("fires for scheduling a real-world event", () => {
    expect(looksLikeWebLookup("add england v argentina to my calendar")).toBe(true);
    expect(looksLikeWebLookup("put the next Dune film release in my diary")).toBe(true);
    expect(looksLikeWebLookup("schedule the Arsenal match this weekend")).toBe(true);
  });

  it("fires for current/factual questions", () => {
    expect(looksLikeWebLookup("when is the next UK bank holiday")).toBe(true);
    expect(looksLikeWebLookup("what's the weather in Paris tomorrow")).toBe(true);
    expect(looksLikeWebLookup("who won the game last night")).toBe(true);
  });

  it("does NOT fire for the user's own data / app queries", () => {
    expect(looksLikeWebLookup("what's on my plate today")).toBe(false);
    expect(looksLikeWebLookup("plan my afternoon")).toBe(false);
    expect(looksLikeWebLookup("anything overdue or clashing?")).toBe(false);
    expect(looksLikeWebLookup("remind me to take the bins out every Tuesday")).toBe(false);
  });
});

describe("formatResults", () => {
  it("renders a numbered block with the query", () => {
    const out = formatResults("capital of france", [
      { title: "Paris", url: "https://x.com", snippet: "It's Paris." },
    ]);
    expect(out).toContain('WEB SEARCH RESULTS for "capital of france":');
    expect(out).toContain("[1] Paris");
    expect(out).toContain("https://x.com");
    expect(out).toContain("It's Paris.");
  });
});
