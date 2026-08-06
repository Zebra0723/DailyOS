"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, CalendarClock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuickAddTask } from "@/components/quick-add-task";

export function QuickAddWidget() {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <Card>
      <CardContent className="space-y-3 pt-5">
        <QuickAddTask dueDate={today} />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild className="flex-1">
            <Link href="/inbox/new"><Plus className="size-4" /> Drop an item</Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="flex-1">
            <Link href="/build-day"><CalendarClock className="size-4" /> Plan day</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
