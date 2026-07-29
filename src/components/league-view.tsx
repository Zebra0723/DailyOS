"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ScoresList, StandingsTables } from "@/components/tournament-view";
import { cn } from "@/lib/utils";
import type { Match, StandingsGroup } from "@/lib/tournament";

type Tab = "scores" | "table";

/** A live league page inside the Sports section: Scores and Table tabs, fed by
 *  the live sports pipeline. (Brackets belong to tournaments, not leagues.) */
export function LeagueView({
  name,
  subtitle,
  scores,
  groups,
}: {
  name: string;
  subtitle: string;
  scores: Match[];
  groups: StandingsGroup[];
}) {
  const [tab, setTab] = React.useState<Tab>("scores");

  return (
    <div className="max-w-2xl">
      <Link
        href="/sports"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All sports
      </Link>

      <PageHeader title={name} description={subtitle} />

      <div className="mb-5 inline-flex rounded-xl border bg-muted/40 p-1">
        {(
          [
            { key: "scores", label: "Scores" },
            { key: "table", label: "Table" },
          ] as { key: Tab; label: string }[]
        ).map((s) => (
          <button
            key={s.key}
            onClick={() => setTab(s.key)}
            className={cn(
              "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
              tab === s.key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {tab === "scores" && <ScoresList matches={scores} />}
      {tab === "table" && (
        <StandingsTables tables={{ kind: "league", groups }} />
      )}

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Live scores refresh automatically while matches are in play.
      </p>
    </div>
  );
}
