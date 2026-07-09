"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Type,
  Trash2,
  Loader2,
  CheckCircle2,
  Check,
  ListChecks,
  Bookmark,
  X,
} from "lucide-react";
import { StatusBadge } from "@/components/badges";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  deleteInboxItem,
  bulkDeleteInbox,
  bulkSetInboxHandled,
  setInboxBookmarked,
} from "@/app/(app)/inbox/actions";
import { relativeDay, cn } from "@/lib/utils";
import type { InboxItem } from "@/lib/types";

export function InboxList({ items }: { items: InboxItem[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [selecting, setSelecting] = React.useState(false);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [busy, setBusy] = React.useState(false);

  const allSelected = items.length > 0 && selected.size === items.length;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exitSelect() {
    setSelecting(false);
    setSelected(new Set());
  }

  async function bulkDelete() {
    const ids = [...selected];
    if (!ids.length) return;
    if (
      !window.confirm(
        `Delete ${ids.length} item${ids.length > 1 ? "s" : ""}? Tasks and events you approved from them are kept. This cannot be undone.`,
      )
    )
      return;
    setBusy(true);
    const res = await bulkDeleteInbox(ids);
    setBusy(false);
    if (res.ok) {
      toast({ variant: "success", title: `Deleted ${res.count} item${res.count > 1 ? "s" : ""}` });
      exitSelect();
      router.refresh();
    } else {
      toast({ variant: "error", title: "Couldn't delete", description: res.error });
    }
  }

  async function bulkHandled() {
    const ids = [...selected];
    if (!ids.length) return;
    setBusy(true);
    const res = await bulkSetInboxHandled(ids, true);
    setBusy(false);
    if (res.ok) {
      toast({ variant: "success", title: `Marked ${res.count} handled` });
      exitSelect();
      router.refresh();
    } else {
      toast({ variant: "error", title: "Couldn't update", description: res.error });
    }
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-3 flex items-center justify-between">
        {selecting ? (
          <>
            <button
              onClick={() =>
                setSelected(allSelected ? new Set() : new Set(items.map((i) => i.id)))
              }
              className="text-sm font-medium text-primary hover:underline"
            >
              {allSelected ? "Clear all" : "Select all"}
            </button>
            <span className="text-sm text-muted-foreground">
              {selected.size} selected
            </span>
          </>
        ) : (
          <>
            <span className="text-sm text-muted-foreground">
              {items.length} item{items.length > 1 ? "s" : ""}
            </span>
            <button
              onClick={() => setSelecting(true)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ListChecks className="size-4" /> Select
            </button>
          </>
        )}
      </div>

      <div className="grid gap-3">
        {items.map((item) => (
          <Row
            key={item.id}
            item={item}
            selecting={selecting}
            selected={selected.has(item.id)}
            onToggle={() => toggle(item.id)}
            onDeleted={() => router.refresh()}
          />
        ))}
      </div>

      {/* Sticky bulk action bar */}
      {selecting && (
        <div className="sticky bottom-4 z-30 mt-4 flex items-center gap-2 rounded-2xl border bg-popover/95 p-2 shadow-elevated backdrop-blur">
          <Button
            size="sm"
            variant="outline"
            onClick={bulkHandled}
            disabled={busy || selected.size === 0}
          >
            <CheckCircle2 className="size-4" /> Mark handled
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={bulkDelete}
            disabled={busy || selected.size === 0}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            Delete
          </Button>
          <Button size="sm" variant="ghost" onClick={exitSelect} className="ml-auto">
            <X className="size-4" /> Done
          </Button>
        </div>
      )}
    </div>
  );
}

function Row({
  item,
  selecting,
  selected,
  onToggle,
  onDeleted,
}: {
  item: InboxItem;
  selecting: boolean;
  selected: boolean;
  onToggle: () => void;
  onDeleted: () => void;
}) {
  const { toast } = useToast();
  const [deleting, setDeleting] = React.useState(false);
  const [bookmarked, setBookmarked] = React.useState(!!item.bookmarked);

  async function toggleBookmark() {
    const next = !bookmarked;
    setBookmarked(next); // optimistic
    const res = await setInboxBookmarked(item.id, next);
    if (res.ok) {
      toast({
        variant: "success",
        title: next ? "Bookmarked — it's on Today" : "Bookmark removed",
      });
      onDeleted(); // refreshes the list + Today
    } else {
      setBookmarked(!next); // revert
      toast({ variant: "error", title: "Couldn't update bookmark" });
    }
  }

  const inner = (
    <Card
      className={cn(
        "flex items-center gap-4 p-4 pr-20 transition-colors",
        selecting ? "cursor-pointer" : "hover:bg-accent/40",
        selected && "border-primary bg-accent/40",
      )}
    >
      {selecting && (
        <span
          className={cn(
            "grid size-5 shrink-0 place-items-center rounded-md border",
            selected ? "border-primary bg-primary text-primary-foreground" : "border-input",
          )}
        >
          {selected && <Check className="size-3.5" />}
        </span>
      )}
      <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
        {item.input_type === "file" ? (
          <FileText className="size-5" />
        ) : (
          <Type className="size-5" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{item.title}</p>
        <p className="truncate text-sm text-muted-foreground">
          {item.summary ?? "Awaiting review"}
        </p>
      </div>
      <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
        <StatusBadge status={item.status} />
        <span className="text-xs text-muted-foreground">
          {relativeDay(item.created_at)}
        </span>
      </div>
      <div className="shrink-0 sm:hidden">
        <StatusBadge status={item.status} />
      </div>
    </Card>
  );

  async function onDelete() {
    if (deleting) return;
    if (
      !window.confirm(
        "Delete this inbox item? Any tasks and events you approved from it will stay. This cannot be undone.",
      )
    )
      return;
    setDeleting(true);
    const res = await deleteInboxItem(item.id);
    if (res.ok) {
      toast({ variant: "success", title: "Item deleted" });
      onDeleted();
    } else {
      toast({ variant: "error", title: "Couldn't delete" });
      setDeleting(false);
    }
  }

  return (
    <div className="relative">
      {selecting ? (
        <button type="button" onClick={onToggle} className="block w-full text-left">
          {inner}
        </button>
      ) : (
        <>
          <Link href={`/inbox/${item.id}`}>{inner}</Link>
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
            <button
              type="button"
              onClick={toggleBookmark}
              aria-label={bookmarked ? "Remove bookmark" : "Bookmark item"}
              title={bookmarked ? "Bookmarked — showing on Today" : "Bookmark (show on Today)"}
              className={cn(
                "grid size-8 place-items-center rounded-lg transition-colors hover:bg-accent",
                bookmarked
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Bookmark className={cn("size-4", bookmarked && "fill-current")} />
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              aria-label="Delete item"
              title="Delete item"
              className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
            >
              {deleting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
