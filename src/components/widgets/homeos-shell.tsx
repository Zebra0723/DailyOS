"use client";

// Shared chrome for the HomeOS dashboard widgets: one card, one loading state,
// one "nothing here yet" state, so eight widgets don't reinvent all three.

import * as React from "react";
import Link from "next/link";
import { Loader2, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function HomeWidgetShell({
  title,
  icon: Icon,
  href,
  linkLabel = "Open",
  loading,
  empty,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  linkLabel?: string;
  loading?: boolean;
  /** Message to show instead of children when there's nothing to report. */
  empty?: string | null;
  children?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="size-4 text-primary" /> {title}
        </CardTitle>
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          {linkLabel} <ArrowRight className="size-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        ) : empty ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

/** A compact labelled number, used across the HomeOS widgets. */
export function MiniStat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  tone?: "default" | "primary" | "amber" | "red" | "green";
}) {
  const toneClass = {
    default: "text-foreground",
    primary: "text-primary",
    amber: "text-amber-600 dark:text-amber-400",
    red: "text-red-600 dark:text-red-400",
    green: "text-emerald-600 dark:text-emerald-400",
  }[tone];
  return (
    <div className="rounded-lg border p-3">
      <p className={cn("text-xl font-semibold tabular-nums", toneClass)}>{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

/** One clickable row in a widget list. */
export function HomeRow({
  href,
  title,
  meta,
  trailing,
}: {
  href: string;
  title: string;
  meta?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:border-primary/40"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        {meta && <p className="truncate text-xs text-muted-foreground">{meta}</p>}
      </div>
      {trailing}
    </Link>
  );
}

/** £ with no decimals — matches the HomeOS dashboard's existing formatting. */
export function gbp(n: number): string {
  return `£${n.toFixed(0)}`;
}
