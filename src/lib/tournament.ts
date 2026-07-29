// Major-tournament feature.
//
// When a big sports tournament is on, Today shows a banner linking to a dedicated
// hub with three tabs: Scores, Bracket and Tables. The tournament's NAME is shown
// in capitals WITHOUT its governing body — "COMMONWEALTH GAMES 2026", not
// "CGF Commonwealth Games". The banner (and the page) only appear while the
// tournament is inside its own date window; outside it, everything auto-hides.
//
// There is no live sports feed wired up, so the data below is maintained by hand.
// To feature a different tournament: add a new Tournament object to TOURNAMENTS
// with its start/end dates, and update its scores/bracket/tables. Whichever entry
// contains today's date becomes the active one.

export type Side = {
  name: string;
  /** Emoji flag, e.g. "🇮🇹". Renders the flag-vs-flag scoreline. */
  flag: string;
  /** 3-letter code for compact rows, e.g. "ITA". */
  short?: string;
  /** Club crest URL from the live feed (only present for club competitions). */
  crest?: string;
};

export type MatchStatus = "live" | "upcoming" | "finished";

export type Match = {
  id: string;
  /** e.g. "Netball · Final", "Hockey · Semi-final". */
  stage: string;
  a: Side;
  b: Side;
  scoreA?: number | null;
  scoreB?: number | null;
  status: MatchStatus;
  /** ISO datetime — used to show the start time for upcoming matches. */
  kickoff?: string;
  /** Small annotation, e.g. "FT", "AET", "Q3". */
  note?: string;
};

export type BracketSlot = {
  side?: Side | null; // null / undefined = TBD
  score?: number | null;
  winner?: boolean;
};

export type BracketMatch = {
  id: string;
  top: BracketSlot;
  bottom: BracketSlot;
};

export type BracketRound = {
  name: string; // "Quarter-finals", "Semi-finals", "Final"
  matches: BracketMatch[];
};

export type TableRow = {
  team: Side;
  played: number;
  win: number;
  draw: number;
  loss: number;
  /** Points/goals for. */
  for: number;
  /** Points/goals against. */
  against: number;
  points: number;
};

export type StandingsGroup = {
  name: string; // "Group A"
  rows: TableRow[];
};

export type MedalRow = {
  team: Side;
  gold: number;
  silver: number;
  bronze: number;
};

export type Tournament = {
  id: string;
  /** CAPS, no governing body. Shown on the Today banner and page header. */
  name: string;
  /** Headline sport, or "Multi-sport". */
  sport: string;
  host: string;
  /** Inclusive date window (YYYY-MM-DD). Controls when the feature shows. */
  start: string;
  end: string;
  /**
   * Optional live-data binding. When set AND the provider's API key is present,
   * scores/tables/bracket are pulled live and overlaid on the static data below
   * (which then acts as the offline/no-key fallback). Omit for a manual, hand-
   * maintained tournament (e.g. multi-sport events with no free live feed).
   *   provider "football-data" → competition is a football-data.org code:
   *     "WC" World Cup · "EC" Euros · "CL" Champions League · "PL" Premier League
   */
  live?: { provider: "football-data"; competition: string };
  scores: Match[];
  bracket: {
    /** The knockout this bracket represents, e.g. "Netball". */
    label: string;
    rounds: BracketRound[];
  };
  /** Tables tab: a league-style standings set, or a medal table. */
  tables:
    | { kind: "league"; groups: StandingsGroup[] }
    | { kind: "medals"; rows: MedalRow[] };
};

// --- Flags ----------------------------------------------------------------
const AUS: Side = { name: "Australia", flag: "🇦🇺", short: "AUS" };
const NZL: Side = { name: "New Zealand", flag: "🇳🇿", short: "NZL" };
const IND: Side = { name: "India", flag: "🇮🇳", short: "IND" };
const RSA: Side = { name: "South Africa", flag: "🇿🇦", short: "RSA" };
const CAN: Side = { name: "Canada", flag: "🇨🇦", short: "CAN" };
const FIJ: Side = { name: "Fiji", flag: "🇫🇯", short: "FIJ" };
const JAM: Side = { name: "Jamaica", flag: "🇯🇲", short: "JAM" };
const KEN: Side = { name: "Kenya", flag: "🇰🇪", short: "KEN" };
const NGA: Side = { name: "Nigeria", flag: "🇳🇬", short: "NGA" };
const UGA: Side = { name: "Uganda", flag: "🇺🇬", short: "UGA" };
const SCO: Side = { name: "Scotland", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", short: "SCO" };
const ENG: Side = { name: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", short: "ENG" };
const WAL: Side = { name: "Wales", flag: "🏴󠁧󠁢󠁷󠁬󠁳󠁿", short: "WAL" };

// --- The tournament roster ------------------------------------------------
// Add future tournaments here; the one whose window contains today wins.
export const TOURNAMENTS: Tournament[] = [
  {
    id: "commonwealth-2026",
    name: "COMMONWEALTH GAMES 2026",
    sport: "Multi-sport",
    host: "Glasgow",
    start: "2026-07-23",
    end: "2026-08-02",
    scores: [
      {
        id: "cwg-net-final",
        stage: "Netball · Final",
        a: AUS,
        b: NZL,
        scoreA: 55,
        scoreB: 52,
        status: "live",
        note: "Q4",
      },
      {
        id: "cwg-rugby7-final",
        stage: "Rugby Sevens · Final",
        a: FIJ,
        b: RSA,
        scoreA: 24,
        scoreB: 19,
        status: "finished",
        note: "FT",
      },
      {
        id: "cwg-hockey-sf",
        stage: "Hockey · Semi-final",
        a: IND,
        b: AUS,
        scoreA: 2,
        scoreB: 3,
        status: "finished",
        note: "FT",
      },
      {
        id: "cwg-cricket-final",
        stage: "T20 Cricket · Final",
        a: ENG,
        b: IND,
        scoreA: null,
        scoreB: null,
        status: "upcoming",
        kickoff: "2026-07-30T13:00:00Z",
      },
      {
        id: "cwg-net-3rd",
        stage: "Netball · Bronze",
        a: JAM,
        b: ENG,
        scoreA: 61,
        scoreB: 58,
        status: "finished",
        note: "FT",
      },
    ],
    bracket: {
      label: "Netball",
      rounds: [
        {
          name: "Quarter-finals",
          matches: [
            {
              id: "qf1",
              top: { side: AUS, score: 70, winner: true },
              bottom: { side: WAL, score: 41 },
            },
            {
              id: "qf2",
              top: { side: JAM, score: 62, winner: true },
              bottom: { side: RSA, score: 55 },
            },
            {
              id: "qf3",
              top: { side: NZL, score: 66, winner: true },
              bottom: { side: ENG, score: 60 },
            },
            {
              id: "qf4",
              top: { side: SCO, score: 48 },
              bottom: { side: UGA, score: 57, winner: true },
            },
          ],
        },
        {
          name: "Semi-finals",
          matches: [
            {
              id: "sf1",
              top: { side: AUS, score: 64, winner: true },
              bottom: { side: JAM, score: 59 },
            },
            {
              id: "sf2",
              top: { side: NZL, score: 58, winner: true },
              bottom: { side: UGA, score: 45 },
            },
          ],
        },
        {
          name: "Final",
          matches: [
            {
              id: "final",
              top: { side: AUS, score: 55 },
              bottom: { side: NZL, score: 52 },
            },
          ],
        },
      ],
    },
    tables: {
      kind: "medals",
      rows: [
        { team: AUS, gold: 41, silver: 33, bronze: 28 },
        { team: ENG, gold: 30, silver: 27, bronze: 31 },
        { team: CAN, gold: 18, silver: 20, bronze: 22 },
        { team: IND, gold: 16, silver: 14, bronze: 12 },
        { team: NZL, gold: 14, silver: 12, bronze: 17 },
        { team: SCO, gold: 12, silver: 15, bronze: 19 },
        { team: RSA, gold: 9, silver: 8, bronze: 11 },
        { team: NGA, gold: 6, silver: 5, bronze: 7 },
        { team: KEN, gold: 5, silver: 4, bronze: 6 },
      ],
    },
  },
];

/** The tournament whose date window contains `now` (YYYY-MM-DD compare), or null. */
export function getActiveTournament(now: Date = new Date()): Tournament | null {
  const ymd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}`;
  return (
    TOURNAMENTS.find((t) => ymd >= t.start && ymd <= t.end) ?? null
  );
}

/** Total medals for sorting the medal table (gold first, then silver, bronze). */
export function medalTotal(r: MedalRow): number {
  return r.gold + r.silver + r.bronze;
}
