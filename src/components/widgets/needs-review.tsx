"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWidgetLoad, WidgetLoadError } from "@/lib/widgets/use-widget-load";

interface Item { id: string; title: string; summary: string | null }

export function NeedsReviewWidget() {
  const [items, setItems] = React.useState<Item[]>([]);

  const { loading, failed, reload } = useWidgetLoad(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("inbox_items")
      .select("id, title, summary")
      .in("status", ["review", "failed"])
      .order("created_at", { ascending: false });
    setItems((data as Item[]) ?? []);
  });

  if (loading) return <Card><CardContent className="flex justify-center py-6"><Loader2 className="size-4 animate-spin text-muted-foreground" /></CardContent></Card>;
  if (failed) return <Card><CardContent className="py-2"><WidgetLoadError onRetry={reload} /></CardContent></Card>;
  if (items.length === 0) return <Card><CardContent className="py-6 text-center text-sm text-muted-foreground">Nothing to review right now.</CardContent></Card>;

  return (
    <Card className="border-amber-200 bg-amber-50/60 dark:border-amber-500/20 dark:bg-amber-500/5">
      <CardContent className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-500/15">
            <AlertTriangle className="size-5" />
          </div>
          <div>
            <p className="font-medium">{items.length} item{items.length > 1 ? "s" : ""} need your review</p>
            <p className="text-sm text-muted-foreground">Approve what DailyOS found.</p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/inbox/${items[0].id}`}>Review now <ArrowRight className="size-4" /></Link>
        </Button>
      </CardContent>
    </Card>
  );
}
