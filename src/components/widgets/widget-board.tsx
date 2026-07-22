"use client";

import * as React from "react";
import Link from "next/link";
import {
  CalendarDays,
  Clock,
  MapPin,
  Inbox as InboxIcon,
  Sparkles,
  CheckSquare,
  StickyNote,
  Globe,
  CalendarCheck,
  Plus,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  LayoutGrid,
  Settings2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { cn, formatFloating, relativeDay } from "@/lib/utils";
import { loadRemote, saveRemote, debounce } from "@/lib/sync";
import type {
  CalendarEvent,
  ExtractedTask,
  InboxItem,
  Note,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Config: an ordered list of widgets, each toggled on/off. Persisted to the
// existing `user_state` table under key "widgets" (cross-device) with a
// localStorage fallback for instant loads. No new tables.
// ---------------------------------------------------------------------------

type WidgetId =
  | "calendar"
  | "inbox"
  | "ask"
  | "tasks"
  | "notes"
  | "worldclock"
  | "review";

type Entry = { id: WidgetId; on: boolean };
type Config = Entry[];

const STATE_KEY = "widgets";
const localKey = (userId: string) => `dailyos-widgets:${userId}`;

const META: Record<
  WidgetId,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  calendar: { label: "Calendar", icon: CalendarDays },
  inbox: { label: "Inbox / The Drop", icon: InboxIcon },
  ask: { label: "Ask DailyOS", icon: Sparkles },
  tasks: { label: "Tasks", icon: CheckSquare },
  notes: { label: "Notes", icon: StickyNote },
  worldclock: { label: "World Clock", icon: Globe },
  review: { label: "Weekly Review", icon: CalendarCheck },
};

// Sensible first-visit default: Calendar, Inbox, Ask, Tasks enabled; the rest
// available but off. Order defines both the board and the edit list.
const DEFAULT_CONFIG: Config = [
  { id: "calendar", on: true },
  { id: "inbox", on: true },
  { id: "ask", on: true },
  { id: "tasks", on: true },
  { id: "notes", on: false },
  { id: "worldclock", on: false },
  { id: "review", on: false },
];

const ALL_IDS = DEFAULT_CONFIG.map((e) => e.id);

/** Reconcile a stored config with the known widget set: drop unknown ids,
 *  append any newly-added widgets (off by default) so old saves still work. */
function normalize(raw: unknown): Config {
  if (!Array.isArray(raw)) return DEFAULT_CONFIG;
  const seen = new Set<WidgetId>();
  const out: Config = [];
  for (const item of raw) {
    const id = (item as Entry)?.id;
    if (ALL_IDS.includes(id as WidgetId) && !seen.has(id as WidgetId)) {
      seen.add(id as WidgetId);
      out.push({ id: id as WidgetId, on: Boolean((item as Entry).on) });
    }
  }
  for (const id of ALL_IDS) {
    if (!seen.has(id)) out.push({ id, on: false });
  }
  return out.length ? out : DEFAULT_CONFIG;
}

export type WidgetData = {
  events: CalendarEvent[];
  dueTasks: ExtractedTask[];
  recentInbox: InboxItem[];
  notes: Note[];
  unhandledCount: number;
};

export function WidgetBoard({
  userId,
  data,
}: {
  userId: string;
  data: WidgetData;
}) {
  const key = localKey(userId);
  const [config, setConfig] = React.useState<Config | null>(null);
  const [editing, setEditing] = React.useState(false);

  const saveDebounced = React.useMemo(
    () => debounce((v: unknown) => void saveRemote(STATE_KEY, v), 700),
    [],
  );

  // Load: local first (instant), then the account-synced copy overrides it.
  React.useEffect(() => {
    let active = true;
    (async () => {
      let initial: Config | null = null;
      try {
        const raw = localStorage.getItem(key);
        if (raw) initial = normalize(JSON.parse(raw));
      } catch {
        /* ignore */
      }
      const remote = await loadRemote<Config>(STATE_KEY);
      if (!active) return;
      if (remote) {
        initial = normalize(remote);
        try {
          localStorage.setItem(key, JSON.stringify(initial));
        } catch {
          /* ignore */
        }
      }
      setConfig(initial ?? DEFAULT_CONFIG);
    })();
    return () => {
      active = false;
    };
  }, [key]);

  function persist(next: Config) {
    setConfig(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    saveDebounced(next);
  }

  function toggle(id: WidgetId) {
    if (!config) return;
    persist(config.map((e) => (e.id === id ? { ...e, on: !e.on } : e)));
  }

  function move(index: number, dir: -1 | 1) {
    if (!config) return;
    const target = index + dir;
    if (target < 0 || target >= config.length) return;
    const next = [...config];
    [next[index], next[target]] = [next[target], next[index]];
    persist(next);
  }

  // Avoid a hydration flash before we know the saved config.
  if (!config) {
    return (
      <div className="space-y-6">
        <BoardHeader editing={false} onToggleEdit={() => {}} />
        <div className="h-40 animate-pulse rounded-lg border bg-card" />
      </div>
    );
  }

  const enabled = config.filter((e) => e.on);

  return (
    <div className="space-y-6">
      <BoardHeader
        editing={editing}
        onToggleEdit={() => setEditing((v) => !v)}
      />

      {editing ? (
        <EditPanel config={config} onToggle={toggle} onMove={move} />
      ) : enabled.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title="Add widgets to build your board"
          description="Use Edit board above to turn on the widgets you want — Calendar, the Drop, Ask, Tasks and more — and arrange them your way."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {enabled.map((e) => (
            <div
              key={e.id}
              className={e.id === "ask" ? "lg:col-span-2" : undefined}
            >
              <WidgetCard id={e.id} data={data} userId={userId} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BoardHeader({
  editing,
  onToggleEdit,
}: {
  editing: boolean;
  onToggleEdit: () => void;
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-foreground/15 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          <LayoutGrid className="size-3.5" /> Your board
        </div>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          Widgets
        </h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          A personal at-a-glance dashboard. Choose what you see and the order.
        </p>
      </div>
      <div className="shrink-0">
        <Button variant={editing ? "default" : "outline"} onClick={onToggleEdit}>
          {editing ? (
            <>
              <Check className="size-4" /> Done
            </>
          ) : (
            <>
              <Settings2 className="size-4" /> Edit board
            </>
          )}
        </Button>
      </div>
    </header>
  );
}

function EditPanel({
  config,
  onToggle,
  onMove,
}: {
  config: Config;
  onToggle: (id: WidgetId) => void;
  onMove: (index: number, dir: -1 | 1) => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Customize your board</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {config.map((e, i) => {
          const Icon = META[e.id].icon;
          return (
            <div
              key={e.id}
              className="flex items-center gap-3 rounded-lg border bg-card p-3"
            >
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                <Icon className="size-4" />
              </div>
              <p className="min-w-0 flex-1 truncate text-sm font-medium">
                {META[e.id].label}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onMove(i, -1)}
                  disabled={i === 0}
                  aria-label={`Move ${META[e.id].label} up`}
                  className="grid size-8 place-items-center rounded-md border text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
                >
                  <ArrowUp className="size-4" />
                </button>
                <button
                  onClick={() => onMove(i, 1)}
                  disabled={i === config.length - 1}
                  aria-label={`Move ${META[e.id].label} down`}
                  className="grid size-8 place-items-center rounded-md border text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
                >
                  <ArrowDown className="size-4" />
                </button>
              </div>
              <button
                onClick={() => onToggle(e.id)}
                role="switch"
                aria-checked={e.on}
                aria-label={`Toggle ${META[e.id].label}`}
                className={cn(
                  "relative ml-1 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
                  e.on ? "bg-primary" : "bg-input",
                )}
              >
                <span
                  className={cn(
                    "inline-block size-5 rounded-full bg-background shadow transition-transform",
                    e.on ? "translate-x-[22px]" : "translate-x-0.5",
                  )}
                />
              </button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Individual widgets — clean cards matching the app's design tokens.
// ---------------------------------------------------------------------------

function WidgetShell({
  icon: Icon,
  title,
  href,
  linkLabel,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  href?: string;
  linkLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="h-full">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="size-4 text-primary" /> {title}
        </CardTitle>
        {href && linkLabel && (
          <Link
            href={href}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {linkLabel}
          </Link>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function EmptyLine({ children }: { children: React.ReactNode }) {
  return (
    <p className="py-4 text-center text-sm text-muted-foreground">{children}</p>
  );
}

function WidgetCard({
  id,
  data,
  userId,
}: {
  id: WidgetId;
  data: WidgetData;
  userId: string;
}) {
  switch (id) {
    case "calendar":
      return <CalendarWidget events={data.events} />;
    case "inbox":
      return (
        <InboxWidget
          recent={data.recentInbox}
          unhandledCount={data.unhandledCount}
        />
      );
    case "ask":
      return <AskWidget />;
    case "tasks":
      return <TasksWidget tasks={data.dueTasks} />;
    case "notes":
      return <NotesWidget notes={data.notes} />;
    case "worldclock":
      return <WorldClockWidget userId={userId} />;
    case "review":
      return (
        <ReviewWidget
          taskCount={data.dueTasks.length}
          eventCount={data.events.length}
        />
      );
    default:
      return null;
  }
}

function CalendarWidget({ events }: { events: CalendarEvent[] }) {
  return (
    <WidgetShell icon={CalendarDays} title="Calendar" href="/calendar" linkLabel="Open">
      {events.length === 0 ? (
        <EmptyLine>No upcoming events.</EmptyLine>
      ) : (
        <div className="grid grid-cols-1 gap-2">
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
    </WidgetShell>
  );
}

function InboxWidget({
  recent,
  unhandledCount,
}: {
  recent: InboxItem[];
  unhandledCount: number;
}) {
  return (
    <WidgetShell icon={InboxIcon} title="The Drop" href="/inbox" linkLabel="View all">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <span className="text-2xl font-bold tracking-tight">
            {unhandledCount}
          </span>{" "}
          <span className="text-sm text-muted-foreground">
            item{unhandledCount === 1 ? "" : "s"} to handle
          </span>
        </div>
        <Button size="sm" asChild>
          <Link href="/inbox/new">
            <Plus className="size-4" /> Add to the Drop
          </Link>
        </Button>
      </div>
      {recent.length === 0 ? (
        <EmptyLine>Nothing in the Drop yet.</EmptyLine>
      ) : (
        <div className="grid grid-cols-1 gap-2">
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
              <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
                {relativeDay(item.created_at)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </WidgetShell>
  );
}

function AskWidget() {
  const [q, setQ] = React.useState("");
  return (
    <Card className="h-full border-primary/20 bg-accent/30">
      <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="size-5" />
          </div>
          <div>
            <p className="font-display text-lg font-semibold tracking-tight">
              Ask DailyOS
            </p>
            <p className="text-sm text-muted-foreground">
              Your fastest way to the assistant.
            </p>
          </div>
        </div>
        <form
          action="/assistant"
          method="get"
          className="flex w-full gap-2 sm:w-auto sm:min-w-[320px]"
        >
          <input
            name="q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ask anything…"
            className="h-11 flex-1 rounded-xl border border-input bg-background px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button type="submit" className="h-11 shrink-0">
            Ask <ArrowRight className="size-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function TasksWidget({ tasks }: { tasks: ExtractedTask[] }) {
  return (
    <WidgetShell icon={CheckSquare} title="Tasks" href="/tasks" linkLabel="All tasks">
      {tasks.length === 0 ? (
        <EmptyLine>Nothing due or overdue. Enjoy the calm.</EmptyLine>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {tasks.map((t) => (
            <Link
              key={t.id}
              href="/tasks"
              className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/40"
            >
              <CheckSquare className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{t.title}</p>
                {t.due_date && (
                  <p className="text-xs text-muted-foreground">
                    Due {relativeDay(t.due_date)}
                  </p>
                )}
              </div>
              {t.priority === "high" && (
                <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                  High
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </WidgetShell>
  );
}

function NotesWidget({ notes }: { notes: Note[] }) {
  return (
    <WidgetShell icon={StickyNote} title="Notes" href="/notes" linkLabel="All notes">
      {notes.length === 0 ? (
        <EmptyLine>No notes yet.</EmptyLine>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {notes.map((n) => (
            <Link
              key={n.id}
              href="/notes"
              className="block rounded-lg border p-3 transition-colors hover:bg-accent/40"
            >
              <p className="line-clamp-2 text-sm">{n.content}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {relativeDay(n.created_at)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </WidgetShell>
  );
}

function ReviewWidget({
  taskCount,
  eventCount,
}: {
  taskCount: number;
  eventCount: number;
}) {
  return (
    <WidgetShell
      icon={CalendarCheck}
      title="Weekly Review"
      href="/review"
      linkLabel="Open"
    >
      <p className="text-sm text-muted-foreground">
        You have{" "}
        <span className="font-semibold text-foreground">{taskCount}</span> task
        {taskCount === 1 ? "" : "s"} due and{" "}
        <span className="font-semibold text-foreground">{eventCount}</span>{" "}
        upcoming event{eventCount === 1 ? "" : "s"}.
      </p>
      <Button variant="outline" size="sm" asChild className="mt-3">
        <Link href="/review">
          Open weekly review <ArrowRight className="size-4" />
        </Link>
      </Button>
    </WidgetShell>
  );
}

// Compact world clock — reuses the same saved-cities key as the World Clock
// page (`dailyos-worldclock:<userId>`), showing the first couple of zones.
function cityFromZone(zone: string): string {
  return zone.split("/").pop()!.replace(/_/g, " ");
}

function WorldClockWidget({ userId }: { userId: string }) {
  const [zones, setZones] = React.useState<{ city: string; zone: string }[]>([]);
  const [, setTick] = React.useState(0);

  React.useEffect(() => {
    let active = true;
    (async () => {
      let list: { city: string; zone: string }[] | null = null;
      try {
        const raw = localStorage.getItem(`dailyos-worldclock:${userId}`);
        if (raw) list = JSON.parse(raw);
      } catch {
        /* ignore */
      }
      const remote = await loadRemote<{ city: string; zone: string }[]>(
        `dailyos-worldclock:${userId}`,
      );
      if (!active) return;
      if (Array.isArray(remote)) list = remote;
      if (!list || list.length === 0) {
        list = ["Europe/London", "America/New_York", "Asia/Tokyo"].map((z) => ({
          zone: z,
          city: cityFromZone(z),
        }));
      }
      setZones(list.slice(0, 3));
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  React.useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const now = new Date();

  return (
    <WidgetShell icon={Globe} title="World Clock" href="/world-clock" linkLabel="Open">
      <div className="grid grid-cols-1 gap-2">
        {zones.map((z) => {
          const time = new Intl.DateTimeFormat("en-GB", {
            timeZone: z.zone,
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }).format(now);
          const day = new Intl.DateTimeFormat("en-GB", {
            timeZone: z.zone,
            weekday: "short",
            day: "numeric",
            month: "short",
          }).format(now);
          return (
            <div
              key={z.zone}
              className="flex items-center justify-between gap-3 rounded-lg border p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{z.city}</p>
                <p className="truncate text-xs text-muted-foreground">{day}</p>
              </div>
              <p className="font-mono text-lg tabular-nums">{time}</p>
            </div>
          );
        })}
      </div>
    </WidgetShell>
  );
}
