"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function AskDailyOSWidget() {
  return (
    <Card>
      <CardContent className="space-y-3 pt-5">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Sparkles className="size-4 text-primary" />
          <p className="text-sm">Ask anything about your day, tasks, or events.</p>
        </div>
        <Button asChild className="w-full">
          <Link href="/assistant">
            <Sparkles className="size-4" />
            Ask DailyOS
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
