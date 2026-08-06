"use client";

import * as React from "react";
import Link from "next/link";
import { Bookmark, ArrowRight, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Item { id: string; title: string; summary: string | null }

export function BookmarksWidget() {
  const [items, setItems] = React.useState<Item[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("inbox_items")
        .select("id, title, summary")
        .eq("bookmarked", true)
        .order("created_at", { ascending: false })
        .limit(8);
      setItems((data as Item[]) ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bookmark className="size-4 fill-primary text-primary" /> Bookmarks
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="size-4 animate-spin text-muted-foreground" /></div>
        ) : items.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No bookmarks yet. Pin items from the Drop.</p>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {items.map((b) => (
              <Link key={b.id} href={`/inbox/${b.id}`} className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/40">
                <Bookmark className="size-4 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{b.title}</p>
                  {b.summary && <p className="truncate text-xs text-muted-foreground">{b.summary}</p>}
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
