"use client";

import * as React from "react";
import Link from "next/link";
import { Inbox, Loader2, ArrowRight, Sun } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { useWidgetLoad, WidgetLoadError } from "@/lib/widgets/use-widget-load";

interface Item {
  id: string;
  title: string;
  summary: string | null;
  status: string;
  created_at: string;
}

export function RecentInboxWidget() {
  const [items, setItems] = React.useState<Item[]>([]);

  const { loading, failed, reload } = useWidgetLoad(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("inbox_items")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);
    setItems((data as Item[]) ?? []);
  });

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Inbox className="size-4 text-primary" /> Recently added
          </CardTitle>
          <CardDescription className="mt-1">From bookings to emails, sorted.</CardDescription>
        </div>
        <Link href="/inbox" className="shrink-0 text-sm text-muted-foreground hover:text-foreground">View the Drop</Link>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="size-4 animate-spin text-muted-foreground" /></div>
        ) : failed ? (
          <WidgetLoadError onRetry={reload} />
        ) : items.length === 0 ? (
          <EmptyState icon={Sun} title="Let's get started" description="Drop your first receipt, booking or screenshot into the Drop." actionLabel="Add your first item" actionHref="/inbox/new" />
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {items.map((item) => (
              <Link key={item.id} href={`/inbox/${item.id}`} className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/40">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{item.summary ?? "Awaiting review"}</p>
                </div>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
