// The Sports catalog — everything the /sports section lists.
//
// Naming rule (house style): competition names NEVER carry their governing
// body — "Champions League", not "UEFA Champions League"; "World Cup", not
// "FIFA World Cup"; "EURO 2028", not "UEFA EURO 2028".
//
// Football covers the TOP TWO divisions of every major footballing country,
// plus the big continental/international competitions. Other sports list their
// major competitions. Each competition can carry:
//   • live    — a live-data binding (football-data.org code). With
//               FOOTBALL_DATA_TOKEN set, its detail page shows real scores
//               and standings.
//   • window  — the current edition's date range (hand-maintained). This is
//               what drives the "On now" and "Starting soon" rails.
// Windows are editable config, not a live feed — nudge them each season.

export type SportKey =
  | "football"
  | "cricket"
  | "tennis"
  | "rugby-union"
  | "rugby-league"
  | "f1"
  | "golf"
  | "basketball"
  | "american-football"
  | "cycling"
  | "athletics";

export type Competition = {
  /** Slug used in /sports/[id]. */
  id: string;
  /** Display name — no governing body. */
  name: string;
  sport: SportKey;
  /** Emoji shown with the competition (country flag or sport emoji). */
  emoji: string;
  /** 1 = top flight, 2 = second tier (football leagues). */
  tier?: 1 | 2;
  /** Live-data binding (football only for now). */
  live?: { provider: "football-data"; competition: string };
  /** Current edition's date window, YYYY-MM-DD inclusive. */
  window?: { start: string; end: string };
  /** Short context line, e.g. "New season starts mid-August". */
  note?: string;
};

export type FootballCountry = {
  name: string;
  flag: string;
  leagues: Competition[]; // [top flight, second tier]
};

export type SportSection = {
  key: SportKey;
  label: string;
  emoji: string;
  competitions: Competition[];
};

// European 2026-27 club season (approx window — refine as fixtures firm up).
const EU_SEASON = { start: "2026-08-08", end: "2027-05-30" };
const EU_NOTE = "2026-27 season starts mid-August";

// --- Football: top two divisions per major country ------------------------
export const FOOTBALL_COUNTRIES: FootballCountry[] = [
  {
    name: "England",
    flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    leagues: [
      { id: "premier-league", name: "Premier League", sport: "football", emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", tier: 1, live: { provider: "football-data", competition: "PL" }, window: EU_SEASON, note: EU_NOTE },
      { id: "championship", name: "Championship", sport: "football", emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", tier: 2, live: { provider: "football-data", competition: "ELC" }, window: { start: "2026-08-07", end: "2027-05-29" }, note: EU_NOTE },
    ],
  },
  {
    name: "Spain",
    flag: "🇪🇸",
    leagues: [
      { id: "la-liga", name: "La Liga", sport: "football", emoji: "🇪🇸", tier: 1, live: { provider: "football-data", competition: "PD" }, window: EU_SEASON, note: EU_NOTE },
      { id: "la-liga-2", name: "La Liga 2", sport: "football", emoji: "🇪🇸", tier: 2, window: EU_SEASON, note: EU_NOTE },
    ],
  },
  {
    name: "Italy",
    flag: "🇮🇹",
    leagues: [
      { id: "serie-a", name: "Serie A", sport: "football", emoji: "🇮🇹", tier: 1, live: { provider: "football-data", competition: "SA" }, window: EU_SEASON, note: EU_NOTE },
      { id: "serie-b", name: "Serie B", sport: "football", emoji: "🇮🇹", tier: 2, window: EU_SEASON, note: EU_NOTE },
    ],
  },
  {
    name: "Germany",
    flag: "🇩🇪",
    leagues: [
      { id: "bundesliga", name: "Bundesliga", sport: "football", emoji: "🇩🇪", tier: 1, live: { provider: "football-data", competition: "BL1" }, window: EU_SEASON, note: EU_NOTE },
      { id: "bundesliga-2", name: "2. Bundesliga", sport: "football", emoji: "🇩🇪", tier: 2, window: { start: "2026-07-31", end: "2027-05-23" }, note: "Season starts end of July" },
    ],
  },
  {
    name: "France",
    flag: "🇫🇷",
    leagues: [
      { id: "ligue-1", name: "Ligue 1", sport: "football", emoji: "🇫🇷", tier: 1, live: { provider: "football-data", competition: "FL1" }, window: EU_SEASON, note: EU_NOTE },
      { id: "ligue-2", name: "Ligue 2", sport: "football", emoji: "🇫🇷", tier: 2, window: EU_SEASON, note: EU_NOTE },
    ],
  },
  {
    name: "Netherlands",
    flag: "🇳🇱",
    leagues: [
      { id: "eredivisie", name: "Eredivisie", sport: "football", emoji: "🇳🇱", tier: 1, live: { provider: "football-data", competition: "DED" }, window: EU_SEASON, note: EU_NOTE },
      { id: "eerste-divisie", name: "Eerste Divisie", sport: "football", emoji: "🇳🇱", tier: 2, window: EU_SEASON, note: EU_NOTE },
    ],
  },
  {
    name: "Portugal",
    flag: "🇵🇹",
    leagues: [
      { id: "primeira-liga", name: "Primeira Liga", sport: "football", emoji: "🇵🇹", tier: 1, live: { provider: "football-data", competition: "PPL" }, window: EU_SEASON, note: EU_NOTE },
      { id: "liga-portugal-2", name: "Liga Portugal 2", sport: "football", emoji: "🇵🇹", tier: 2, window: EU_SEASON, note: EU_NOTE },
    ],
  },
  {
    name: "Belgium",
    flag: "🇧🇪",
    leagues: [
      { id: "belgian-pro-league", name: "Pro League", sport: "football", emoji: "🇧🇪", tier: 1, window: { start: "2026-07-25", end: "2027-05-30" }, note: "Season under way" },
      { id: "challenger-pro-league", name: "Challenger Pro League", sport: "football", emoji: "🇧🇪", tier: 2, window: { start: "2026-08-08", end: "2027-05-16" }, note: EU_NOTE },
    ],
  },
  {
    name: "Turkey",
    flag: "🇹🇷",
    leagues: [
      { id: "super-lig", name: "Süper Lig", sport: "football", emoji: "🇹🇷", tier: 1, window: EU_SEASON, note: EU_NOTE },
      { id: "1-lig", name: "1. Lig", sport: "football", emoji: "🇹🇷", tier: 2, window: EU_SEASON, note: EU_NOTE },
    ],
  },
  {
    name: "Brazil",
    flag: "🇧🇷",
    leagues: [
      { id: "brasileirao", name: "Série A", sport: "football", emoji: "🇧🇷", tier: 1, live: { provider: "football-data", competition: "BSA" }, window: { start: "2026-03-28", end: "2026-12-06" }, note: "Season runs March–December" },
      { id: "brasileirao-b", name: "Série B", sport: "football", emoji: "🇧🇷", tier: 2, window: { start: "2026-04-03", end: "2026-11-28" }, note: "Season runs April–November" },
    ],
  },
  {
    name: "Argentina",
    flag: "🇦🇷",
    leagues: [
      { id: "primera-division-arg", name: "Primera División", sport: "football", emoji: "🇦🇷", tier: 1, window: { start: "2026-01-23", end: "2026-11-15" }, note: "Season runs January–November" },
      { id: "primera-nacional", name: "Primera Nacional", sport: "football", emoji: "🇦🇷", tier: 2, window: { start: "2026-02-06", end: "2026-11-08" }, note: "Season runs February–November" },
    ],
  },
  {
    name: "United States",
    flag: "🇺🇸",
    leagues: [
      { id: "mls", name: "MLS", sport: "football", emoji: "🇺🇸", tier: 1, window: { start: "2026-02-21", end: "2026-12-05" }, note: "Season runs February–December" },
      { id: "usl-championship", name: "USL Championship", sport: "football", emoji: "🇺🇸", tier: 2, window: { start: "2026-03-07", end: "2026-11-15" }, note: "Season runs March–November" },
    ],
  },
  {
    name: "Mexico",
    flag: "🇲🇽",
    leagues: [
      { id: "liga-mx", name: "Liga MX", sport: "football", emoji: "🇲🇽", tier: 1, window: { start: "2026-07-17", end: "2026-12-13" }, note: "Apertura under way" },
      { id: "liga-expansion", name: "Liga de Expansión", sport: "football", emoji: "🇲🇽", tier: 2, window: { start: "2026-07-24", end: "2026-12-06" }, note: "Apertura under way" },
    ],
  },
  {
    name: "Saudi Arabia",
    flag: "🇸🇦",
    leagues: [
      { id: "saudi-pro-league", name: "Pro League", sport: "football", emoji: "🇸🇦", tier: 1, window: { start: "2026-08-20", end: "2027-05-27" }, note: "Season starts late August" },
      { id: "saudi-first-division", name: "First Division", sport: "football", emoji: "🇸🇦", tier: 2, window: { start: "2026-08-25", end: "2027-05-20" }, note: "Season starts late August" },
    ],
  },
];

// Football: continental & international competitions.
export const FOOTBALL_INTERNATIONAL: Competition[] = [
  { id: "champions-league", name: "Champions League", sport: "football", emoji: "⚽", live: { provider: "football-data", competition: "CL" }, window: { start: "2026-09-15", end: "2027-06-05" }, note: "New campaign starts September" },
  { id: "europa-league", name: "Europa League", sport: "football", emoji: "⚽", window: { start: "2026-09-16", end: "2027-05-26" }, note: "New campaign starts September" },
  { id: "copa-libertadores", name: "Copa Libertadores", sport: "football", emoji: "⚽", window: { start: "2026-02-03", end: "2026-11-28" }, note: "Knockout rounds through November" },
  { id: "world-cup", name: "World Cup", sport: "football", emoji: "🏆", window: { start: "2026-06-11", end: "2026-07-19" }, note: "The 2026 edition has just finished" },
];

// --- Other sports ---------------------------------------------------------
export const SPORT_SECTIONS: SportSection[] = [
  {
    key: "cricket",
    label: "Cricket",
    emoji: "🏏",
    competitions: [
      { id: "the-hundred", name: "The Hundred", sport: "cricket", emoji: "🏏", window: { start: "2026-08-04", end: "2026-09-01" } },
      { id: "the-ashes", name: "The Ashes", sport: "cricket", emoji: "🏏", window: { start: "2026-11-21", end: "2027-01-08" }, note: "In Australia this winter" },
      { id: "ipl", name: "IPL", sport: "cricket", emoji: "🏏", window: { start: "2027-03-20", end: "2027-05-30" }, note: "Back next March" },
      { id: "big-bash", name: "Big Bash", sport: "cricket", emoji: "🏏", window: { start: "2026-12-10", end: "2027-01-25" } },
      { id: "t20-world-cup", name: "T20 World Cup", sport: "cricket", emoji: "🏆", window: { start: "2028-02-01", end: "2028-03-05" }, note: "Next edition 2028" },
    ],
  },
  {
    key: "tennis",
    label: "Tennis",
    emoji: "🎾",
    competitions: [
      { id: "us-open-tennis", name: "US Open", sport: "tennis", emoji: "🎾", window: { start: "2026-08-31", end: "2026-09-13" } },
      { id: "australian-open", name: "Australian Open", sport: "tennis", emoji: "🎾", window: { start: "2027-01-18", end: "2027-01-31" } },
      { id: "french-open", name: "French Open", sport: "tennis", emoji: "🎾", window: { start: "2027-05-23", end: "2027-06-06" } },
      { id: "wimbledon", name: "Wimbledon", sport: "tennis", emoji: "🎾", window: { start: "2026-06-29", end: "2026-07-12" }, note: "The 2026 edition has just finished" },
      { id: "atp-finals", name: "ATP Finals", sport: "tennis", emoji: "🎾", window: { start: "2026-11-15", end: "2026-11-22" } },
    ],
  },
  {
    key: "rugby-union",
    label: "Rugby Union",
    emoji: "🏉",
    competitions: [
      { id: "rugby-championship", name: "Rugby Championship", sport: "rugby-union", emoji: "🏉", window: { start: "2026-08-08", end: "2026-10-03" }, note: "Starts early August" },
      { id: "six-nations", name: "Six Nations", sport: "rugby-union", emoji: "🏉", window: { start: "2027-02-06", end: "2027-03-20" } },
      { id: "premiership-rugby", name: "Premiership", sport: "rugby-union", emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", window: { start: "2026-09-25", end: "2027-06-12" } },
      { id: "top-14", name: "Top 14", sport: "rugby-union", emoji: "🇫🇷", window: { start: "2026-09-05", end: "2027-06-26" } },
      { id: "urc", name: "United Rugby Championship", sport: "rugby-union", emoji: "🏉", window: { start: "2026-09-26", end: "2027-06-19" } },
    ],
  },
  {
    key: "rugby-league",
    label: "Rugby League",
    emoji: "🏉",
    competitions: [
      { id: "super-league", name: "Super League", sport: "rugby-league", emoji: "🏉", window: { start: "2026-02-12", end: "2026-10-10" } },
      { id: "nrl", name: "NRL", sport: "rugby-league", emoji: "🇦🇺", window: { start: "2026-03-05", end: "2026-10-04" } },
      { id: "state-of-origin", name: "State of Origin", sport: "rugby-league", emoji: "🇦🇺", window: { start: "2026-06-03", end: "2026-07-15" }, note: "The 2026 series has finished" },
    ],
  },
  {
    key: "f1",
    label: "Formula 1",
    emoji: "🏎️",
    competitions: [
      { id: "f1-world-championship", name: "F1 World Championship", sport: "f1", emoji: "🏎️", window: { start: "2026-03-08", end: "2026-12-06" }, note: "Race weekends most fortnights" },
    ],
  },
  {
    key: "golf",
    label: "Golf",
    emoji: "⛳",
    competitions: [
      { id: "the-masters", name: "The Masters", sport: "golf", emoji: "⛳", window: { start: "2027-04-08", end: "2027-04-11" } },
      { id: "pga-championship", name: "PGA Championship", sport: "golf", emoji: "⛳", window: { start: "2027-05-20", end: "2027-05-23" } },
      { id: "us-open-golf", name: "US Open", sport: "golf", emoji: "⛳", window: { start: "2027-06-17", end: "2027-06-20" } },
      { id: "the-open", name: "The Open", sport: "golf", emoji: "⛳", window: { start: "2026-07-16", end: "2026-07-19" }, note: "The 2026 edition has just finished" },
    ],
  },
  {
    key: "basketball",
    label: "Basketball",
    emoji: "🏀",
    competitions: [
      { id: "nba", name: "NBA", sport: "basketball", emoji: "🏀", window: { start: "2026-10-20", end: "2027-06-20" } },
      { id: "euroleague", name: "EuroLeague", sport: "basketball", emoji: "🏀", window: { start: "2026-10-01", end: "2027-05-30" } },
    ],
  },
  {
    key: "american-football",
    label: "American Football",
    emoji: "🏈",
    competitions: [
      { id: "nfl", name: "NFL", sport: "american-football", emoji: "🏈", window: { start: "2026-09-10", end: "2027-02-14" }, note: "Season kicks off in September" },
    ],
  },
  {
    key: "cycling",
    label: "Cycling",
    emoji: "🚴",
    competitions: [
      { id: "tour-de-france-femmes", name: "Tour de France Femmes", sport: "cycling", emoji: "🚴", window: { start: "2026-08-01", end: "2026-08-09" }, note: "Starts this weekend" },
      { id: "vuelta", name: "Vuelta a España", sport: "cycling", emoji: "🇪🇸", window: { start: "2026-08-22", end: "2026-09-13" } },
      { id: "tour-de-france", name: "Tour de France", sport: "cycling", emoji: "🚴", window: { start: "2026-07-04", end: "2026-07-26" }, note: "The 2026 edition has just finished" },
      { id: "giro", name: "Giro d'Italia", sport: "cycling", emoji: "🇮🇹", window: { start: "2027-05-08", end: "2027-05-30" } },
    ],
  },
  {
    key: "athletics",
    label: "Athletics",
    emoji: "🏃",
    competitions: [
      { id: "european-athletics", name: "European Championships", sport: "athletics", emoji: "🏃", window: { start: "2026-08-10", end: "2026-08-16" }, note: "Birmingham, mid-August" },
      { id: "world-athletics", name: "World Championships", sport: "athletics", emoji: "🏆", window: { start: "2027-08-14", end: "2027-08-22" } },
    ],
  },
];

// --- Lookups & "on now" ----------------------------------------------------

/** Every competition in the catalog, flattened. */
export function allCompetitions(): Competition[] {
  return [
    ...FOOTBALL_COUNTRIES.flatMap((c) => c.leagues),
    ...FOOTBALL_INTERNATIONAL,
    ...SPORT_SECTIONS.flatMap((s) => s.competitions),
  ];
}

export function findCompetition(id: string): Competition | null {
  return allCompetitions().find((c) => c.id === id) ?? null;
}

function todayYmd(now: Date): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}`;
}

/** Competitions whose window contains today. */
export function competitionsOnNow(now: Date = new Date()): Competition[] {
  const ymd = todayYmd(now);
  return allCompetitions().filter(
    (c) => c.window && ymd >= c.window.start && ymd <= c.window.end,
  );
}

/** Competitions starting within the next `days` days (default 21). */
export function competitionsStartingSoon(
  now: Date = new Date(),
  days = 21,
): Competition[] {
  const ymd = todayYmd(now);
  const horizon = new Date(now.getTime() + days * 86_400_000);
  const hYmd = todayYmd(horizon);
  return allCompetitions()
    .filter((c) => c.window && c.window.start > ymd && c.window.start <= hYmd)
    .sort((a, b) => (a.window!.start < b.window!.start ? -1 : 1));
}
