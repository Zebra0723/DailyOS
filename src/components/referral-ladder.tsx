import { Check, Lock, Gift } from "lucide-react";
import { MILESTONES } from "@/lib/referral-rewards";
import { cn } from "@/lib/utils";

/** The referral prize ladder, showing which rungs are unlocked at the current
 *  converted-friend count. Each rung arrives as a unique single-use code. */
export function ReferralLadder({ converted }: { converted: number }) {
  const nextRung = MILESTONES.find((m) => converted < m.count);

  return (
    <div className="mt-6 border-t pt-5">
      <div className="flex items-center gap-2">
        <Gift className="size-4 text-primary" />
        <h3 className="text-sm font-medium">Referral rewards</h3>
        {nextRung && (
          <span className="ml-auto text-xs text-muted-foreground">
            {nextRung.count - converted} more to&nbsp;
            <span className="font-medium text-foreground">{nextRung.label}</span>
          </span>
        )}
      </div>

      <ul className="mt-3 space-y-2">
        {MILESTONES.map((m) => {
          const unlocked = converted >= m.count;
          return (
            <li
              key={m.count}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-3 py-2 text-sm",
                unlocked
                  ? "border-emerald-300 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10"
                  : "bg-card",
              )}
            >
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full text-xs font-semibold",
                  unlocked
                    ? "bg-emerald-500 text-white"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {unlocked ? <Check className="size-3.5" /> : m.count}
              </span>
              <span className="flex-1">
                <span className="font-medium">{m.count}</span>{" "}
                {m.count === 1 ? "friend" : "friends"} →{" "}
                <span
                  className={cn(
                    unlocked
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-foreground",
                  )}
                >
                  {m.label}
                </span>
              </span>
              {!unlocked && (
                <Lock className="size-3.5 shrink-0 text-muted-foreground" />
              )}
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">
        Each reward is emailed to you as your own one-time code. Codes work once.
      </p>
    </div>
  );
}
