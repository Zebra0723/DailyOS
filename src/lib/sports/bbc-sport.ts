// Fetch football scores & fixtures from BBC Sport pages.
//
// Server-side HTML scraping — no API key required. BBC Sport embeds match data
// in their server-rendered pages. We try to extract embedded JSON first (stable
// across redesigns), then fall back to HTML pattern matching.
//
// This is wrapped in try/catch throughout and returns null on any failure, so it
// can never break the page. The caller falls back to static team rosters.

import type { Match, MatchStatus, Side } from "@/lib/tournament";
import { countryFlag } from "@/lib/sports/flags";

const BASE = "https://www.bbc.com/sport/football";

export async function fetchBBCScores(
  bbcSlug: string,
): Promise<Match[] | null> {
  try {
    const res = await fetch(`${BASE}/${bbcSlug}/scores-fixtures`, {
      next: { revalidate: 120 },
    });
    if (!res.ok) return null;
    const html = await res.text();
    return extractMatches(html);
  } catch {
    return null;
  }
}

function extractMatches(html: string): Match[] | null {
  // Strategy 1: __NEXT_DATA__ (Next.js pages embed full page props here).
  const nextData = html.match(
    /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/,
  );
  if (nextData) {
    try {
      const parsed = findMatchObjects(JSON.parse(nextData[1]));
      if (parsed.length > 0) return sortAndCap(parsed);
    } catch {}
  }

  // Strategy 2: window.__INITIAL_DATA__ (BBC Simorgh / legacy React pages).
  const initData = html.match(
    /window\.__INITIAL_DATA__\s*=\s*(\{[\s\S]*?\});\s*<\/script>/,
  );
  if (initData) {
    try {
      const parsed = findMatchObjects(JSON.parse(initData[1]));
      if (parsed.length > 0) return sortAndCap(parsed);
    } catch {}
  }

  // Strategy 3: JSON-LD SportsEvent structured data.
  const ldBlocks = [
    ...html.matchAll(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
    ),
  ];
  for (const block of ldBlocks) {
    try {
      const ld = JSON.parse(block[1]);
      const items = Array.isArray(ld) ? ld : [ld];
      const events = items.filter((e) => e?.["@type"] === "SportsEvent");
      if (events.length > 0) {
        const mapped = events.map(parseLdEvent).filter(Boolean) as Match[];
        if (mapped.length > 0) return sortAndCap(mapped);
      }
    } catch {}
  }

  // Strategy 4: Regex-based extraction from HTML.
  const regexMatches = parseHtml(html);
  if (regexMatches.length > 0) return sortAndCap(regexMatches);

  return null;
}

function side(name: string, short?: string): Side {
  return { name, flag: countryFlag(name), short };
}

function statusFrom(raw: string): MatchStatus {
  const lc = raw.toLowerCase();
  if (lc.includes("live") || lc.includes("in play") || lc.includes("half")) return "live";
  if (lc.includes("ft") || lc.includes("full time") || lc.includes("finished") || lc.includes("result")) return "finished";
  return "upcoming";
}

function sortAndCap(matches: Match[]): Match[] {
  const rank = (s: MatchStatus) =>
    s === "live" ? 0 : s === "upcoming" ? 1 : 2;
  matches.sort((a, b) => {
    const r = rank(a.status) - rank(b.status);
    if (r !== 0) return r;
    const ta = a.kickoff ? Date.parse(a.kickoff) : 0;
    const tb = b.kickoff ? Date.parse(b.kickoff) : 0;
    return a.status === "finished" ? tb - ta : ta - tb;
  });
  return matches.slice(0, 20);
}

// --- Strategy 1 & 2: Recursive JSON search ----------------------------------

function findMatchObjects(obj: unknown, depth = 0): Match[] {
  if (depth > 12 || obj == null) return [];
  if (Array.isArray(obj)) return obj.flatMap((item) => findMatchObjects(item, depth + 1));
  if (typeof obj !== "object") return [];
  const o = obj as Record<string, unknown>;

  // Pattern A: { homeTeam: { name }, awayTeam: { name }, score, status }
  if (o.homeTeam && o.awayTeam) {
    const m = tryMapMatch(o);
    if (m) return [m];
  }

  // Pattern B: { home: { name }, away: { name } }
  if (
    o.home &&
    o.away &&
    typeof o.home === "object" &&
    typeof o.away === "object"
  ) {
    const m = tryMapMatchAlt(o);
    if (m) return [m];
  }

  return Object.values(o).flatMap((v) => findMatchObjects(v, depth + 1));
}

function tryMapMatch(o: Record<string, unknown>): Match | null {
  try {
    const ht = o.homeTeam as Record<string, unknown>;
    const at = o.awayTeam as Record<string, unknown>;
    const homeName = String(ht?.shortName || ht?.name || ht?.teamName || "");
    const awayName = String(at?.shortName || at?.name || at?.teamName || "");
    if (!homeName || !awayName) return null;

    const score = o.score as Record<string, unknown> | undefined;
    const ft = score?.fullTime as Record<string, unknown> | undefined;
    const hs = ft?.home ?? ft?.homeTeam ?? score?.home;
    const as_ = ft?.away ?? ft?.awayTeam ?? score?.away;
    const status = statusFrom(String(o.status ?? o.matchStatus ?? ""));
    const played = status !== "upcoming" && hs != null && as_ != null;

    return {
      id: String(o.id ?? o.matchId ?? Math.random()),
      stage: String(o.stage ?? o.matchday ?? o.round ?? ""),
      a: side(homeName, String(ht?.tla ?? ht?.abbreviation ?? "").slice(0, 3) || undefined),
      b: side(awayName, String(at?.tla ?? at?.abbreviation ?? "").slice(0, 3) || undefined),
      scoreA: played ? Number(hs) : null,
      scoreB: played ? Number(as_) : null,
      status,
      kickoff: String(o.utcDate ?? o.startTime ?? o.kickOffTime ?? o.date ?? ""),
      note: status === "finished" ? "FT" : status === "live" ? "LIVE" : undefined,
    };
  } catch {
    return null;
  }
}

function tryMapMatchAlt(o: Record<string, unknown>): Match | null {
  try {
    const home = o.home as Record<string, unknown>;
    const away = o.away as Record<string, unknown>;
    const homeName = String(home?.name || home?.teamName || home?.fullName || "");
    const awayName = String(away?.name || away?.teamName || away?.fullName || "");
    if (!homeName || !awayName) return null;

    const homeScore = home?.score ?? o.homeScore;
    const awayScore = away?.score ?? o.awayScore;
    const statusRaw = String(o.status ?? o.eventStatus ?? o.state ?? "");
    const status = statusFrom(statusRaw);
    const played = status !== "upcoming" && homeScore != null && awayScore != null;

    return {
      id: String(o.id ?? o.eventId ?? Math.random()),
      stage: String(o.round ?? o.competition ?? ""),
      a: side(homeName),
      b: side(awayName),
      scoreA: played ? Number(homeScore) : null,
      scoreB: played ? Number(awayScore) : null,
      status,
      kickoff: String(o.startTime ?? o.date ?? o.kickOff ?? ""),
      note: status === "finished" ? "FT" : status === "live" ? "LIVE" : undefined,
    };
  } catch {
    return null;
  }
}

// --- Strategy 3: JSON-LD SportsEvent ----------------------------------------

function parseLdEvent(ev: Record<string, unknown>): Match | null {
  try {
    const teams = ev.competitor as Array<Record<string, unknown>> | undefined;
    if (!teams || teams.length < 2) return null;
    const homeName = String(teams[0]?.name ?? "");
    const awayName = String(teams[1]?.name ?? "");
    if (!homeName || !awayName) return null;

    const status: MatchStatus =
      ev.eventStatus === "https://schema.org/EventScheduled"
        ? "upcoming"
        : ev.eventStatus === "https://schema.org/EventCancelled"
          ? "upcoming"
          : "finished";

    return {
      id: String(ev.identifier ?? ev.url ?? Math.random()),
      stage: "",
      a: side(homeName),
      b: side(awayName),
      scoreA: null,
      scoreB: null,
      status,
      kickoff: String(ev.startDate ?? ""),
    };
  } catch {
    return null;
  }
}

// --- Strategy 4: Regex HTML parsing -----------------------------------------

function parseHtml(html: string): Match[] {
  const matches: Match[] = [];

  // BBC Sport uses data-* attributes and aria labels for accessibility.
  // Try to find match containers with team names and scores.

  // Pattern: aria-label containing "team vs team" or "team number - number team"
  const ariaPattern =
    /aria-label="([^"]*?\b(?:v|vs|versus)\b[^"]*?)"/gi;
  let m;
  while ((m = ariaPattern.exec(html)) !== null) {
    const label = m[1];
    const vsMatch = label.match(
      /(.+?)\s+(?:v|vs|versus)\s+(.+?)(?:\s*[-–]\s*|\s*$)/i,
    );
    if (vsMatch) {
      const home = vsMatch[1].trim();
      const away = vsMatch[2].trim();
      if (home && away) {
        matches.push({
          id: `bbc-${matches.length}`,
          stage: "",
          a: side(home),
          b: side(away),
          scoreA: null,
          scoreB: null,
          status: "upcoming",
        });
      }
    }
  }

  // Pattern: "Home Team N - N Away Team" or similar score patterns
  const scorePattern =
    /(?:class="[^"]*(?:home|team)[^"]*">)\s*([^<]+?)\s*<[\s\S]*?(\d+)\s*[-–]\s*(\d+)[\s\S]*?(?:class="[^"]*(?:away|team)[^"]*">)\s*([^<]+?)\s*</gi;
  while ((m = scorePattern.exec(html)) !== null) {
    const home = m[1].trim();
    const scoreH = parseInt(m[2], 10);
    const scoreA = parseInt(m[3], 10);
    const away = m[4].trim();
    if (home && away && !isNaN(scoreH) && !isNaN(scoreA)) {
      matches.push({
        id: `bbc-s-${matches.length}`,
        stage: "",
        a: side(home),
        b: side(away),
        scoreA: scoreH,
        scoreB: scoreA,
        status: "finished",
        note: "FT",
      });
    }
  }

  return matches;
}
