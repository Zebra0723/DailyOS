import Link from "next/link";
import {
  CalendarCheck,
  CheckSquare,
  CalendarDays,
  Inbox as InboxIcon,
  StickyNote,
  AlertTriangle,
  Trophy,
  Sparkles,
  Clock,
  MapPin,
  ArrowRight,
} from "lucide-react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { ymdInTz, addDaysYmd, nowFloatingInTz } from "@/lib/dates-tz";
import { TZ_COOKIE } from "@/components/timezone-sync";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatFloating } from "@/lib/utils";
import type { CalendarEvent, ExtractedTask } from "@/lib/types";

export const metadata = { title: "Weekly Review · DailyOS" };
export const dynamic = "force-dynamic";

// Monday (0) … Sunday (6) offset for a YYYY-MM-DD calendar day.
function mondayIndex(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=Sun … 6=Sat
  return (dow + 6) % 7; // 0=Mon … 6=Sun
}

export default async function ReviewPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id;

  // "Today" in the user's own timezone (captured in a cookie), so a simple
  // local-week doesn't drift by a day for anyone outside UTC.
  const tz = cookies().get(TZ_COOKIE)?.value
    ? decodeURIComponent(cookies().get(TZ_COOKIE)!.value)
    : "UTC";
  const todayStr = ymdInTz(new Date(), tz);
  const nowFloating = nowFloatingInTz(tz);

  // Mon–Sun of the current local week.
  const weekStartYmd = addDaysYmd(todayStr, -mondayIndex(todayStr));
  const weekEndYmd = addDaysYmd(weekStartYmd, 6);
  const weekEndNextYmd = addDaysYmd(weekEndYmd, 1); // exclusive upper bound
  // Timestamp bounds for created_at / updated_at (real UTC columns). Treating
  // the local calendar day as a UTC instant keeps this a simple local-week.
  const weekStartTs = `${weekStartYmd}T00:00:00Z`;
  const weekEndTs = `${weekEndNextYmd}T00:00:00Z`;
  // Floating event bounds (event times are stored as UTC-literal wall-clock).
  const weekAheadEndYmd = addDaysYmd(todayStr, 7);

  const name =
    (user?.user_metadata?.username as string | undefined) ??
    user?.email?.split("@")[0] ??
    "there";

  // Every read is scoped to the signed-in user (RLS also enforces this, but we
  // filter explicitly to mirror the app's data-access pattern). The (app)
  // layout redirects unauthenticated visitors, so a user is always present.
  const uid = userId ?? "";

  const [
    completedRes,
    openTasksRes,
    overdueRes,
    weekEventsRes,
    aheadEventsRes,
    inboxRes,
    notesRes,
  ] = await Promise.all([
    // Tasks completed this week (completion approximated by updated_at).
    supabase
      .from("extracted_tasks")
      .select("*")
      .eq("user_id", uid)
      .eq("status", "completed")
      .gte("updated_at", weekStartTs)
      .lt("updated_at", weekEndTs)
      .order("updated_at", { ascending: false }),
    // Everything still pending (for the "still open" count).
    supabase
      .from("extracted_tasks")
      .select("id")
      .eq("user_id", uid)
      .eq("status", "pending"),
    // Overdue: pending with a due date before today.
    supabase
      .from("extracted_tasks")
      .select("*")
      .eq("user_id", uid)
      .eq("status", "pending")
      .lt("due_date", todayStr)
      .order("due_date", { ascending: true }),
    // Calendar events landing inside this week.
    supabase
      .from("calendar_events")
      .select("id")
      .eq("user_id", uid)
      .gte("start_time", `${weekStartYmd}T00:00:00Z`)
      .lt("start_time", `${weekEndNextYmd}T00:00:00Z`),
    // The week ahead: upcoming events over the next 7 days.
    supabase
      .from("calendar_events")
      .select("*")
      .eq("user_id", uid)
      .gte("start_time", nowFloating)
      .lt("start_time", `${weekAheadEndYmd}T23:59:59Z`)
      .order("start_time", { ascending: true })
      .limit(10),
    // Items dropped into the inbox this week.
    supabase
      .from("inbox_items")
      .select("id")
      .eq("user_id", uid)
      .gte("created_at", weekStartTs)
      .lt("created_at", weekEndTs),
    // Notes added this week.
    supabase
      .from("notes")
      .select("id")
      .eq("user_id", uid)
      .gte("created_at", weekStartTs)
      .lt("created_at", weekEndTs),
  ]);

  const completed = (completedRes.data ?? []) as ExtractedTask[];
  const openCount = (openTasksRes.data ?? []).length;
  const overdue = (overdueRes.data ?? []) as ExtractedTask[];
  const weekEventsCount = (weekEventsRes.data ?? []).length;
  const aheadEvents = (aheadEventsRes.data ?? []) as CalendarEvent[];
  const inboxCount = (inboxRes.data ?? []).length;
  const notesCount = (notesRes.data ?? []).length;

  const weekLabel = `${fmtDay(weekStartYmd)} – ${fmtDay(weekEndYmd)}`;
  const handled = completed.length + inboxCount + notesCount;

  return (
    <div>
      <PageHeader
        title="Weekly Review"
        description={
          <>
            A calm look back at your week, {name}.{" "}
            <span className="text-muted-foreground/70">{weekLabel}</span>
          </>
        }
      />

      {/* Momentum line */}
      <Card className="mb-6 border-primary/20 bg-accent/30">
        <CardContent className="flex items-center gap-3 pt-5">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="size-5" />
          </div>
          <p className="font-display text-lg font-semibold tracking-tight">
            You&apos;ve handled {handled} {handled === 1 ? "thing" : "things"} this
            week
            {handled > 0 ? " — nicely done." : ". A fresh start awaits."}
          </p>
        </CardContent>
      </Card>

      {/* Stat cards */}
      <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatTile label="Completed" value={completed.length} hint="tasks" icon={CheckSquare} tone="primary" />
        <StatTile label="Still open" value={openCount} hint="tasks" icon={AlertTriangle} tone={openCount ? "amber" : "default"} />
        <StatTile label="Events" value={weekEventsCount} hint="this week" icon={CalendarDays} />
        <StatTile label="Into the Drop" value={inboxCount} hint="items" icon={InboxIcon} />
        <StatTile label="Notes" value={notesCount} hint="added" icon={StickyNote} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Wins */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="size-4 text-primary" /> Wins
            </CardTitle>
            <Link href="/tasks" className="text-sm text-muted-foreground hover:text-foreground">
              All tasks
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {completed.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No tasks ticked off yet — the week is still young.
              </p>
            ) : (
              completed.slice(0, 10).map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 rounded-lg border bg-card p-3"
                >
                  <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <CheckSquare className="size-4" />
                  </div>
                  <p className="min-w-0 flex-1 truncate text-sm font-medium">
                    {t.title}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Needs attention */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />{" "}
              Needs attention
            </CardTitle>
            <Link href="/tasks" className="text-sm text-muted-foreground hover:text-foreground">
              Tasks
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {overdue.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Nothing overdue. You&apos;re all caught up.
              </p>
            ) : (
              overdue.slice(0, 10).map((t) => (
                <Link
                  key={t.id}
                  href="/tasks"
                  className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.title}</p>
                    {t.due_date && (
                      <p className="text-xs text-muted-foreground">
                        Due {fmtDay(t.due_date)}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* The week ahead */}
      <Card className="mt-6">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarCheck className="size-4 text-primary" /> The week ahead
          </CardTitle>
          <Link href="/calendar" className="text-sm text-muted-foreground hover:text-foreground">
            Calendar
          </Link>
        </CardHeader>
        <CardContent>
          {aheadEvents.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No events in the next 7 days. Space to breathe.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {aheadEvents.map((e) => (
                <div key={e.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                    <CalendarDays className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{e.title}</p>
                    <div className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3" />
                        {formatFloating(e.start_time)}
                      </span>
                      {e.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3" />
                          {e.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// A stat card matching the Today page's tiles (minus the link wrapper).
function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: number;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "default" | "primary" | "amber";
}) {
  const toneClass = {
    default: "text-foreground",
    primary: "text-primary",
    amber: "text-amber-600 dark:text-amber-400",
  }[tone];
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
          <Icon className="size-3.5 shrink-0" />
          <span className="truncate">{label}</span>
        </div>
        <div className={cn("mt-1 text-2xl font-bold tracking-tight", toneClass)}>
          {value}
        </div>
        <div className="text-xs text-muted-foreground">{hint}</div>
      </CardContent>
    </Card>
  );
}

// "2026-07-20" → "Mon 20 Jul", timezone-safe (parsed as a bare calendar day).
function fmtDay(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}
