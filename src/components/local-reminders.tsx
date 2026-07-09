"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import {
  schedulable,
  fireDelayMs,
  reminderBody,
  reminderKey,
  LOCAL_WINDOW_MS,
  type UpcomingReminder,
} from "@/lib/reminders-local";

/**
 * Local reminder fallback. While the app is open, this schedules OS
 * notifications for your timed event reminders directly from the browser — so
 * reminders still arrive even when server push isn't configured or the cron is
 * misfiring. It uses the SAME notification tag the server uses (`event-<id>`),
 * so if both fire the OS collapses them and you never see a duplicate.
 *
 * Silent and best-effort: it does nothing unless notifications are already
 * granted, and every step is guarded. Renders nothing.
 */
const REFRESH_MS = 5 * 60 * 1000; // re-scan for newly-added reminders

export function LocalReminders() {
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || Notification.permission !== "granted") {
      return;
    }

    const timers = new Map<string, ReturnType<typeof setTimeout>>();
    let active = true;

    async function fire(r: UpcomingReminder) {
      const key = reminderKey(r.id, r.remind_at);
      try {
        if (localStorage.getItem(key)) return; // already fired this instant
      } catch {
        /* ignore */
      }
      const body = reminderBody(r.title, r.start_time);
      try {
        const reg = await navigator.serviceWorker?.ready;
        if (reg) {
          await reg.showNotification("Reminder", {
            body,
            tag: `event-${r.id}`,
            icon: "/apple-icon",
            data: { url: "/calendar" },
          });
        } else if (Notification.permission === "granted") {
          new Notification("Reminder", { body, tag: `event-${r.id}` });
        }
        try {
          localStorage.setItem(key, "1");
        } catch {
          /* ignore */
        }
      } catch {
        /* ignore */
      }
    }

    async function schedule() {
      try {
        const now = Date.now();
        const supabase = createClient();
        const { data, error } = await supabase
          .from("calendar_events")
          .select("id,title,start_time,remind_at")
          .not("remind_at", "is", null)
          .gte("remind_at", new Date(now - 60_000).toISOString())
          .lte("remind_at", new Date(now + LOCAL_WINDOW_MS).toISOString())
          .limit(50);
        if (!active || error || !data) return;

        for (const r of schedulable(data as UpcomingReminder[], now)) {
          const key = reminderKey(r.id, r.remind_at);
          if (timers.has(key)) continue; // already armed this session
          let alreadyFired = false;
          try {
            alreadyFired = !!localStorage.getItem(key);
          } catch {
            /* ignore */
          }
          if (alreadyFired) continue;
          const delay = fireDelayMs(r.remind_at, now);
          timers.set(
            key,
            setTimeout(() => {
              timers.delete(key);
              void fire(r);
            }, delay),
          );
        }
      } catch {
        /* ignore */
      }
    }

    void schedule();
    const interval = setInterval(schedule, REFRESH_MS);

    return () => {
      active = false;
      clearInterval(interval);
      for (const t of timers.values()) clearTimeout(t);
      timers.clear();
    };
  }, []);

  return null;
}
