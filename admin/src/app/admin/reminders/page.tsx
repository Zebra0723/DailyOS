import { createServiceClient } from "@/lib/supabase/service";
import { ReminderList, type Reminder } from "./reminder-list";

export const dynamic = "force-dynamic";

export default async function RemindersPage() {
  const admin = createServiceClient();
  const { data, error } = await admin
    .from("admin_reminders")
    .select("*")
    .order("done", { ascending: true })
    .order("created_at", { ascending: false });

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px" }}>Reminders</h1>
      <p style={{ color: "#6b6157", fontSize: 14, margin: "0 0 20px" }}>
        A shared list for you and Leo — both admins see and edit the same reminders.
      </p>
      {error ? (
        <div style={{ background: "#fbe9e7", border: "1px solid #f0c4bd", borderRadius: 10, padding: 14, fontSize: 14 }}>
          The <code>admin_reminders</code> table isn&apos;t set up yet. Run the setup SQL
          (in the DailyOS chat) in Supabase, then refresh.
        </div>
      ) : (
        <ReminderList initial={(data ?? []) as Reminder[]} />
      )}
    </div>
  );
}
