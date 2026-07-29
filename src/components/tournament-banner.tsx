import Link from "next/link";
import { Trophy, ArrowRight } from "lucide-react";
import { getActiveTournament } from "@/lib/tournament";

/** Today banner for a live major tournament. Shows the tournament NAME in caps
 *  (no governing body) with a "SEE SCORES & BRACKET" call to action, linking to
 *  the tournament hub. Renders nothing when no tournament is currently on. */
export function TournamentBanner({ now }: { now?: Date }) {
  const t = getActiveTournament(now);
  if (!t) return null;

  // Count anything in play right now for a live nudge.
  const liveCount = t.scores.filter((m) => m.status === "live").length;

  return (
    <Link href="/tournament" className="block">
      <div className="group relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-accent/40 to-background p-4 shadow-card transition-colors hover:border-primary/50">
        <div className="flex items-center gap-4">
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Trophy className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold tracking-tight sm:text-base">
              {t.name} — SEE SCORES &amp; BRACKET
            </p>
            <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
              {liveCount > 0 ? (
                <span className="inline-flex items-center gap-1.5 font-medium text-primary">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60" />
                    <span className="relative inline-flex size-2 rounded-full bg-primary" />
                  </span>
                  {liveCount} live now
                </span>
              ) : (
                <span>{t.host} · scores, bracket &amp; tables</span>
              )}
            </p>
          </div>
          <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
}
