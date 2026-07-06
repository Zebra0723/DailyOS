import type { Tier } from "./use-pro";

export type Grant = { tier: Tier; exp: number | null }; // exp: ms deadline, null = lifetime/none

const rank = (t: Tier) => (t === "pro" ? 2 : t === "plus" ? 1 : 0);

/**
 * Merge a plan reward with the account's current plan so access never gets
 * worse: never lower the tier, never shorten the window, and lifetime always
 * beats a time-limited grant of the same tier. `exp` is a ms deadline (null =
 * lifetime). A free current plan has no expiry to preserve.
 */
export function mergeGrant(cur: Grant, next: Grant): Grant {
  const curTier = cur.tier;
  const curExp = curTier === "free" ? null : cur.exp;
  const nTier = next.tier;
  const nExp = next.exp;

  const finalTier: Tier = rank(nTier) >= rank(curTier) ? nTier : curTier;
  let finalExp: number | null;
  if (rank(nTier) === rank(curTier)) {
    // same tier — keep the more generous window (lifetime wins)
    finalExp = curExp === null || nExp === null ? null : Math.max(curExp, nExp);
  } else if (rank(nTier) > rank(curTier)) {
    finalExp = nExp; // upgrading to the reward's higher tier
  } else {
    finalExp = curExp; // keeping the current, higher tier — don't shorten it
  }
  return { tier: finalTier, exp: finalExp };
}
