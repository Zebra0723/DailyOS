"use client";

import * as React from "react";
import {
  PackageCheck,
  CalendarClock,
  Home as HomeIcon,
  AlertTriangle,
  MapPin,
  Clock,
  Building2,
  Phone,
  KeyRound,
  Link2,
  Plus,
  Trash2,
} from "lucide-react";
import { useHomeOS } from "@/lib/homeos/store";
import {
  getArrivalsToday,
  getUpcomingArrivals,
  getProblemArrivals,
} from "@/lib/homeos/calculations";
import { getArrivalBrief } from "@/lib/homeos/suggestions";
import { relativeLabel, formatDate } from "@/lib/homeos/dates";
import {
  ARRIVAL_TYPES,
  ARRIVAL_STATUSES,
  PRIORITIES,
  type HomeArrival,
  type ArrivalStatus,
  type ArrivalType,
  type Priority,
} from "@/lib/homeos/types";
import {
  StatCard,
  StatusPill,
  Section,
  HomeEmpty,
  Drawer,
  Field,
  DetailRow,
} from "@/components/homeos/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ---- Status → pill tone ----------------------------------------------------

const STATUS_TONE: Record<
  ArrivalStatus,
  "green" | "amber" | "red" | "blue" | "grey"
> = {
  Scheduled: "blue",
  "In Transit": "blue",
  "Arriving Today": "amber",
  Delayed: "amber",
  Completed: "green",
  Missed: "red",
  Cancelled: "grey",
  "Needs Follow-up": "amber",
};

function ArrivalStatusPill({ status }: { status: ArrivalStatus }) {
  return <StatusPill label={status} tone={STATUS_TONE[status]} />;
}

const PRIORITY_TONE: Record<Priority, "green" | "amber" | "red" | "blue" | "grey"> = {
  Critical: "red",
  High: "amber",
  Normal: "blue",
  Low: "grey",
};

// ---- Arrival card ----------------------------------------------------------

function ArrivalCard({
  arrival,
  onClick,
}: {
  arrival: HomeArrival;
  onClick: () => void;
}) {
  const active =
    arrival.status !== "Completed" && arrival.status !== "Cancelled";
  return (
    <Card
      onClick={onClick}
      className="cursor-pointer transition-colors hover:bg-accent/40"
    >
      <CardContent className="flex flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate font-semibold tracking-tight">
              {arrival.title}
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <PackageCheck className="size-3.5" />
                {arrival.type}
              </span>
              <span className="inline-flex items-center gap-1">
                <CalendarClock className="size-3.5" />
                {arrival.expectedDate
                  ? relativeLabel(arrival.expectedDate)
                  : "No date"}
              </span>
              {arrival.expectedTimeWindow && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3.5" />
                  {arrival.expectedTimeWindow}
                </span>
              )}
              {arrival.company && (
                <span className="inline-flex items-center gap-1">
                  <Building2 className="size-3.5" />
                  {arrival.company}
                </span>
              )}
            </div>
          </div>
          <ArrivalStatusPill status={arrival.status} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="secondary"
            className={cn(
              "gap-1",
              PRIORITY_TONE[arrival.priority] === "red" &&
                "text-red-600 dark:text-red-400",
              PRIORITY_TONE[arrival.priority] === "amber" &&
                "text-amber-600 dark:text-amber-400",
            )}
          >
            {arrival.priority}
          </Badge>
          {arrival.needsSomeoneHome && active && (
            <Badge variant="warning" className="gap-1">
              <HomeIcon className="size-3" />
              Someone home
            </Badge>
          )}
          {arrival.roomOrLocation && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3.5" />
              {arrival.roomOrLocation}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ArrivalGrid({
  arrivals,
  onSelect,
  emptyMessage,
}: {
  arrivals: HomeArrival[];
  onSelect: (a: HomeArrival) => void;
  emptyMessage?: string;
}) {
  if (arrivals.length === 0) {
    return emptyMessage ? (
      <Card>
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </CardContent>
      </Card>
    ) : null;
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {arrivals.map((a) => (
        <ArrivalCard key={a.id} arrival={a} onClick={() => onSelect(a)} />
      ))}
    </div>
  );
}

// ---- Detail drawer ---------------------------------------------------------

function ArrivalDrawer({
  arrival,
  open,
  onClose,
}: {
  arrival: HomeArrival | null;
  open: boolean;
  onClose: () => void;
}) {
  const { updateArrival, deleteArrival, addTodayAction } = useHomeOS();
  const [note, setNote] = React.useState("");
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  React.useEffect(() => {
    setNote("");
    setConfirmDelete(false);
  }, [arrival?.id]);

  if (!arrival) return null;

  function setStatus(status: ArrivalStatus) {
    if (!arrival) return;
    updateArrival(arrival.id, { status });
  }

  function addNote() {
    if (!arrival) return;
    const trimmed = note.trim();
    if (!trimmed) return;
    const combined = arrival.notes ? `${arrival.notes}\n${trimmed}` : trimmed;
    updateArrival(arrival.id, { notes: combined });
    setNote("");
  }

  function pushToToday() {
    if (!arrival) return;
    addTodayAction({
      title: arrival.title,
      source: "HomeOS",
      sourceModule: "ArrivalOps",
      linkedEntityType: "arrival",
      linkedEntityId: arrival.id,
      priority: arrival.priority ?? "Normal",
      estimatedMinutes: 5,
      status: "Not Started",
    });
  }

  function handleDelete() {
    if (!arrival) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteArrival(arrival.id);
    onClose();
  }

  const linkedLabel =
    arrival.linkedEntityType && arrival.linkedEntityId
      ? `${arrival.linkedEntityType} · ${arrival.linkedEntityId}`
      : null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={arrival.title}
      footer={
        <div className="flex items-center justify-between gap-2">
          <Button
            variant={confirmDelete ? "destructive" : "ghost"}
            size="sm"
            onClick={handleDelete}
          >
            <Trash2 className="size-4" />
            {confirmDelete ? "Confirm delete" : "Delete"}
          </Button>
          <Button size="sm" onClick={pushToToday}>
            <Plus className="size-4" />
            Add to Today
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <ArrivalStatusPill status={arrival.status} />
          <Badge variant="secondary">{arrival.type}</Badge>
          <Badge variant="secondary">{arrival.priority}</Badge>
          {arrival.needsSomeoneHome && (
            <Badge variant="warning" className="gap-1">
              <HomeIcon className="size-3" />
              Someone home
            </Badge>
          )}
        </div>

        {/* Home Access Brief */}
        <div className="rounded-xl border bg-muted/40 p-4">
          <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <KeyRound className="size-3.5" />
            Home Access Brief
          </div>
          <p className="text-sm leading-relaxed">{getArrivalBrief(arrival)}</p>
        </div>

        {/* Details */}
        <div className="divide-y">
          <DetailRow
            label="Expected"
            value={
              arrival.expectedDate
                ? `${formatDate(arrival.expectedDate)} (${relativeLabel(
                    arrival.expectedDate,
                  )})`
                : undefined
            }
          />
          <DetailRow label="Time window" value={arrival.expectedTimeWindow} />
          <DetailRow label="Company" value={arrival.company} />
          <DetailRow label="Tracking number" value={arrival.trackingNumber} />
          <DetailRow
            label="Tracking"
            value={
              arrival.trackingUrl ? (
                <a
                  href={arrival.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Open link
                </a>
              ) : undefined
            }
          />
          <DetailRow
            label="Contact"
            value={
              arrival.contactName ? (
                <span className="inline-flex items-center gap-1">
                  {arrival.contactName}
                </span>
              ) : undefined
            }
          />
          <DetailRow
            label="Phone"
            value={
              arrival.contactPhone ? (
                <span className="inline-flex items-center gap-1">
                  <Phone className="size-3.5" />
                  {arrival.contactPhone}
                </span>
              ) : undefined
            }
          />
          <DetailRow
            label="Access instructions"
            value={arrival.accessInstructions}
          />
          <DetailRow
            label="Room / location"
            value={
              arrival.roomOrLocation ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" />
                  {arrival.roomOrLocation}
                </span>
              ) : undefined
            }
          />
          <DetailRow label="Notes" value={arrival.notes} />
          <DetailRow
            label="Linked"
            value={
              linkedLabel ? (
                <span className="inline-flex items-center gap-1">
                  <Link2 className="size-3.5" />
                  {linkedLabel}
                </span>
              ) : undefined
            }
          />
        </div>

        {/* Status actions */}
        <div className="space-y-2">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Update status
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatus("Arriving Today")}
            >
              Arriving today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatus("Completed")}
            >
              Completed
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatus("Delayed")}
            >
              Delayed
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatus("Missed")}
            >
              Missed
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatus("Needs Follow-up")}
            >
              Needs follow-up
            </Button>
          </div>
        </div>

        {/* Add note */}
        <div className="space-y-2">
          <Field label="Add note">
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note about this arrival…"
            />
          </Field>
          <Button
            variant="secondary"
            size="sm"
            onClick={addNote}
            disabled={!note.trim()}
          >
            Save note
          </Button>
        </div>
      </div>
    </Drawer>
  );
}

// ---- Main screen -----------------------------------------------------------

export function ArrivalOps() {
  const { data } = useHomeOS();
  const arrivals = data.arrivals;

  const [selected, setSelected] = React.useState<HomeArrival | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  // Filters
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<"all" | ArrivalType>("all");
  const [statusFilter, setStatusFilter] = React.useState<"all" | ArrivalStatus>(
    "all",
  );
  const [priorityFilter, setPriorityFilter] = React.useState<"all" | Priority>(
    "all",
  );
  const [onlyNeedsHome, setOnlyNeedsHome] = React.useState(false);

  function openArrival(a: HomeArrival) {
    setSelected(a);
    setDrawerOpen(true);
  }

  // Keep the selected arrival in sync with store updates.
  const selectedLive =
    selected != null
      ? arrivals.find((a) => a.id === selected.id) ?? null
      : null;

  const todayArrivals = React.useMemo(
    () => getArrivalsToday(arrivals),
    [arrivals],
  );
  const upcoming = React.useMemo(
    () => getUpcomingArrivals(arrivals, 14),
    [arrivals],
  );
  const needsHome = React.useMemo(
    () =>
      arrivals.filter(
        (a) =>
          a.needsSomeoneHome &&
          a.status !== "Completed" &&
          a.status !== "Cancelled",
      ),
    [arrivals],
  );
  const problems = React.useMemo(
    () => getProblemArrivals(arrivals),
    [arrivals],
  );

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return arrivals.filter((a) => {
      if (q) {
        const hay = `${a.title} ${a.company ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (typeFilter !== "all" && a.type !== typeFilter) return false;
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (priorityFilter !== "all" && a.priority !== priorityFilter)
        return false;
      if (onlyNeedsHome && !a.needsSomeoneHome) return false;
      return true;
    });
  }, [arrivals, search, typeFilter, statusFilter, priorityFilter, onlyNeedsHome]);

  if (arrivals.length === 0) {
    return (
      <div className="space-y-6">
        <Header />
        <HomeEmpty message="No arrivals today. The front door is peaceful." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Header />

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Today"
          value={todayArrivals.length}
          icon={PackageCheck}
          tone={todayArrivals.length ? "primary" : "default"}
        />
        <StatCard
          label="Next 14 days"
          value={upcoming.length}
          icon={CalendarClock}
        />
        <StatCard
          label="Needs someone home"
          value={needsHome.length}
          icon={HomeIcon}
          tone={needsHome.length ? "amber" : "default"}
        />
        <StatCard
          label="Problem arrivals"
          value={problems.length}
          icon={AlertTriangle}
          tone={problems.length ? "red" : "default"}
        />
      </div>

      <Section
        title="Today's arrivals"
        description="What's landing at the door today."
      >
        <ArrivalGrid
          arrivals={todayArrivals}
          onSelect={openArrival}
          emptyMessage="Nothing arriving today."
        />
      </Section>

      <Section
        title="Upcoming (next 14 days)"
        description="Plan ahead for who needs to be in."
      >
        <ArrivalGrid
          arrivals={upcoming}
          onSelect={openArrival}
          emptyMessage="Nothing scheduled in the next two weeks."
        />
      </Section>

      <Section
        title="Needs someone home"
        description="Arrivals that require a person to be in."
      >
        <ArrivalGrid
          arrivals={needsHome}
          onSelect={openArrival}
          emptyMessage="No arrivals need anyone home right now."
        />
      </Section>

      <Section
        title="Problem arrivals"
        description="Delayed, missed, or needing follow-up."
      >
        <ArrivalGrid
          arrivals={problems}
          onSelect={openArrival}
          emptyMessage="No problem arrivals. Everything's on track."
        />
      </Section>

      <Section
        title="All arrivals"
        description="Search and filter every arrival."
      >
        <Card className="mb-4">
          <CardContent className="grid gap-3 p-4 md:grid-cols-2 lg:grid-cols-4">
            <Input
              placeholder="Search title or company…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value as "all" | ArrivalType)
              }
            >
              <option value="all">All types</option>
              {ARRIVAL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
            <Select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "all" | ArrivalStatus)
              }
            >
              <option value="all">All statuses</option>
              {ARRIVAL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            <Select
              value={priorityFilter}
              onChange={(e) =>
                setPriorityFilter(e.target.value as "all" | Priority)
              }
            >
              <option value="all">All priorities</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
            <label className="flex items-center gap-2 text-sm font-medium md:col-span-2 lg:col-span-4">
              <input
                type="checkbox"
                className="size-4 rounded border-input"
                checked={onlyNeedsHome}
                onChange={(e) => setOnlyNeedsHome(e.target.checked)}
              />
              Only show arrivals that need someone home
            </label>
          </CardContent>
        </Card>

        {filtered.length === 0 ? (
          <HomeEmpty message="No arrivals match your filters." />
        ) : (
          <ArrivalGrid arrivals={filtered} onSelect={openArrival} />
        )}
      </Section>

      <ArrivalDrawer
        arrival={selectedLive}
        open={drawerOpen && selectedLive !== null}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}

function Header() {
  return (
    <div>
      <h2 className="font-display text-2xl font-bold tracking-tight">
        ArrivalOps
      </h2>
      <p className="text-sm text-muted-foreground">
        Know what&apos;s arriving, who needs access, and what needs follow-up.
      </p>
    </div>
  );
}
