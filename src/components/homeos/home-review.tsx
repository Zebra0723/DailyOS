"use client";

import * as React from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useHomeOS } from "@/lib/homeos/store";
import { getHomeReviewSummary } from "@/lib/homeos/suggestions";
import { Drawer } from "@/components/homeos/ui";
import { MODULE_LABEL } from "@/components/homeos/tabs";
import { Button } from "@/components/ui/button";

export function HomeReview({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data, addTodayAction } = useHomeOS();
  const review = React.useMemo(() => getHomeReviewSummary(data), [data]);

  const blocks: { title: string; items: string[] }[] = [
    { title: "What needs attention today", items: review.attentionToday },
    { title: "Money risks", items: review.moneyRisks },
    { title: "Home logistics", items: review.homeLogistics },
    { title: "Room setup", items: review.roomSetup },
    { title: "Device risks", items: review.deviceRisks },
  ];

  return (
    <Drawer open={open} onClose={onClose} title="HomeOS Review">
      <div className="space-y-6">
        {blocks.map((b) => (
          <div key={b.title}>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {b.title}
            </h3>
            {b.items.length === 0 ? (
              <p className="mt-1.5 text-sm text-muted-foreground">All clear.</p>
            ) : (
              <ul className="mt-1.5 space-y-1.5">
                {b.items.map((it, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                    {it}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}

        <div>
          <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Recommended next 5 actions
          </h3>
          <div className="mt-2 grid gap-2">
            {review.nextActions.map((a, i) => {
              const sent = data.todayActions.some((t) => t.title === a.title);
              return (
                <div key={i} className="rounded-lg border p-3">
                  <p className="text-sm font-medium">{a.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.reason} · {MODULE_LABEL[a.sourceModule]} · ~{a.estimatedMinutes} min · {a.priority}
                  </p>
                  <Button
                    size="sm"
                    variant={sent ? "secondary" : "outline"}
                    disabled={sent}
                    className="mt-2"
                    onClick={() =>
                      addTodayAction({
                        title: a.title,
                        source: "HomeOS",
                        sourceModule: a.sourceModule,
                        linkedEntityType: a.linkedEntityType,
                        linkedEntityId: a.linkedEntityId,
                        priority: a.priority,
                        estimatedMinutes: a.estimatedMinutes,
                        status: "Not Started",
                      })
                    }
                  >
                    {sent ? (
                      <>
                        <CheckCircle2 className="size-4" /> Sent to Today
                      </>
                    ) : (
                      <>
                        Add to DailyOS Today <ArrowRight className="size-4" />
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
            {review.nextActions.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nothing pressing right now.
              </p>
            )}
          </div>
        </div>
      </div>
    </Drawer>
  );
}
