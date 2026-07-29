import "server-only";
import {
  getActiveTournament,
  type Tournament,
} from "@/lib/tournament";
import { fetchFootballData } from "@/lib/sports/football-data";

/**
 * Resolve a tournament's data, overlaying live scores/tables/bracket from the
 * bound provider when a key is set. Any failure (no key, rate limit, bad
 * response) falls back cleanly to the static, hand-maintained config.
 */
export async function resolveTournament(t: Tournament): Promise<Tournament> {
  if (!t.live) return t;

  if (t.live.provider === "football-data") {
    const live = await fetchFootballData(t.live.competition);
    if (!live) return t; // no key / error → static fallback
    return {
      ...t,
      scores: live.scores.length ? live.scores : t.scores,
      tables: live.tables ?? t.tables,
      bracket: live.bracket ?? t.bracket,
    };
  }

  return t;
}

/** The active tournament (by date window) with live data overlaid, or null. */
export async function loadActiveTournament(
  now?: Date,
): Promise<Tournament | null> {
  const t = getActiveTournament(now);
  if (!t) return null;
  return resolveTournament(t);
}
