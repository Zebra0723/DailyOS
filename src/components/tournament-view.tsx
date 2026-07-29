"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Trophy, Medal } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  medalTotal,
  type Tournament,
  type Match,
  type Side,
  type BracketSlot,
} from "@/lib/tournament";

type Tab = "scores" | "bracket" | "tables";

export function TournamentView({
  tournament: t,
  live = false,
}: {
  tournament: Tournament;
  live?: boolean;
}) {
  const [tab, setTab] = React.useState<Tab>("scores");

  const window = `${fmtDate(t.start)} – ${fmtDate(t.end)}`;

  return (
    <div className="max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/today"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to Today
        </Link>
        <Link
          href="/sports"
          className="text-sm font-medium text-primary hover:underline"
        >
          All sports →
        </Link>
      </div>

      <PageHeader
        title={t.name}
        description={`${t.sport} · ${t.host} · ${window}`}
      />

      {/* Tabs */}
      <div className="mb-5 inline-flex rounded-xl border bg-muted/40 p-1">
        {(
          [
            { key: "scores", label: "Scores" },
            { key: "bracket", label: "Bracket" },
            { key: "tables", label: "Tables" },
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

      {tab === "scores" && <ScoresList matches={t.scores} />}
      {tab === "bracket" && <Bracket bracket={t.bracket} />}
      {tab === "tables" && <StandingsTables tables={t.tables} />}

      <p className="mt-6 text-center text-xs text-muted-foreground">
        {live
          ? "Live scores refresh automatically while matches are in play."
          : "Results are updated periodically — not a live feed."}
      </p>
    </div>
  );
}

// --- Scores ---------------------------------------------------------------
// Exported so the Sports section's league pages reuse the same renderers.
export function ScoresList({ matches }: { matches: Match[] }) {
  if (matches.length === 0) {
    return <Empty label="No fixtures listed yet." />;
  }
  return (
    <div className="space-y-3">
      {matches.map((m) => (
        <Card key={m.id} className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {m.stage}
            </p>
            <StatusPill match={m} />
          </div>
          <ScoreLine match={m} />
        </Card>
      ))}
    </div>
  );
}

/** The flag-vs-flag scoreline: 🇮🇹 Italy  1 – 2  Palestine 🇵🇸 */
function ScoreLine({ match: m }: { match: Match }) {
  const played = m.status !== "upcoming" && m.scoreA != null && m.scoreB != null;
  const aWon = played && (m.scoreA as number) > (m.scoreB as number);
  const bWon = played && (m.scoreB as number) > (m.scoreA as number);
  return (
    <div className="flex items-center gap-3">
      <TeamName side={m.a} align="right" dim={bWon} />
      <div className="flex shrink-0 items-center gap-2 tabular-nums">
        <span className="text-2xl leading-none">{m.a.flag}</span>
        <span
          className={cn(
            "min-w-14 text-center text-xl font-bold",
            m.status === "live" && "text-primary",
          )}
        >
          {played ? `${m.scoreA} – ${m.scoreB}` : "v"}
        </span>
        <span className="text-2xl leading-none">{m.b.flag}</span>
      </div>
      <TeamName side={m.b} align="left" dim={aWon} />
    </div>
  );
}

function TeamName({
  side,
  align,
  dim,
}: {
  side: Side;
  align: "left" | "right";
  dim?: boolean;
}) {
  return (
    <div
      className={cn(
        "min-w-0 flex-1",
        align === "right" ? "text-right" : "text-left",
      )}
    >
      <p
        className={cn(
          "truncate font-semibold",
          dim && "font-medium text-muted-foreground",
        )}
      >
        {side.name}
      </p>
    </div>
  );
}

function StatusPill({ match: m }: { match: Match }) {
  if (m.status === "live") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
        <span className="relative flex size-1.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60" />
          <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
        </span>
        LIVE{m.note ? ` · ${m.note}` : ""}
      </span>
    );
  }
  if (m.status === "finished") {
    return (
      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
        {m.note ?? "Full time"}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
      {m.kickoff ? fmtTime(m.kickoff) : "Upcoming"}
    </span>
  );
}

// --- Bracket --------------------------------------------------------------
function Bracket({ bracket }: { bracket: Tournament["bracket"] }) {
  return (
    <div>
      <p className="mb-3 text-sm font-medium text-muted-foreground">
        {bracket.label} knockout
      </p>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {bracket.rounds.map((round) => (
          <div key={round.name} className="min-w-52 flex-1 shrink-0">
            <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {round.name}
            </p>
            <div className="flex h-full flex-col justify-around gap-3">
              {round.matches.map((bm) => (
                <Card key={bm.id} className="divide-y p-0">
                  <BracketSlotRow slot={bm.top} />
                  <BracketSlotRow slot={bm.bottom} />
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BracketSlotRow({ slot }: { slot: BracketSlot }) {
  const s = slot.side;
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2",
        slot.winner ? "font-semibold" : "text-muted-foreground",
      )}
    >
      <span className="text-lg leading-none">{s?.flag ?? "⬜"}</span>
      <span className="min-w-0 flex-1 truncate text-sm">
        {s?.name ?? "TBD"}
      </span>
      {slot.score != null && (
        <span className="tabular-nums text-sm font-semibold">{slot.score}</span>
      )}
    </div>
  );
}

// --- Tables ---------------------------------------------------------------
export function StandingsTables({ tables }: { tables: Tournament["tables"] }) {
  if (tables.kind === "medals") {
    const rows = [...tables.rows].sort(
      (a, b) =>
        b.gold - a.gold ||
        b.silver - a.silver ||
        b.bronze - a.bronze ||
        medalTotal(b) - medalTotal(a),
    );
    return (
      <Card className="overflow-hidden p-0">
        <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2.5 text-sm font-semibold">
          <Medal className="size-4 text-primary" /> Medal table
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2 text-left font-medium">Nation</th>
                <th className="px-2 py-2 text-center font-medium">🥇</th>
                <th className="px-2 py-2 text-center font-medium">🥈</th>
                <th className="px-2 py-2 text-center font-medium">🥉</th>
                <th className="px-4 py-2 text-center font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.team.name} className="border-b last:border-0">
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-2">
                      <span className="w-4 text-right text-xs tabular-nums text-muted-foreground">
                        {i + 1}
                      </span>
                      <span className="text-lg leading-none">{r.team.flag}</span>
                      <span className="font-medium">{r.team.name}</span>
                    </span>
                  </td>
                  <td className="px-2 py-2.5 text-center tabular-nums">{r.gold}</td>
                  <td className="px-2 py-2.5 text-center tabular-nums">{r.silver}</td>
                  <td className="px-2 py-2.5 text-center tabular-nums">{r.bronze}</td>
                  <td className="px-4 py-2.5 text-center font-semibold tabular-nums">
                    {medalTotal(r)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    );
  }

  // League standings.
  return (
    <div className="space-y-5">
      {tables.groups.map((g) => (
        <Card key={g.name} className="overflow-hidden p-0">
          <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2.5 text-sm font-semibold">
            <Trophy className="size-4 text-primary" /> {g.name}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2 text-left font-medium">Team</th>
                  <th className="px-2 py-2 text-center font-medium">P</th>
                  <th className="px-2 py-2 text-center font-medium">W</th>
                  <th className="px-2 py-2 text-center font-medium">D</th>
                  <th className="px-2 py-2 text-center font-medium">L</th>
                  <th className="px-2 py-2 text-center font-medium">+/-</th>
                  <th className="px-4 py-2 text-center font-medium">Pts</th>
                </tr>
              </thead>
              <tbody>
                {g.rows.map((r, i) => (
                  <tr key={r.team.name} className="border-b last:border-0">
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-2">
                        <span className="w-4 text-right text-xs tabular-nums text-muted-foreground">
                          {i + 1}
                        </span>
                        <span className="text-lg leading-none">{r.team.flag}</span>
                        <span className="font-medium">{r.team.name}</span>
                      </span>
                    </td>
                    <td className="px-2 py-2.5 text-center tabular-nums">{r.played}</td>
                    <td className="px-2 py-2.5 text-center tabular-nums">{r.win}</td>
                    <td className="px-2 py-2.5 text-center tabular-nums">{r.draw}</td>
                    <td className="px-2 py-2.5 text-center tabular-nums">{r.loss}</td>
                    <td className="px-2 py-2.5 text-center tabular-nums">
                      {r.for - r.against > 0 ? "+" : ""}
                      {r.for - r.against}
                    </td>
                    <td className="px-4 py-2.5 text-center font-semibold tabular-nums">
                      {r.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ))}
    </div>
  );
}

// --- helpers --------------------------------------------------------------
function Empty({ label }: { label: string }) {
  return (
    <Card className="p-8 text-center text-sm text-muted-foreground">{label}</Card>
  );
}

function fmtDate(ymd: string) {
  return new Date(`${ymd}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
