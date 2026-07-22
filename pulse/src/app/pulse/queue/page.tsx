import { BellRing, Send } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/service";
import { MAIN_APP_URL } from "@/lib/main";
import { card, remindersDueSoon, upcomingPushes, rel } from "@/lib/pulse-data";
import { AutoRefresh } from "@/components/auto-refresh";

export const dynamic = "force-dynamic";

export default async function QueuePage() {
  const admin = createServiceClient();

  const [dueReminders, upcoming] = await Promise.all([
    remindersDueSoon(admin),
    upcomingPushes(admin),
  ]);

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Queue</h1>
          <p className="text-sm text-[#6b6157]">What DailyOS is about to send next.</p>
        </div>
        <AutoRefresh intervalSec={30} />
      </div>

      {/* Reminders due soon + Upcoming pushes */}
      <div className="grid gap-4 md:grid-cols-2">
        <section className={card}>
          <div className="flex items-center gap-2">
            <BellRing className="size-4" style={{ color: "#bf502b" }} />
            <h2 className="text-base font-bold">Reminders due soon</h2>
            <span className="ml-auto rounded-full bg-[#f2e6da] px-2 py-0.5 text-xs font-bold" style={{ color: "#bf502b" }}>
              {dueReminders?.length ?? "—"}
            </span>
          </div>
          {dueReminders === null ? (
            <p className="mt-3 text-sm text-[#8a8073]">—</p>
          ) : dueReminders.length === 0 ? (
            <p className="mt-3 text-sm text-[#8a8073]">No open reminders.</p>
          ) : (
            <ul className="mt-3 grid gap-2">
              {dueReminders.map((r, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <span className="flex-1 truncate" title={r.text}>{r.text}</span>
                  <span className="shrink-0 text-xs text-[#8a8073]">{rel(r.iso)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={card}>
          <div className="flex items-center gap-2">
            <Send className="size-4" style={{ color: "#bf502b" }} />
            <h2 className="text-base font-bold">Upcoming scheduled pushes</h2>
            <span className="ml-auto rounded-full bg-[#f2e6da] px-2 py-0.5 text-xs font-bold" style={{ color: "#bf502b" }}>
              {upcoming?.length ?? "—"}
            </span>
          </div>
          {upcoming === null ? (
            <p className="mt-3 text-sm text-[#8a8073]">—</p>
          ) : upcoming.length === 0 ? (
            <p className="mt-3 text-sm text-[#8a8073]">Nothing scheduled.</p>
          ) : (
            <ul className="mt-3 grid gap-2">
              {upcoming.map((u, i) => (
                <li key={i} className="text-sm">
                  <div className="flex items-center gap-2">
                    <span className="flex-1 truncate font-medium text-[#4b443b]" title={u.title}>{u.title}</span>
                    <span className="shrink-0 text-xs text-[#8a8073]">{rel(u.iso)}</span>
                  </div>
                  <div className="truncate text-xs text-[#8a8073]">→ {u.audience}</div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
