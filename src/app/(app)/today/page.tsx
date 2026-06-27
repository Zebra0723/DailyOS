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
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { TaskItem } from "@/components/task-item";
import { StatusBadge } from "@/components/badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { formatDateTime, relativeDay } from "@/lib/utils";
import type { CalendarEvent, ExtractedTask, InboxItem } from "@/lib/types";

export const metadata = { title: "Today · DailyOS" };

export default async function TodayPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const todayStart = new Date(new Date().toDateString()).toISOString();
  const todayEnd = new Date(
    new Date(new Date().toDateString()).getTime() + 86_400_000,
  ).toISOString();
  const nowIso = new Date().toISOString();

  const [tasksRes, eventsRes, recentRes, reviewRes] = await Promise.all([
    supabase
      .from("extracted_tasks")
      .select("*")
      .eq("status", "pending")
      .lte("due_date", new Date().toISOString().slice(0, 10))
      .order("priority", { ascending: false }),
    supabase
      .from("calendar_events")
      .select("*")
      .gte("start_time", nowIso)
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
  ]);

  const dueTasks = (tasksRes.data ?? []) as ExtractedTask[];
  const events = (eventsRes.data ?? []) as CalendarEvent[];
  const recent = (recentRes.data ?? []) as InboxItem[];
  const needsReview = (reviewRes.data ?? []) as InboxItem[];

  const greeting = getGreeting();
  const name =
    (user?.user_metadata?.username as string | undefined) ??
    user?.email?.split("@")[0] ??
    "there";

  return (
    <div>
      <PageHeader
        title={`${greeting}, ${name}`}
        description={new Date().toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
        action={
          <Button asChild>
            <Link href="/inbox/new">
              <Plus className="size-4" /> Add to Inbox
            </Link>
          </Button>
        }
      />

      {/* Needs review banner */}
      {needsReview.length > 0 && (
        <Card className="mb-6 border-amber-200 bg-amber-50/60 dark:border-amber-500/20 dark:bg-amber-500/5">
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tasks due */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckSquare className="size-4 text-primary" /> Due today
            </CardTitle>
            <Link
              href="/tasks"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              All tasks
            </Link>
          </CardHeader>
          <CardContent>
            {dueTasks.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Nothing due today. Enjoy the calm. ✨
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

        {/* Upcoming events */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="size-4 text-primary" /> Upcoming
            </CardTitle>
            <Link
              href="/calendar"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
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
                  <div
                    key={e.id}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                      <CalendarDays className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{e.title}</p>
                      <div className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3" />
                          {formatDateTime(e.start_time)}
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

      {/* Recently processed */}
      <div className="mt-6">
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
            <Link
              href="/inbox"
              className="shrink-0 text-sm text-muted-foreground hover:text-foreground"
            >
              View inbox
            </Link>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <EmptyState
                icon={Sun}
                title="Let's get started"
                description="Drop your first receipt, booking or screenshot into the Life Inbox and watch DailyOS handle it."
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
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
