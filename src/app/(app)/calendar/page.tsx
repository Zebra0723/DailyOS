import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { CalendarView } from "@/components/calendar-view";
import type { CalendarEvent } from "@/lib/types";

export const metadata = { title: "Calendar · DailyOS" };

export default async function CalendarPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data } = await supabase
    .from("calendar_events")
    .select("*")
    .order("start_time", { ascending: true });

  return (
    <div>
      <PageHeader
        title="Calendar"
        description="Every date in one place — your bookings and appointments, plus HomeOS renewals, deliveries and warranties."
      />
      <CalendarView
        events={(data ?? []) as CalendarEvent[]}
        userId={user?.id}
      />
    </div>
  );
}
