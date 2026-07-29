"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ScoresList, StandingsTables } from "@/components/tournament-view";
import { cn } from "@/lib/utils";
import type { Match, StandingsGroup } from "@/lib/tournament";

type Tab = "scores" | "table";

export function LeagueView({
  name,
  subtitle,
  scores,
  groups,
  seasonLabel = "This season",
  prevGroups = [],
  prevSeasonLabel = "Last season",
}: {
  name: string;
  subtitle: string;
  scores: Match[];
  groups: StandingsGroup[];
  seasonLabel?: string;
  prevGroups?: StandingsGroup[];
  prevSeasonLabel?: string;
}) {
  const [tab, setTab] = React.useState<Tab>("scores");
  const [season, setSeason] = React.useState<"current" | "prev">("current");
  const hasPrev = prevGroups.length > 0;

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
        <div>
          {hasPrev && (
            <div className="mb-4 inline-flex rounded-lg border bg-muted/40 p-0.5">
              <button
                onClick={() => setSeason("current")}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                  season === "current"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {seasonLabel}
              </button>
              <button
                onClick={() => setSeason("prev")}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                  season === "prev"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {prevSeasonLabel}
              </button>
            </div>
          )}
          <StandingsTables
            tables={{
              kind: "league",
              groups: season === "prev" && hasPrev ? prevGroups : groups,
            }}
          />
        </div>
      )}

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Live scores refresh automatically while matches are in play.
      </p>
    </div>
  );
}
