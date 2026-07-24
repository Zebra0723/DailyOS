"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { notifyAdmins } from "@/lib/admin-notify";

/** The shape the bug reporter modal submits. */
export interface BugReportInput {
  description: string;
  pageUrl?: string | null;
  userAgent?: string | null;
  appVersion?: string | null;
}

const DESC_LIMIT = 4000;
const META_LIMIT = 1000;

/**
 * Submit a bug report → lands in `public.bug_reports` (triaged in DailyOS
 * Support). Fills user_id/email from the session, captures the page URL,
 * user agent and app version, then push-notifies admins.
 */
export async function submitBugReport(
  input: BugReportInput,
): Promise<{ ok: boolean; error?: string }> {
  const description = (input.description ?? "").trim();
  if (!description) return { ok: false, error: "Describe the bug first." };

  const clip = (v: unknown, max: number) =>
    typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    const admin = createServiceClient();
    const { error } = await admin.from("bug_reports").insert({
      user_id: user?.id ?? null,
      email: user?.email ?? null,
      description: description.slice(0, DESC_LIMIT),
      page_url: clip(input.pageUrl, META_LIMIT),
      user_agent: clip(input.userAgent, META_LIMIT),
      app_version: clip(input.appVersion, META_LIMIT),
    });
    if (error) return { ok: false, error: error.message };

    // Alert the owner(s) on their devices that a bug just came in.
    const snippet =
      description.length > 140 ? `${description.slice(0, 140)}…` : description;
    await notifyAdmins({
      title: "🐛 New bug report",
      body: snippet,
      url: "/settings",
      tag: "bug",
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
