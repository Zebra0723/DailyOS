"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Type, Trash2, Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/badges";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { deleteInboxItem } from "@/app/(app)/inbox/actions";
import { relativeDay } from "@/lib/utils";
import type { InboxItem } from "@/lib/types";

/** A single Life Inbox row: opens the item, with a quick delete on the right.
 *  The delete button sits outside the Link (a sibling) so we never nest a
 *  button inside an anchor. */
export function InboxRow({ item }: { item: InboxItem }) {
  const router = useRouter();
  const { toast } = useToast();
  const [deleting, setDeleting] = React.useState(false);

  async function onDelete() {
    if (deleting) return;
    if (
      !window.confirm(
        "Delete this inbox item? Any tasks and events you approved from it will stay. This cannot be undone.",
      )
    )
      return;
    setDeleting(true);
    try {
      const res = await deleteInboxItem(item.id);
      if (res.ok) {
        toast({ variant: "success", title: "Item deleted" });
        router.refresh();
      } else {
        toast({ variant: "error", title: "Couldn't delete", description: res.error });
        setDeleting(false);
      }
    } catch {
      toast({ variant: "error", title: "Couldn't delete" });
      setDeleting(false);
    }
  }

  return (
    <div className="relative">
      <Link href={`/inbox/${item.id}`}>
        <Card className="flex items-center gap-4 p-4 pr-14 transition-colors hover:bg-accent/40">
          <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
            {item.input_type === "file" ? (
              <FileText className="size-5" />
            ) : (
              <Type className="size-5" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate font-medium">{item.title}</p>
            </div>
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
      </Link>
      <button
        type="button"
        onClick={onDelete}
        disabled={deleting}
        aria-label="Delete item"
        title="Delete item"
        className="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
      >
        {deleting ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Trash2 className="size-4" />
        )}
      </button>
    </div>
  );
}
