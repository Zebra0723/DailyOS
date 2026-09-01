"use client";

import * as React from "react";
import {
  Plane,
  Plus,
  X,
  MapPin,
  Trash2,
  ArrowLeft,
  Check,
  Luggage,
  ListChecks,
} from "lucide-react";
import { loadRemote, saveRemote } from "@/lib/sync";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Trips live in user_state (key below), so they sync across every device on the
// account — same mechanism as the dashboard, HomeOS and the widgets.
const STORAGE_KEY = "trips-v1";

interface ItineraryItem {
  id: string;
  title: string;
  date: string; // yyyy-mm-dd
  note: string;
}
interface PackingItem {
  id: string;
  text: string;
  done: boolean;
}
interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  itinerary: ItineraryItem[];
  packing: PackingItem[];
}

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : String(Date.now() + Math.random());

function daysUntil(dateStr: string): number | null {
  const t = Date.parse(`${dateStr}T00:00:00`);
  if (Number.isNaN(t)) return null;
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((t - midnight) / 86_400_000);
}

function fmtRange(start: string, end: string): string {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  const s = start ? new Date(`${start}T00:00:00`).toLocaleDateString("en-GB", opts) : "";
  const e = end ? new Date(`${end}T00:00:00`).toLocaleDateString("en-GB", { ...opts, year: "numeric" }) : "";
  if (s && e) return `${s} – ${e}`;
  return s || e || "Dates TBC";
}

function countdownLabel(startDate: string): string {
  const d = daysUntil(startDate);
  if (d === null) return "";
  if (d > 1) return `in ${d} days`;
  if (d === 1) return "tomorrow";
  if (d === 0) return "today";
  return "past";
}

export function TripsManager({ userId }: { userId: string }) {
  const [trips, setTrips] = React.useState<Trip[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    (async () => {
      const remote = await loadRemote<{ trips: Trip[] }>(STORAGE_KEY);
      if (!active) return;
      if (remote && Array.isArray(remote.trips)) setTrips(remote.trips);
      setLoaded(true);
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  function persist(next: Trip[]) {
    setTrips(next);
    void saveRemote(STORAGE_KEY, { trips: next });
  }

  function updateTrip(id: string, patch: Partial<Trip>) {
    persist(trips.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  const open = trips.find((t) => t.id === openId) ?? null;

  // Sort upcoming first (soonest start), past trips sink to the bottom.
  const sorted = [...trips].sort((a, b) => {
    const da = daysUntil(a.startDate) ?? Infinity;
    const db = daysUntil(b.startDate) ?? Infinity;
    const pa = da < 0 ? 1 : 0;
    const pb = db < 0 ? 1 : 0;
    if (pa !== pb) return pa - pb;
    return Math.abs(da) - Math.abs(db);
  });

  if (open) {
    return (
      <TripDetail
        trip={open}
        onBack={() => setOpenId(null)}
        onChange={(patch) => updateTrip(open.id, patch)}
        onDelete={() => {
          persist(trips.filter((t) => t.id !== open.id));
          setOpenId(null);
        }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Trips"
        description="Every trip in one place — itinerary, packing list and a countdown to the off."
      />

      {creating ? (
        <NewTripForm
          onCancel={() => setCreating(false)}
          onCreate={(trip) => {
            persist([...trips, trip]);
            setCreating(false);
            setOpenId(trip.id);
          }}
        />
      ) : (
        <Button onClick={() => setCreating(true)} className="mb-6">
          <Plus className="size-4" /> New trip
        </Button>
      )}

      {loaded && trips.length === 0 && !creating && (
        <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/20 py-16 text-center">
          <div className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Plane className="size-7" />
          </div>
          <h2 className="mt-4 text-lg font-bold tracking-tight">No trips yet</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Add your next getaway and keep the flights, plans and packing list in
            one calm place.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {sorted.map((t) => {
          const cd = countdownLabel(t.startDate);
          const past = (daysUntil(t.startDate) ?? 0) < 0;
          return (
            <Card
              key={t.id}
              onClick={() => setOpenId(t.id)}
              className={cn(
                "cursor-pointer transition-colors hover:bg-accent/40",
                past && "opacity-70",
              )}
            >
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{t.title || "Untitled trip"}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                    {t.destination && (
                      <>
                        <MapPin className="size-3 shrink-0" />
                        {t.destination} ·{" "}
                      </>
                    )}
                    {fmtRange(t.startDate, t.endDate)}
                  </p>
                </div>
                {cd && (
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium",
                      past
                        ? "bg-muted text-muted-foreground"
                        : "bg-primary/10 text-primary",
                    )}
                  >
                    {cd}
                  </span>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function NewTripForm({
  onCreate,
  onCancel,
}: {
  onCreate: (trip: Trip) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = React.useState("");
  const [destination, setDestination] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");

  return (
    <Card className="mb-6">
      <CardContent className="space-y-3 pt-5">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Trip name (e.g. Summer in Italy)"
          autoFocus
        />
        <Input
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Destination (e.g. Rome)"
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Start</label>
            <DatePicker value={startDate} onChange={setStartDate} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">End</label>
            <DatePicker value={endDate} onChange={setEndDate} />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            disabled={!title.trim()}
            onClick={() =>
              onCreate({
                id: uid(),
                title: title.trim(),
                destination: destination.trim(),
                startDate,
                endDate,
                itinerary: [],
                packing: [],
              })
            }
          >
            Create trip
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TripDetail({
  trip,
  onBack,
  onChange,
  onDelete,
}: {
  trip: Trip;
  onBack: () => void;
  onChange: (patch: Partial<Trip>) => void;
  onDelete: () => void;
}) {
  const [itemTitle, setItemTitle] = React.useState("");
  const [itemDate, setItemDate] = React.useState("");
  const [packText, setPackText] = React.useState("");
  const cd = countdownLabel(trip.startDate);

  const sortedItinerary = [...trip.itinerary].sort((a, b) =>
    (a.date || "9999").localeCompare(b.date || "9999"),
  );

  function addItem() {
    const t = itemTitle.trim();
    if (!t) return;
    onChange({
      itinerary: [...trip.itinerary, { id: uid(), title: t, date: itemDate, note: "" }],
    });
    setItemTitle("");
    setItemDate("");
  }
  function addPacking() {
    const t = packText.trim();
    if (!t) return;
    onChange({ packing: [...trip.packing, { id: uid(), text: t, done: false }] });
    setPackText("");
  }

  const packedCount = trip.packing.filter((p) => p.done).length;

  return (
    <div className="mx-auto max-w-2xl">
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All trips
      </button>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            {trip.title || "Untitled trip"}
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            {trip.destination && (
              <>
                <MapPin className="size-3.5" /> {trip.destination} ·{" "}
              </>
            )}
            {fmtRange(trip.startDate, trip.endDate)}
          </p>
        </div>
        {cd && (
          <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            {cd}
          </span>
        )}
      </div>

      {/* Itinerary */}
      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <ListChecks className="size-4 text-primary" /> Itinerary
        </h2>
        <div className="space-y-2">
          {sortedItinerary.map((it) => (
            <div
              key={it.id}
              className="flex items-center justify-between gap-3 rounded-lg border p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{it.title}</p>
                {it.date && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(`${it.date}T00:00:00`).toLocaleDateString("en-GB", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                )}
              </div>
              <button
                onClick={() =>
                  onChange({ itinerary: trip.itinerary.filter((x) => x.id !== it.id) })
                }
                className="shrink-0 text-muted-foreground hover:text-destructive"
                aria-label="Remove"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto]">
          <Input
            value={itemTitle}
            onChange={(e) => setItemTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            placeholder="Add a flight, hotel, plan…"
          />
          <DatePicker value={itemDate} onChange={setItemDate} className="sm:w-40" />
          <Button onClick={addItem} className="shrink-0">
            <Plus className="size-4" /> Add
          </Button>
        </div>
      </section>

      {/* Packing */}
      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Luggage className="size-4 text-primary" /> Packing list
          {trip.packing.length > 0 && (
            <span className="text-xs font-normal text-muted-foreground">
              {packedCount}/{trip.packing.length} packed
            </span>
          )}
        </h2>
        <div className="space-y-1.5">
          {trip.packing.map((p) => (
            <div key={p.id} className="flex items-center gap-3">
              <button
                onClick={() =>
                  onChange({
                    packing: trip.packing.map((x) =>
                      x.id === p.id ? { ...x, done: !x.done } : x,
                    ),
                  })
                }
                className={cn(
                  "grid size-5 shrink-0 place-items-center rounded-md border transition-colors",
                  p.done
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/30 hover:border-primary",
                )}
                aria-label={p.done ? "Mark not packed" : "Mark packed"}
              >
                {p.done && <Check className="size-3" />}
              </button>
              <span
                className={cn(
                  "flex-1 text-sm",
                  p.done && "text-muted-foreground line-through",
                )}
              >
                {p.text}
              </span>
              <button
                onClick={() =>
                  onChange({ packing: trip.packing.filter((x) => x.id !== p.id) })
                }
                className="text-muted-foreground hover:text-destructive"
                aria-label="Remove"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <Input
            value={packText}
            onChange={(e) => setPackText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addPacking()}
            placeholder="Add something to pack…"
            className="flex-1"
          />
          <Button onClick={addPacking} className="shrink-0">
            <Plus className="size-4" /> Add
          </Button>
        </div>
      </section>

      <div className="mt-10 border-t pt-5">
        <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive hover:text-destructive">
          <Trash2 className="size-4" /> Delete trip
        </Button>
      </div>
    </div>
  );
}
