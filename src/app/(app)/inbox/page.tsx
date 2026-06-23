import Link from "next/link";
import { Inbox as InboxIcon, Plus, FileText, Type } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge, ItemTypeBadge } from "@/components/badges";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { relativeDay } from "@/lib/utils";
import type { InboxItem } from "@/lib/types";

export const metadata = { title: "Inbox · DailyOS" };

export default async function InboxPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("inbox_items")
    .select("*")
    .order("created_at", { ascending: false });

  const items = (data ?? []) as InboxItem[];

  return (
    <div>
      <PageHeader
        title="Life Inbox"
        description="Everything you've dropped in. We read it and suggest what to do."
        action={
          <Button asChild>
            <Link href="/inbox/new">
              <Plus className="size-4" />
              Add to Inbox
            </Link>
          </Button>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={InboxIcon}
          title="Your inbox is empty"
          description="Drop in a receipt, booking, school letter or screenshot and DailyOS will turn it into tasks, events and a tidy vault entry."
          actionLabel="Add your first item"
          actionHref="/inbox/new"
        />
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <Link key={item.id} href={`/inbox/${item.id}`}>
              <Card className="flex items-center gap-4 p-4 transition-colors hover:bg-accent/40">
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
          ))}
        </div>
      )}
    </div>
  );
}
