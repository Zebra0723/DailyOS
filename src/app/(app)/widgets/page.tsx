import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { ymdInTz, nowFloatingInTz } from "@/lib/dates-tz";
import { TZ_COOKIE } from "@/components/timezone-sync";
import { WidgetBoard } from "@/components/widgets/widget-board";
import type { CalendarEvent, ExtractedTask, InboxItem, Note } from "@/lib/types";

export const metadata = { title: "Widgets · DailyOS" };
export const dynamic = "force-dynamic";

export default async function WidgetsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // "Today" / "now" in the user's own timezone, matching how Today computes
  // due-date counts and event times. All reads are RLS-scoped to the signed-in
  // user (same as Today — the authed client only ever returns their rows).
  const tz = cookies().get(TZ_COOKIE)?.value
    ? decodeURIComponent(cookies().get(TZ_COOKIE)!.value)
    : "UTC";
  const todayStr = ymdInTz(new Date(), tz);
  const nowFloating = nowFloatingInTz(tz);

  const [eventsRes, tasksRes, recentRes, notesRes, unhandledRes] =
    await Promise.all([
      supabase
        .from("calendar_events")
        .select("*")
        .gte("start_time", nowFloating)
        .order("start_time", { ascending: true })
        .limit(4),
      supabase
        .from("extracted_tasks")
        .select("*")
        .eq("status", "pending")
        .lte("due_date", todayStr)
        .order("priority", { ascending: false })
        .limit(5),
      supabase
        .from("inbox_items")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(4),
      supabase
        .from("notes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(4),
      // Count of unhandled Drop items. Degrades to null count if the column
      // isn't present, in which case we fall back to the recent list length.
      supabase
        .from("inbox_items")
        .select("*", { count: "exact", head: true })
        .eq("handled", false),
    ]);

  const events = (eventsRes.data ?? []) as CalendarEvent[];
  const dueTasks = (tasksRes.data ?? []) as ExtractedTask[];
  const recentInbox = (recentRes.data ?? []) as InboxItem[];
  const notes = (notesRes.data ?? []) as Note[];
  const unhandledCount = unhandledRes.count ?? recentInbox.length;

  return (
    <WidgetBoard
      userId={user?.id ?? ""}
      data={{
        events,
        dueTasks,
        recentInbox,
        notes,
        unhandledCount,
      }}
    />
  );
}
