import Link from "next/link";
import { ChevronRight, Trophy, Radio } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { getActiveTournament } from "@/lib/tournament";
import {
  allCompetitions,
  type Competition,
} from "@/lib/sports/catalog";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sports · DailyOS" };

const MAJOR_IDS = new Set([
  "premier-league",
  "la-liga",
  "serie-a",
  "bundesliga",
  "ligue-1",
  "champions-league",
  "europa-league",
  "world-cup",
  "copa-libertadores",
  "brasileirao",
  "mls",
  "the-ashes",
  "ipl",
  "t20-world-cup",
  "the-hundred",
  "wimbledon",
  "us-open-tennis",
  "australian-open",
  "french-open",
  "six-nations",
  "rugby-championship",
  "f1-world-championship",
  "nfl",
  "nba",
  "tour-de-france",
  "world-athletics",
]);

function fmtDate(ymd: string) {
  return new Date(`${ymd}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function statusLabel(c: Competition, ymd: string): "on" | "soon" | "off" {
  if (!c.window) return "off";
  if (ymd >= c.window.start && ymd <= c.window.end) return "on";
  const start = Date.parse(`${c.window.start}T00:00:00`);
  const now = Date.parse(`${ymd}T00:00:00`);
  if (start > now && start - now < 21 * 86_400_000) return "soon";
  return "off";
}

function CompRow({
  comp,
  status,
}: {
  comp: Competition;
  status: "on" | "soon" | "off";
}) {
  return (
    <Link
      href={`/sports/${comp.id}`}
      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/40"
    >
      <span className="text-xl leading-none">{comp.emoji}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{comp.name}</p>
        {comp.window && (
          <p className="truncate text-xs text-muted-foreground">
            {fmtDate(comp.window.start)} – {fmtDate(comp.window.end)}
            {comp.note ? ` · ${comp.note}` : ""}
          </p>
        )}
      </div>
      {status === "on" && (
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60" />
            <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
          </span>
          On now
        </span>
      )}
      {status === "soon" && (
        <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-foreground">
          Soon
        </span>
      )}
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}

export default function SportsPage() {
  const tournament = getActiveTournament();
  const now = new Date();
  const ymd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const majors = allCompetitions().filter((c) => MAJOR_IDS.has(c.id));

  const onNow = majors.filter((c) => statusLabel(c, ymd) === "on");
  const soon = majors.filter((c) => statusLabel(c, ymd) === "soon");
  const rest = majors.filter((c) => statusLabel(c, ymd) === "off");

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Sports"
        description="Major tournaments and competitions."
      />

      {/* Featured tournament */}
      {tournament && (
        <Link
          href="/tournament"
          className="mb-6 flex items-center gap-3 rounded-xl border bg-gradient-to-r from-primary/10 to-transparent px-4 py-4 transition-colors hover:bg-accent/40"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Trophy className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold">{tournament.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {tournament.host} · scores, bracket &amp; tables
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
            <Radio className="size-3" /> Live
          </span>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </Link>
      )}

      {/* On now */}
      {onNow.length > 0 && (
        <>
          <h2 className="mb-3 text-lg font-semibold tracking-tight">
            <span className="mr-2">🔴</span>On now
          </h2>
          <Card className="mb-6 divide-y overflow-hidden p-0">
            {onNow.map((c) => (
              <CompRow key={c.id} comp={c} status="on" />
            ))}
          </Card>
        </>
      )}

      {/* Starting soon */}
      {soon.length > 0 && (
        <>
          <h2 className="mb-3 text-lg font-semibold tracking-tight">
            <span className="mr-2">📅</span>Starting soon
          </h2>
          <Card className="mb-6 divide-y overflow-hidden p-0">
            {soon.map((c) => (
              <CompRow key={c.id} comp={c} status="soon" />
            ))}
          </Card>
        </>
      )}

      {/* Rest */}
      {rest.length > 0 && (
        <>
          <h2 className="mb-3 text-lg font-semibold tracking-tight">
            <span className="mr-2">🏆</span>All tournaments
          </h2>
          <Card className="divide-y overflow-hidden p-0">
            {rest.map((c) => (
              <CompRow key={c.id} comp={c} status="off" />
            ))}
          </Card>
        </>
      )}
    </div>
  );
}
