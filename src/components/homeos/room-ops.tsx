"use client";

import * as React from "react";
import {
  Boxes,
  CheckCircle2,
  Hammer,
  Plus,
  PoundSterling,
  RotateCcw,
  Search,
  Trash2,
  Wrench,
} from "lucide-react";
import {
  DetailRow,
  Drawer,
  Field,
  HomeEmpty,
  Section,
  StatCard,
  StatusPill,
} from "@/components/homeos/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  getRoomCompletion,
  getRoomSpend,
} from "@/lib/homeos/calculations";
import { formatDate, isWithinDays, relativeLabel } from "@/lib/homeos/dates";
import { useHomeOS } from "@/lib/homeos/store";
import { getRoomNextAction } from "@/lib/homeos/suggestions";
import {
  ROOM_COMPLETE_STATUSES,
  ROOM_IN_PROGRESS_STATUSES,
  ROOM_ITEM_STATUSES,
  type Room,
  type RoomItem,
  type RoomItemStatus,
} from "@/lib/homeos/types";
import { cn } from "@/lib/utils";

const GBP = (n: number) =>
  `£${n.toLocaleString("en-GB", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

function statusTone(status: RoomItemStatus): "green" | "amber" | "blue" | "grey" {
  if (ROOM_COMPLETE_STATUSES.includes(status)) return "green";
  if (status === "Idea" || status === "Need to Buy") return "grey";
  if (ROOM_IN_PROGRESS_STATUSES.includes(status)) {
    return status === "Comparing" || status === "Returning" ? "blue" : "amber";
  }
  return "grey";
}

const QUICK_STATUSES: RoomItemStatus[] = [
  "Ordered",
  "Delivered",
  "Assembling",
  "Installed",
  "Returning",
  "Returned",
  "Complete",
];

function returnSoon(item: RoomItem): boolean {
  return (
    isWithinDays(item.returnDeadline, 7) &&
    item.status !== "Returned" &&
    item.status !== "Complete"
  );
}

export function RoomOps() {
  const { data, updateRoomItem, deleteRoomItem, addTodayAction } = useHomeOS();
  const items = data.roomItems;

  const [search, setSearch] = React.useState("");
  const [roomFilter, setRoomFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [retailerFilter, setRetailerFilter] = React.useState<string>("all");
  const [assemblyOnly, setAssemblyOnly] = React.useState(false);
  const [installerOnly, setInstallerOnly] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const rooms = React.useMemo(
    () => Array.from(new Set(items.map((i) => i.room))) as Room[],
    [items],
  );
  const retailers = React.useMemo(
    () =>
      Array.from(
        new Set(
          items.map((i) => i.retailer).filter((r): r is string => !!r),
        ),
      ).sort(),
    [items],
  );

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      if (q) {
        const hay = [i.name, i.brand, i.itemType, i.retailer, i.room]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (roomFilter !== "all" && i.room !== roomFilter) return false;
      if (statusFilter !== "all" && i.status !== statusFilter) return false;
      if (retailerFilter !== "all" && i.retailer !== retailerFilter) return false;
      if (assemblyOnly && !i.assemblyRequired) return false;
      if (installerOnly && !i.installerNeeded) return false;
      return true;
    });
  }, [items, search, roomFilter, statusFilter, retailerFilter, assemblyOnly, installerOnly]);

  const selected = React.useMemo(
    () => items.find((i) => i.id === selectedId) ?? null,
    [items, selectedId],
  );

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <Header />
        <HomeEmpty message="No room items yet. Add furniture, returns, and setup tasks to start planning your home." />
      </div>
    );
  }

  const totalSpend = getRoomSpend(items);
  const overall = getRoomCompletion(items);
  const returnsSoon = items.filter(returnSoon).length;

  return (
    <div className="space-y-8">
      <Header />

      {/* Top-line stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Items" value={items.length} icon={Boxes} />
        <StatCard
          label="Total spend"
          value={GBP(totalSpend)}
          icon={PoundSterling}
          tone="primary"
        />
        <StatCard
          label="Completion"
          value={`${overall.percentage}%`}
          hint={`${overall.complete}/${overall.total} done`}
          icon={CheckCircle2}
          tone="green"
        />
        <StatCard
          label="Returns soon"
          value={returnsSoon}
          hint="within 7 days"
          icon={RotateCcw}
          tone={returnsSoon > 0 ? "red" : "default"}
        />
      </div>

      {/* Room overview */}
      <Section
        title="Room overview"
        description="Progress, spend, and the next move for each room."
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rooms.map((room) => (
            <RoomCard
              key={room}
              room={room}
              items={items}
            />
          ))}
        </div>
      </Section>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items…"
            className="pl-9"
          />
        </div>
        <Select
          value={roomFilter}
          onChange={(e) => setRoomFilter(e.target.value)}
          className="w-auto min-w-[140px]"
        >
          <option value="all">All rooms</option>
          {rooms.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-auto min-w-[140px]"
        >
          <option value="all">All statuses</option>
          {ROOM_ITEM_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Select
          value={retailerFilter}
          onChange={(e) => setRetailerFilter(e.target.value)}
          className="w-auto min-w-[140px]"
          disabled={retailers.length === 0}
        >
          <option value="all">All retailers</option>
          {retailers.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
        <Button
          type="button"
          variant={assemblyOnly ? "default" : "outline"}
          size="sm"
          onClick={() => setAssemblyOnly((v) => !v)}
        >
          <Hammer className="size-4" /> Assembly
        </Button>
        <Button
          type="button"
          variant={installerOnly ? "default" : "outline"}
          size="sm"
          onClick={() => setInstallerOnly((v) => !v)}
        >
          <Wrench className="size-4" /> Installer
        </Button>
      </div>

      {/* Furnishing pipeline */}
      <Section
        title="Furnishing pipeline"
        description="Move items along their lifecycle as you plan, buy, and set up."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {ROOM_ITEM_STATUSES.map((status) => {
            const colItems = filtered.filter((i) => i.status === status);
            return (
              <div
                key={status}
                className="flex flex-col gap-2 rounded-xl border bg-muted/30 p-3"
              >
                <div className="flex items-center justify-between">
                  <StatusPill label={status} tone={statusTone(status)} />
                  <span className="text-xs font-medium text-muted-foreground">
                    {colItems.length}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {colItems.length === 0 ? (
                    <p className="py-2 text-center text-xs text-muted-foreground">
                      —
                    </p>
                  ) : (
                    colItems.map((item) => (
                      <PipelineCard
                        key={item.id}
                        item={item}
                        onOpen={() => setSelectedId(item.id)}
                        onMove={(s) => updateRoomItem(item.id, { status: s })}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* All items grid */}
      <Section
        title="All items"
        description={`${filtered.length} of ${items.length} shown.`}
      >
        {filtered.length === 0 ? (
          <HomeEmpty message="No items match your filters." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onClick={() => setSelectedId(item.id)}
              />
            ))}
          </div>
        )}
      </Section>

      <ItemDrawer
        item={selected}
        onClose={() => setSelectedId(null)}
        onStatus={(s) => selected && updateRoomItem(selected.id, { status: s })}
        onNote={(note) => selected && updateRoomItem(selected.id, { notes: note })}
        onDelete={() => {
          if (selected) {
            deleteRoomItem(selected.id);
            setSelectedId(null);
          }
        }}
        onAddToday={() => {
          if (!selected) return;
          addTodayAction({
            title: `Sort ${selected.name} (${selected.room})`,
            source: "HomeOS",
            sourceModule: "RoomOps",
            linkedEntityType: "roomItem",
            linkedEntityId: selected.id,
            priority: "Normal",
            estimatedMinutes: 15,
            status: "Not Started",
          });
        }}
      />
    </div>
  );
}

function Header() {
  return (
    <div>
      <h2 className="font-display text-2xl font-bold tracking-tight">RoomOps</h2>
      <p className="text-sm text-muted-foreground">
        Plan rooms, track furniture, returns, warranties, and setup.
      </p>
    </div>
  );
}

function RoomCard({ room, items }: { room: Room; items: RoomItem[] }) {
  const roomItems = items.filter((i) => i.room === room);
  const spend = getRoomSpend(items, room);
  const c = getRoomCompletion(items, room);
  const returnsSoon = roomItems.filter(returnSoon).length;
  const nextAction = getRoomNextAction(items, room);

  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span>{room}</span>
          <Badge variant="secondary">{roomItems.length} items</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-0">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total spend</span>
          <span className="font-semibold">{GBP(spend)}</span>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Completion</span>
            <span className="font-medium">{c.percentage}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${c.percentage}%` }}
            />
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            <span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                {c.complete}
              </span>{" "}
              complete
            </span>
            <span>
              <span className="font-medium text-amber-600 dark:text-amber-400">
                {c.inProgress}
              </span>{" "}
              in progress
            </span>
            <span>
              <span className="font-medium">{c.needed}</span> needed
            </span>
          </div>
        </div>

        {returnsSoon > 0 && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400">
            <RotateCcw className="size-3.5" />
            {returnsSoon} return deadline{returnsSoon > 1 ? "s" : ""} soon
          </div>
        )}

        <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs">
          <span className="font-medium text-foreground">Next action: </span>
          <span className="text-muted-foreground">{nextAction}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function PipelineCard({
  item,
  onOpen,
  onMove,
}: {
  item: RoomItem;
  onOpen: () => void;
  onMove: (status: RoomItemStatus) => void;
}) {
  return (
    <div className="rounded-lg border bg-background p-2.5 shadow-sm">
      <button
        type="button"
        onClick={onOpen}
        className="block w-full text-left text-sm font-medium leading-tight hover:text-primary"
      >
        {item.name}
      </button>
      <p className="mt-0.5 truncate text-xs text-muted-foreground">
        {item.room}
        {item.price != null ? ` · ${GBP(item.price)}` : ""}
      </p>
      <Select
        value={item.status}
        onChange={(e) => onMove(e.target.value as RoomItemStatus)}
        onClick={(e) => e.stopPropagation()}
        className="mt-2 h-8 text-xs"
        aria-label={`Move ${item.name}`}
      >
        {ROOM_ITEM_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </Select>
    </div>
  );
}

function ItemCard({ item, onClick }: { item: RoomItem; onClick: () => void }) {
  const soon = returnSoon(item);
  return (
    <Card
      onClick={onClick}
      className="cursor-pointer transition-colors hover:bg-accent/40"
    >
      <CardContent className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-semibold leading-tight">{item.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {item.room}
              {item.itemType ? ` · ${item.itemType}` : ""}
            </p>
          </div>
          <StatusPill label={item.status} tone={statusTone(item.status)} />
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {item.brand && <span>{item.brand}</span>}
          {item.retailer && <span>{item.retailer}</span>}
          {item.price != null && (
            <span className="font-medium text-foreground">{GBP(item.price)}</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          {item.deliveryDate && (
            <span className="text-muted-foreground">
              Delivery {relativeLabel(item.deliveryDate)}
            </span>
          )}
          {item.returnDeadline && (
            <span
              className={cn(
                "font-medium",
                soon
                  ? "text-red-600 dark:text-red-400"
                  : "text-muted-foreground",
              )}
            >
              Return {relativeLabel(item.returnDeadline)}
            </span>
          )}
          {item.warrantyEndDate && (
            <span className="text-muted-foreground">
              Warranty {relativeLabel(item.warrantyEndDate)}
            </span>
          )}
        </div>

        {(item.assemblyRequired || item.installerNeeded) && (
          <div className="flex flex-wrap gap-1.5">
            {item.assemblyRequired && (
              <Badge variant="secondary" className="gap-1">
                <Hammer className="size-3" /> Assembly
              </Badge>
            )}
            {item.installerNeeded && (
              <Badge variant="secondary" className="gap-1">
                <Wrench className="size-3" /> Installer
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ItemDrawer({
  item,
  onClose,
  onStatus,
  onNote,
  onDelete,
  onAddToday,
}: {
  item: RoomItem | null;
  onClose: () => void;
  onStatus: (status: RoomItemStatus) => void;
  onNote: (note: string) => void;
  onDelete: () => void;
  onAddToday: () => void;
}) {
  const [note, setNote] = React.useState("");
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  React.useEffect(() => {
    setNote(item?.notes ?? "");
    setConfirmDelete(false);
  }, [item?.id, item?.notes]);

  if (!item) return null;
  const soon = returnSoon(item);

  return (
    <Drawer
      open={!!item}
      onClose={onClose}
      title={item.name}
      footer={
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant={confirmDelete ? "destructive" : "outline"}
            size="sm"
            onClick={() => (confirmDelete ? onDelete() : setConfirmDelete(true))}
          >
            <Trash2 className="size-4" />
            {confirmDelete ? "Confirm delete" : "Delete"}
          </Button>
          <Button type="button" size="sm" onClick={onAddToday}>
            <Plus className="size-4" /> Add to Today
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <StatusPill label={item.status} tone={statusTone(item.status)} />
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Move to
          </p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_STATUSES.map((s) => (
              <Button
                key={s}
                type="button"
                size="sm"
                variant={item.status === s ? "default" : "outline"}
                onClick={() => onStatus(s)}
              >
                {s}
              </Button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border">
          <DetailRow label="Room" value={item.room} />
          <DetailRow label="Item type" value={item.itemType} />
          <DetailRow label="Brand" value={item.brand} />
          <DetailRow label="Retailer" value={item.retailer} />
          <DetailRow
            label="Price"
            value={item.price != null ? GBP(item.price) : undefined}
          />
          <DetailRow label="Priority" value={item.priority} />
          <DetailRow label="Colour" value={item.colour} />
          <DetailRow label="Dimensions" value={item.dimensions} />
          <DetailRow
            label="Order date"
            value={item.orderDate ? formatDate(item.orderDate) : undefined}
          />
          <DetailRow
            label="Delivery date"
            value={
              item.deliveryDate
                ? `${formatDate(item.deliveryDate)} (${relativeLabel(item.deliveryDate)})`
                : undefined
            }
          />
          <DetailRow
            label="Return deadline"
            value={
              item.returnDeadline ? (
                <span className={soon ? "text-red-600 dark:text-red-400" : undefined}>
                  {formatDate(item.returnDeadline)} ({relativeLabel(item.returnDeadline)})
                </span>
              ) : undefined
            }
          />
          <DetailRow
            label="Warranty ends"
            value={
              item.warrantyEndDate
                ? `${formatDate(item.warrantyEndDate)} (${relativeLabel(item.warrantyEndDate)})`
                : undefined
            }
          />
          <DetailRow
            label="Assembly required"
            value={item.assemblyRequired ? "Yes" : undefined}
          />
          <DetailRow
            label="Installer needed"
            value={item.installerNeeded ? "Yes" : undefined}
          />
        </div>

        <Field label="Notes">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => {
              if (note !== (item.notes ?? "")) onNote(note);
            }}
            placeholder="Add a note…"
          />
        </Field>
      </div>
    </Drawer>
  );
}
