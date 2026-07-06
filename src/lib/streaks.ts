// Wellbeing streaks, read straight from the same per-day localStorage the
// mindfulness / mood / nudges features already write. A streak is the run of
// consecutive days completed up to today — today may still be pending without
// breaking it (it only breaks once a past day is missed).

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function ymd(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Count consecutive completed days ending today, per a done-predicate. */
export function currentStreak(
  prefix: string,
  isDone: (raw: string | null) => boolean,
): number {
  if (typeof window === "undefined") return 0;
  let streak = 0;
  for (let i = 0; i < 400; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const raw = localStorage.getItem(prefix + ymd(d));
    if (isDone(raw)) {
      streak++;
    } else if (i === 0) {
      // Today isn't done yet — don't break a streak that's still alive.
      continue;
    } else {
      break;
    }
  }
  return streak;
}

export const mindfulStreak = () =>
  currentStreak("dailyos-mindful-", (raw) => raw === "1");

export const moodStreak = () =>
  currentStreak("dailyos-mood-", (raw) => raw != null);

export const nudgesStreak = () =>
  currentStreak("dailyos-nudges-", (raw) => {
    if (!raw) return false;
    try {
      const arr = JSON.parse(raw) as boolean[];
      return Array.isArray(arr) && arr.length > 0 && arr.every(Boolean);
    } catch {
      return false;
    }
  });
