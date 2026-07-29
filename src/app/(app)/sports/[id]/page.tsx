import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, CalendarDays, Radio } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { LeagueView } from "@/components/league-view";
import { findCompetition } from "@/lib/sports/catalog";
import { fetchFootballData } from "@/lib/sports/football-data";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }) {
  const comp = findCompetition(params.id);
  return { title: `${comp?.name ?? "Sports"} · DailyOS` };
}

function fmtDate(ymd: string) {
  return new Date(`${ymd}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function CompetitionPage({
  params,
}: {
  params: { id: string };
}) {
  const comp = findCompetition(params.id);
  if (!comp) redirect("/sports");

  // Live-bound competition + key present → real scores and standings.
  if (comp.live?.provider === "football-data") {
    const live = await fetchFootballData(comp.live.competition);
    if (live && (live.scores.length > 0 || live.tables)) {
      return (
        <LeagueView
          name={comp.name}
          subtitle={
            comp.window
              ? `${fmtDate(comp.window.start)} – ${fmtDate(comp.window.end)}`
              : "Season"
          }
          scores={live.scores}
          groups={live.tables?.groups ?? []}
        />
      );
    }
  }

  // No live feed (or none wired for this sport yet) → an honest info card.
  return (
    <div className="max-w-2xl">
      <Link
        href="/sports"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All sports
      </Link>

      <PageHeader
        title={comp.name}
        description={comp.note ?? "Major competition"}
      />

      <Card className="space-y-4 p-6">
        <div className="flex items-center gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-accent text-2xl">
            {comp.emoji}
          </span>
          <div>
            <p className="font-semibold">{comp.name}</p>
            {comp.window && (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <CalendarDays className="size-4" />
                {fmtDate(comp.window.start)} – {fmtDate(comp.window.end)}
              </p>
            )}
          </div>
        </div>
        <p className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
          <Radio className="mt-0.5 size-4 shrink-0" />
          {comp.live
            ? "Live scores are wired for this league — they'll appear here once the sports feed key is connected."
            : "No live feed covers this competition yet. Dates above are kept by hand; live scores land here when a feed is connected."}
        </p>
      </Card>
    </div>
  );
}
