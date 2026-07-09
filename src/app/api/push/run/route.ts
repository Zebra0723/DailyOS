import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { pushConfigured, sendOnce } from "@/lib/push-server";
import { REWARD_CODE_TTL_DAYS, describeReward } from "@/lib/referral-rewards";

// Runs on a schedule (Vercel Cron, see vercel.json) and pushes the day's nudges:
//   • reminders you set — tasks due today or overdue
//   • upcoming events — anything starting in the next 24 hours
//   • reward codes about to expire — unless you ignored them in Today
// Every send is de-duped via push_log, so re-running is safe and never spams.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// How soon before a reward code lapses we start nudging.
const CODE_WARN_DAYS = 7;
const DAY = 86_400_000;

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  // If no secret is configured, allow it (dev / manual).
  if (!secret) return true;
  // Accept the secret two ways so any cron service can call it:
  //   1. Authorization: Bearer <secret>  (Vercel Cron / GitHub Actions send this)
  //   2. ?key=<secret> in the URL         (easiest for external crons — no header)
  if (req.headers.get("authorization") === `Bearer ${secret}`) return true;
  const url = new URL(req.url);
  const key = url.searchParams.get("key") ?? url.searchParams.get("secret");
  return key === secret;
}

/** The set of reward codes this user dismissed in the Today nudge (best-effort;
 *  they're mirrored from the device to user_state under the device-state key). */
async function ignoredCodes(
  admin: ReturnType<typeof createServiceClient>,
  userId: string,
): Promise<Set<string>> {
  try {
    const { data } = await admin
      .from("user_state")
      .select("value")
      .eq("user_id", userId)
      .eq("key", "device-state")
      .maybeSingle();
    const map = (data?.value ?? {}) as Record<string, string>;
    const out = new Set<string>();
    for (const [k, v] of Object.entries(map)) {
      if (!k.startsWith("dailyos-ignored-codes")) continue;
      try {
        for (const code of JSON.parse(v)) if (typeof code === "string") out.add(code);
      } catch {
        /* ignore malformed */
      }
    }
    return out;
  } catch {
    return new Set();
  }
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!pushConfigured()) {
    return NextResponse.json({ ok: false, error: "push-not-configured" });
  }

  const admin = createServiceClient();
  const now = Date.now();
  const todayYmd = new Date(now).toISOString().slice(0, 10);
  const nowIso = new Date(now).toISOString();
  const graceIso = new Date(now - DAY).toISOString(); // don't fire reminders >24h late

  // Only users who actually opted in have subscriptions — process just those.
  const { data: subRows } = await admin
    .from("push_subscriptions")
    .select("user_id");
  const userIds = Array.from(new Set((subRows ?? []).map((r) => r.user_id)));

  let sent = 0;

  for (const uid of userIds) {
    // 1) Reminders you set — tasks due today or overdue.
    const { data: tasks } = await admin
      .from("extracted_tasks")
      .select("id,title,due_date")
      .eq("user_id", uid)
      .eq("status", "pending")
      .lte("due_date", todayYmd);
    for (const t of tasks ?? []) {
      const overdue = (t.due_date as string) < todayYmd;
      const ok = await sendOnce(uid, `task-due:${t.id}`, {
        title: overdue ? "Overdue reminder" : "Reminder due today",
        body: t.title as string,
        url: "/today",
        tag: `task-${t.id}`,
      });
      if (ok) sent++;
    }

    // 2) Event reminders — the user picked a lead time; remind_at is the exact
    //    instant to fire. Window: due now, but skip ones we're >24h late on.
    const { data: events } = await admin
      .from("calendar_events")
      .select("id,title,start_time,remind_at")
      .eq("user_id", uid)
      .not("remind_at", "is", null)
      .lte("remind_at", nowIso)
      .gte("remind_at", graceIso);
    for (const e of events ?? []) {
      const hhmm = (e.start_time as string).slice(11, 16); // floating wall-clock
      const ok = await sendOnce(uid, `event-remind:${e.id}`, {
        title: "Reminder",
        body: `${e.title as string} — ${hhmm}`,
        url: "/calendar",
        tag: `event-${e.id}`,
      });
      if (ok) sent++;
    }

    // 3) Reward codes about to expire — unless ignored in Today.
    const { data: codes } = await admin
      .from("reward_codes")
      .select("code,kind,percent,plan_tier,plan_days,created_at")
      .eq("recipient_id", uid)
      .eq("used", false);
    if (codes && codes.length > 0) {
      const ignored = await ignoredCodes(admin, uid);
      for (const c of codes) {
        if (ignored.has(c.code as string)) continue;
        const expiresAt = Date.parse(c.created_at as string) + REWARD_CODE_TTL_DAYS * DAY;
        const daysLeft = Math.ceil((expiresAt - now) / DAY);
        if (daysLeft > CODE_WARN_DAYS || daysLeft < 0) continue; // not yet / already gone
        const reward =
          c.kind === "plan"
            ? {
                kind: "plan" as const,
                tier: c.plan_tier === "pro" ? ("pro" as const) : ("plus" as const),
                days: c.plan_days ?? 0,
              }
            : { kind: "discount" as const, percent: c.percent ?? 10 };
        const ok = await sendOnce(uid, `code-expiring:${c.code}`, {
          title: `Reward expiring in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`,
          body: `${describeReward(reward)} — claim it before it's gone.`,
          url: "/subscriptions#reward-codes",
          tag: `code-${c.code}`,
        });
        if (ok) sent++;
      }
    }
  }

  return NextResponse.json({ ok: true, users: userIds.length, sent });
}
