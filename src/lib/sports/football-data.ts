// Live football data via football-data.org (free tier: set FOOTBALL_DATA_TOKEN).
//
// Given a competition code (e.g. "WC" World Cup, "EC" Euros, "CL", "PL"), this
// returns live/finished/upcoming scorelines, league standings and — when the
// tournament is in its knockout phase — a bracket, all shaped to our tournament
// types. Everything is wrapped in try/catch and optional-chaining: on a missing
// key, rate limit, or any unexpected response it returns null, and the caller
// falls back to the hand-maintained config. So this can never break the page.

import { countryFlag } from "@/lib/sports/flags";
import type {
  Match,
  MatchStatus,
  Side,
  StandingsGroup,
  TableRow,
  BracketRound,
  BracketMatch,
  BracketSlot,
} from "@/lib/tournament";

const BASE = "https://api.football-data.org/v4";

type SeasonTables = {
  kind: "league";
  groups: StandingsGroup[];
  label: string;
};

type LiveBundle = {
  scores: Match[];
  tables: SeasonTables | null;
  prevTables: SeasonTables | null;
  bracket: { label: string; rounds: BracketRound[] } | null;
};

export async function fetchFootballData(
  code: string,
): Promise<LiveBundle | null> {
  const token = process.env.FOOTBALL_DATA_TOKEN;
  if (!token) return null;
  const headers = { "X-Auth-Token": token } as Record<string, string>;

  try {
    const [mRes, sRes] = await Promise.all([
      fetch(`${BASE}/competitions/${code}/matches`, {
        headers,
        next: { revalidate: 30 },
      }),
      fetch(`${BASE}/competitions/${code}/standings`, {
        headers,
        next: { revalidate: 300 },
      }),
    ]);

    const matches: any[] = mRes.ok ? (await mRes.json())?.matches ?? [] : [];
    const standingsJson: any = sRes.ok ? await sRes.json() : null;

    if (matches.length === 0 && !standingsJson) return null;

    const tables = mapStandings(standingsJson);
    const seasonLabel = seasonString(standingsJson);

    // Fetch previous season standings.
    let prevTables: SeasonTables | null = null;
    const prevYear = prevSeasonYear(standingsJson);
    if (prevYear != null) {
      try {
        const pRes = await fetch(
          `${BASE}/competitions/${code}/standings?season=${prevYear}`,
          { headers, next: { revalidate: 3600 } },
        );
        if (pRes.ok) {
          const pJson = await pRes.json();
          const mapped = mapStandings(pJson);
          if (mapped) {
            prevTables = { ...mapped, label: seasonString(pJson) };
          }
        }
      } catch {
        // Previous season is optional — swallow errors.
      }
    }

    // If the current season hasn't started, sort teams alphabetically.
    if (tables) {
      for (const g of tables.groups) {
        const allZero = g.rows.every((r) => r.played === 0);
        if (allZero) {
          g.rows.sort((a, b) => a.team.name.localeCompare(b.team.name));
        }
      }
    }

    return {
      scores: pickScores(matches),
      tables: tables ? { ...tables, label: seasonLabel } : null,
      prevTables,
      bracket: buildBracket(matches),
    };
  } catch {
    return null;
  }
}

function side(team: any): Side {
  const name: string = team?.shortName || team?.name || "TBD";
  const s: Side = { name, flag: countryFlag(team?.name || name), short: team?.tla };
  if (team?.crest) s.crest = team.crest;
  return s;
}

function statusOf(s: string): MatchStatus {
  if (s === "IN_PLAY" || s === "PAUSED" || s === "LIVE") return "live";
  if (s === "FINISHED" || s === "AWARDED") return "finished";
  return "upcoming";
}

function prettyStage(stage?: string, group?: string): string {
  const map: Record<string, string> = {
    GROUP_STAGE: "Group stage",
    LAST_16: "Round of 16",
    ROUND_OF_16: "Round of 16",
    LAST_32: "Round of 32",
    QUARTER_FINALS: "Quarter-final",
    SEMI_FINALS: "Semi-final",
    THIRD_PLACE: "Third place",
    FINAL: "Final",
  };
  const base =
    (stage && map[stage]) ||
    (stage
      ? stage
          .toLowerCase()
          .replace(/_/g, " ")
          .replace(/^\w/, (c) => c.toUpperCase())
      : "Match");
  if (group) {
    const g = group.replace(/GROUP_/, "Group ").replace(/_/g, " ");
    return `${g}`;
  }
  return base;
}

function toMatch(m: any): Match {
  const status = statusOf(m?.status);
  const home = m?.score?.fullTime?.home;
  const away = m?.score?.fullTime?.away;
  const played = status !== "upcoming" && home != null && away != null;
  let note: string | undefined;
  if (status === "finished") note = m?.score?.winner ? "FT" : "FT";
  else if (status === "live") note = m?.minute ? `${m.minute}'` : "LIVE";
  return {
    id: String(m?.id ?? Math.random()),
    stage: prettyStage(m?.stage, m?.group),
    a: side(m?.homeTeam),
    b: side(m?.awayTeam),
    scoreA: played ? home : null,
    scoreB: played ? away : null,
    status,
    kickoff: m?.utcDate,
    note,
  };
}

/** Live first, then soonest upcoming, then most-recent finished. Cap at 14. */
function pickScores(matches: any[]): Match[] {
  const mapped = matches.map(toMatch);
  const rank = (s: MatchStatus) => (s === "live" ? 0 : s === "upcoming" ? 1 : 2);
  mapped.sort((a, b) => {
    const r = rank(a.status) - rank(b.status);
    if (r !== 0) return r;
    const ta = a.kickoff ? Date.parse(a.kickoff) : 0;
    const tb = b.kickoff ? Date.parse(b.kickoff) : 0;
    // Upcoming ascending (soonest first); finished descending (latest first).
    return a.status === "finished" ? tb - ta : ta - tb;
  });
  return mapped.slice(0, 14);
}

function seasonString(json: any): string {
  const start: string = json?.season?.startDate ?? "";
  const end: string = json?.season?.endDate ?? "";
  const sy = start.slice(0, 4);
  const ey = end.slice(0, 4);
  if (!sy) return "Season";
  if (sy === ey) return `${sy}`;
  return `${sy}/${ey.slice(2)}`;
}

function prevSeasonYear(json: any): number | null {
  const start: string = json?.season?.startDate ?? "";
  const y = parseInt(start.slice(0, 4), 10);
  if (!Number.isFinite(y) || y < 2000) return null;
  return y - 1;
}

function mapStandings(
  json: any,
): { kind: "league"; groups: StandingsGroup[] } | null {
  const standings: any[] = json?.standings ?? [];
  const totals = standings.filter((s) => s?.type === "TOTAL");
  if (totals.length === 0) return null;
  const groups: StandingsGroup[] = totals.map((s, i) => ({
    name: s?.group
      ? String(s.group).replace(/GROUP_/, "Group ").replace(/_/g, " ")
      : totals.length > 1
        ? `Group ${i + 1}`
        : "Standings",
    rows: (s?.table ?? []).map(
      (row: any): TableRow => ({
        team: side(row?.team),
        played: row?.playedGames ?? 0,
        win: row?.won ?? 0,
        draw: row?.draw ?? 0,
        loss: row?.lost ?? 0,
        for: row?.goalsFor ?? 0,
        against: row?.goalsAgainst ?? 0,
        points: row?.points ?? 0,
      }),
    ),
  }));
  return { kind: "league", groups };
}

const KO_ORDER: [string, string][] = [
  ["LAST_32", "Round of 32"],
  ["LAST_16", "Round of 16"],
  ["ROUND_OF_16", "Round of 16"],
  ["QUARTER_FINALS", "Quarter-finals"],
  ["SEMI_FINALS", "Semi-finals"],
  ["FINAL", "Final"],
];

function slot(team: any, score: any, otherScore: any): BracketSlot {
  const s: BracketSlot = { side: team ? side(team) : null };
  if (score != null) s.score = score;
  if (score != null && otherScore != null) s.winner = score > otherScore;
  return s;
}

function buildBracket(
  matches: any[],
): { label: string; rounds: BracketRound[] } | null {
  const rounds: BracketRound[] = [];
  const seen = new Set<string>();
  for (const [stageKey, label] of KO_ORDER) {
    if (seen.has(label)) continue;
    const inStage = matches.filter((m) => m?.stage === stageKey);
    if (inStage.length === 0) continue;
    seen.add(label);
    rounds.push({
      name: label,
      matches: inStage.map(
        (m): BracketMatch => {
          const h = m?.score?.fullTime?.home;
          const a = m?.score?.fullTime?.away;
          return {
            id: String(m?.id ?? Math.random()),
            top: slot(m?.homeTeam, h, a),
            bottom: slot(m?.awayTeam, a, h),
          };
        },
      ),
    });
  }
  return rounds.length ? { label: "Knockout", rounds } : null;
}
