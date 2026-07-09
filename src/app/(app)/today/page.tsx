import Link from "next/link";
import {
  Sun,
  CheckSquare,
  CalendarDays,
  Inbox as InboxIcon,
  AlertTriangle,
  Clock,
  MapPin,
  ArrowRight,
  Plus,
  Home,
  Heart,
  StickyNote,
  CalendarClock,
  Bookmark,
} from "lucide-react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { ymdInTz, addDaysYmd, nowFloatingInTz } from "@/lib/dates-tz";
import { TZ_COOKIE } from "@/components/timezone-sync";
import { LiveClock } from "@/components/live-clock";
import { TaskItem } from "@/components/task-item";
import { StatusBadge } from "@/components/badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { cn, formatFloating, relativeDay } from "@/lib/utils";
import { isOnboarding, tailoredIntro } from "@/lib/onboarding";
import { HomeOSTodayActions } from "@/components/homeos/today-home-actions";
import { RewardCodeNudge } from "@/components/reward-code-nudge";
import { PushNudge } from "@/components/push-nudge";
import { QuickAddTask } from "@/components/quick-add-task";
import { getClaimableRewardCodes } from "@/app/(app)/subscriptions/reward-code-actions";
import type { CalendarEvent, ExtractedTask, InboxItem } from "@/lib/types";

export const metadata = { title: "Today · DailyOS" };

export default async function TodayPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Compute "today" / "tomorrow" in the user's own timezone (captured in a
  // cookie), so due-date counts don't drift by a day for anyone outside UTC.
  const tz = cookies().get(TZ_COOKIE)?.value
    ? decodeURIComponent(cookies().get(TZ_COOKIE)!.value)
    : "UTC";
  const todayStr = ymdInTz(new Date(), tz);
  const tomorrowStr = addDaysYmd(todayStr, 1);
  // "Now" as a floating time in the user's timezone, to match event times.
  const nowFloating = nowFloatingInTz(tz);

  const [tasksRes, eventsRes, recentRes, reviewRes, tomorrowRes, bookmarksRes] =
    await Promise.all([
      supabase
        .from("extracted_tasks")
        .select("*")
        .eq("status", "pending")
        .lte("due_date", todayStr)
        .order("priority", { ascending: false }),
      supabase
        .from("calendar_events")
        .select("*")
        .gte("start_time", nowFloating)
        .order("start_time", { ascending: true })
        .limit(5),
      supabase
        .from("inbox_items")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("inbox_items")
        .select("*")
        .in("status", ["review", "failed"])
        .order("created_at", { ascending: false }),
      supabase
        .from("extracted_tasks")
        .select("*")
        .eq("status", "pending")
        .eq("due_date", tomorrowStr)
        .order("priority", { ascending: false }),
      // Bookmarked inbox items (pinned to Today). Degrades to empty if the
      // `bookmarked` column isn't migrated yet.
      supabase
        .from("inbox_items")
        .select("*")
        .eq("bookmarked", true)
        .order("created_at", { ascending: false })
        .limit(12),
    ]);

  const dueTasks = (tasksRes.data ?? []) as ExtractedTask[];
  const events = (eventsRes.data ?? []) as CalendarEvent[];
  const recent = (recentRes.data ?? []) as InboxItem[];
  const needsReview = (reviewRes.data ?? []) as InboxItem[];
  const tomorrowTasks = (tomorrowRes.data ?? []) as ExtractedTask[];
  const bookmarks = (bookmarksRes.data ?? []) as InboxItem[];

  const claimableCodes = await getClaimableRewardCodes();

  const greeting = getGreeting();
  const name =
    (user?.user_metadata?.username as string | undefined) ??
    user?.email?.split("@")[0] ??
    "there";

  const onboarding = user?.user_metadata?.onboarding;
  const intro = isOnboarding(onboarding) ? tailoredIntro(onboarding, name) : null;

  const dateLabel = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="space-y-6">
      {/* Editorial masthead */}
      <header className="border-b border-foreground/15 pb-6">
        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          <span>The Daily Brief</span>
          <span className="inline-flex items-center gap-x-2">
            <span className="hidden sm:inline">{dateLabel}</span>
            <span className="text-muted-foreground/40">·</span>
            <LiveClock />
          </span>
        </div>
        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              {greeting}, {name}
            </h1>
            <p className="mt-2 max-w-md text-muted-foreground">
              Your day, handled. Here&apos;s what matters right now.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button asChild>
              <Link href="/inbox/new">
                <Plus className="size-4" /> Add to the Drop
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/build-day">
                <CalendarClock className="size-4" /> Plan day
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* One-tap "turn on notifications" — easy to find, hides once enabled */}
      <PushNudge />

      {/* Personalised "made for you" card from onboarding */}
      {intro && (
        <Card className="border-primary/20 bg-accent/30">
          <CardContent className="pt-5">
            <p className="font-semibold">{intro.headline}</p>
            {intro.suggestions.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {intro.suggestions.map((s) => (
                  <Link
                    key={s.label}
                    href={s.href}
                    className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
                  >
                    {s.label}
                    <ArrowRight className="size-3.5" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Reward codes you've earned but not claimed yet */}
      <RewardCodeNudge userId={user?.id} codes={claimableCodes} />

      {/* HomeOS actions pushed into Today */}
      {user && <HomeOSTodayActions userId={user.id} />}

      {/* Bookmarked inbox items — pinned here from your Inbox */}
      {bookmarks.length > 0 && (
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bookmark className="size-4 fill-primary text-primary" /> Bookmarks
            </CardTitle>
            <CardDescription>
              Items you pinned from the Drop, kept close.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {bookmarks.map((b) => (
              <Link
                key={b.id}
                href={`/inbox/${b.id}`}
                className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/40"
              >
                <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                  <Bookmark className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{b.title}</p>
                  {b.summary && (
                    <p className="truncate text-xs text-muted-foreground">
                      {b.summary}
                    </p>
                  )}
                </div>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Needs review banner */}
      {needsReview.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/60 dark:border-amber-500/20 dark:bg-amber-500/5">
          <CardContent className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-500/15">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <p className="font-medium">
                  {needsReview.length} item{needsReview.length > 1 ? "s" : ""} need
                  your review
                </p>
                <p className="text-sm text-muted-foreground">
                  Approve what DailyOS found to add it to your tasks and calendar.
                </p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link href={`/inbox/${needsReview[0].id}`}>
                Review now <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile href="/tasks" label="Due today" value={dueTasks.length} hint="tasks" icon={CheckSquare} tone={dueTasks.length ? "primary" : "default"} />
        <StatTile href="/calendar" label="Upcoming" value={events.length} hint="events" icon={CalendarDays} />
        <StatTile href={needsReview.length ? `/inbox/${needsReview[0].id}` : "/inbox"} label="To review" value={needsReview.length} hint="items" icon={AlertTriangle} tone={needsReview.length ? "amber" : "default"} />
        <StatTile href="/inbox" label="In the Drop" value={recent.length} hint="recent" icon={InboxIcon} />
      </div>

      {/* Due today + Upcoming */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckSquare className="size-4 text-primary" /> Due today
            </CardTitle>
            <Link href="/tasks" className="text-sm text-muted-foreground hover:text-foreground">
              All tasks
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            <QuickAddTask dueDate={todayStr} />
            {dueTasks.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Nothing due today. Enjoy the calm.
              </p>
            ) : (
              <div className="grid gap-2">
                {dueTasks.map((t) => (
                  <TaskItem key={t.id} task={t} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="size-4 text-primary" /> Upcoming
            </CardTitle>
            <Link href="/calendar" className="text-sm text-muted-foreground hover:text-foreground">
              Calendar
            </Link>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No upcoming events.
              </p>
            ) : (
              <div className="grid gap-2">
                {events.map((e) => (
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

      {/* Heads-up: due tomorrow */}
      {tomorrowTasks.length > 0 && (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="size-4 text-primary" /> Due tomorrow
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              {tomorrowTasks.length} task{tomorrowTasks.length > 1 ? "s" : ""}
            </span>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-muted-foreground">
              A gentle heads-up so tomorrow doesn&apos;t sneak up on you.
            </p>
            <div className="grid gap-2">
              {tomorrowTasks.map((t) => (
                <TaskItem key={t.id} task={t} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Explore your DailyOS */}
      <div>
        <h2 className="mb-3 font-display text-lg font-semibold tracking-tight">
          Your DailyOS
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <BranchLink href="/build-day" icon={CalendarClock} title="Build My Day" desc="Plan a calm, productive day" />
          <BranchLink href="/homeos" icon={Home} title="HomeOS" desc="Run your home" />
          <BranchLink href="/interests" icon={Heart} title="Interests" desc="Live what you love" />
          <BranchLink href="/notes" icon={StickyNote} title="Notes" desc="Quick capture" />
        </div>
      </div>

      {/* Recently added */}
      <Card>
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <InboxIcon className="size-4 text-primary" /> Recently added
            </CardTitle>
            <CardDescription className="mt-1">
              From bookings to emails, we&apos;ve got you sorted.
            </CardDescription>
          </div>
          <Link href="/inbox" className="shrink-0 text-sm text-muted-foreground hover:text-foreground">
            View the Drop
          </Link>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <EmptyState
              icon={Sun}
              title="Let's get started"
              description="Drop your first receipt, booking or screenshot into the Drop and watch DailyOS handle it."
              actionLabel="Add your first item"
              actionHref="/inbox/new"
            />
          ) : (
            <div className="grid gap-2">
              {recent.map((item) => (
                <Link
                  key={item.id}
                  href={`/inbox/${item.id}`}
                  className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.summary ?? "Awaiting review"}
                    </p>
                  </div>
                  <span className="hidden text-xs text-muted-foreground sm:block">
                    {relativeDay(item.created_at)}
                  </span>
                  <StatusBadge status={item.status} />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatTile({
  href,
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  href: string;
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
    <Link href={href}>
      <Card className="transition-colors hover:bg-accent/40">
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
    </Link>
  );
}

function BranchLink({
  href,
  icon: Icon,
  title,
  desc,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <Link href={href}>
      <Card className="flex h-full items-center gap-3 p-3.5 transition-colors hover:bg-accent/40">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium">{title}</p>
          <p className="truncate text-xs text-muted-foreground">{desc}</p>
        </div>
      </Card>
    </Link>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
