import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyFeedToken } from "@/lib/calendar-feed";
import {
  buildICS,
  type FeedEvent,
  type FeedTask,
  type FeedHomeEvent,
} from "@/lib/ical";
import { getCalendarEvents } from "@/lib/homeos/calculations";
import type { HomeOSData } from "@/lib/homeos/types";

// HomeOS syncs its data to user_state under this key (see homeos/store.tsx).
const HOMEOS_STATE_KEY = "homeos-v1";

// Public iCalendar feed for a single user, authorised by a signed token in the
// URL (calendar apps can't send cookies). Uses the service client to read that
// user's rows.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token") ?? "";
  const userId = verifyFeedToken(token);
  if (!userId) {
    return new NextResponse("Invalid or missing feed token.", { status: 401 });
  }

  const supabase = createServiceClient();
  const [eventsRes, tasksRes, homeRes] = await Promise.all([
    supabase
      .from("calendar_events")
      .select("id,title,start_time,end_time,location,description")
      .eq("user_id", userId)
      .order("start_time", { ascending: true }),
    supabase
      .from("extracted_tasks")
      .select("id,title,due_date")
      .eq("user_id", userId)
      .eq("status", "pending")
      .not("due_date", "is", null),
    supabase
      .from("user_state")
      .select("value")
      .eq("user_id", userId)
      .eq("key", HOMEOS_STATE_KEY)
      .maybeSingle(),
  ]);

  // Derive HomeOS dates (renewals, deliveries, warranties, …) from the synced
  // HomeOS data, so the subscribed calendar shows them too — not just events.
  let homeEvents: FeedHomeEvent[] = [];
  try {
    const data = homeRes.data?.value as HomeOSData | undefined;
    if (data) {
      homeEvents = getCalendarEvents(data).map((e) => ({
        id: e.id,
        title: e.title,
        date: e.date,
      }));
    }
  } catch {
    /* malformed HomeOS state — just skip the home dates */
  }

  const ics = buildICS(
    (eventsRes.data ?? []) as FeedEvent[],
    (tasksRes.data ?? []) as FeedTask[],
    homeEvents,
  );

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="dailyos.ics"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}
