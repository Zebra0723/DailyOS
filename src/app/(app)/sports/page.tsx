import Link from "next/link";
import { ChevronRight, Trophy, Radio, CalendarClock } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { getActiveTournament } from "@/lib/tournament";
import {
  FOOTBALL_COUNTRIES,
  FOOTBALL_INTERNATIONAL,
  SPORT_SECTIONS,
  competitionsOnNow,
  competitionsStartingSoon,
  type Competition,
} from "@/lib/sports/catalog";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sports · DailyOS" };

function fmtDate(ymd: string) {
  return new Date(`${ymd}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function windowLabel(c: Competition): string {
  if (!c.window) return "";
  return `${fmtDate(c.window.start)} – ${fmtDate(c.window.end)}`;
}

/** One tappable competition row. */
function CompRow({
  comp,
  href,
  onNow,
}: {
  comp: Competition;
  href?: string;
  onNow?: boolean;
}) {
  return (
    <Link
      href={href ?? `/sports/${comp.id}`}
      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/40"
    >
      <span className="text-xl leading-none">{comp.emoji}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {comp.name}
          {comp.tier === 2 && (
            <span className="ml-2 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              2nd div
            </span>
          )}
        </p>
        {comp.window && (
          <p className="truncate text-xs text-muted-foreground">
            {windowLabel(comp)}
            {comp.note ? ` · ${comp.note}` : ""}
          </p>
        )}
      </div>
      {onNow && (
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60" />
            <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
          </span>
          On now
        </span>
      )}
      {comp.live && !onNow && (
        <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-foreground">
          Live scores
        </span>
      )}
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}

function SectionHeading({
  id,
  emoji,
  label,
}: {
  id: string;
  emoji: string;
  label: string;
}) {
  return (
    <h2
      id={id}
      className="mb-3 mt-8 scroll-mt-24 text-lg font-semibold tracking-tight"
    >
      <span className="mr-2">{emoji}</span>
      {label}
    </h2>
  );
}

export default function SportsPage() {
  const tournament = getActiveTournament();
  const onNow = competitionsOnNow();
  const soon = competitionsStartingSoon();
  const onNowIds = new Set(onNow.map((c) => c.id));

  const chips = [
    { href: "#on-now", label: "On now" },
    { href: "#football", label: "Football" },
    ...SPORT_SECTIONS.map((s) => ({ href: `#${s.key}`, label: s.label })),
  ];

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Sports"
        description="Every big league and competition — and what's on right now."
      />

      {/* Jump chips */}
      <div className="-mx-1 mb-2 flex gap-2 overflow-x-auto px-1 pb-2">
        {chips.map((c) => (
          <a
            key={c.href}
            href={c.href}
            className="shrink-0 rounded-full border bg-card px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {c.label}
          </a>
        ))}
      </div>

      {/* On now */}
      <SectionHeading id="on-now" emoji="🔴" label="On now" />
      {tournament || onNow.length > 0 ? (
        <Card className="divide-y overflow-hidden p-0">
          {tournament && (
            <Link
              href="/tournament"
              className="flex items-center gap-3 bg-gradient-to-r from-primary/10 to-transparent px-4 py-3 transition-colors hover:bg-accent/40"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
                <Trophy className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{tournament.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {tournament.host} · scores, bracket &amp; tables
                </p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                <Radio className="size-3" /> Featured
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          )}
          {onNow.map((c) => (
            <CompRow key={c.id} comp={c} onNow />
          ))}
        </Card>
      ) : (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          Nothing major is on today.
        </Card>
      )}

      {/* Starting soon */}
      {soon.length > 0 && (
        <>
          <h3 className="mb-3 mt-6 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <CalendarClock className="size-4" /> Starting soon
          </h3>
          <Card className="divide-y overflow-hidden p-0">
            {soon.map((c) => (
              <CompRow key={c.id} comp={c} />
            ))}
          </Card>
        </>
      )}

      {/* Football — top two divisions per major country */}
      <SectionHeading id="football" emoji="⚽" label="Football" />
      <div className="space-y-4">
        {FOOTBALL_COUNTRIES.map((country) => (
          <Card key={country.name} className="overflow-hidden p-0">
            <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2 text-sm font-semibold">
              <span className="text-lg leading-none">{country.flag}</span>
              {country.name}
            </div>
            <div className="divide-y">
              {country.leagues.map((l) => (
                <CompRow key={l.id} comp={l} onNow={onNowIds.has(l.id)} />
              ))}
            </div>
          </Card>
        ))}
        <Card className="overflow-hidden p-0">
          <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2 text-sm font-semibold">
            <span className="text-lg leading-none">🌍</span>
            Continental &amp; international
          </div>
          <div className="divide-y">
            {FOOTBALL_INTERNATIONAL.map((l) => (
              <CompRow key={l.id} comp={l} onNow={onNowIds.has(l.id)} />
            ))}
          </div>
        </Card>
      </div>

      {/* All other sports */}
      {SPORT_SECTIONS.map((s) => (
        <div key={s.key}>
          <SectionHeading id={s.key} emoji={s.emoji} label={s.label} />
          <Card className="divide-y overflow-hidden p-0">
            {s.competitions.map((c) => (
              <CompRow key={c.id} comp={c} onNow={onNowIds.has(c.id)} />
            ))}
          </Card>
        </div>
      ))}

      <p className={cn("mt-8 text-center text-xs text-muted-foreground")}>
        Competition dates are kept by hand and refreshed each season. Leagues
        marked <span className="font-medium">Live scores</span> show real
        results once the sports feed is connected.
      </p>
    </div>
  );
}
