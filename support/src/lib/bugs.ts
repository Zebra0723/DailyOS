import { createServiceClient } from "@/lib/supabase/service";

/** A single in-app bug report. Mirrors the `bug_reports` table columns. */
export interface BugReport {
  id: string;
  user_id: string | null;
  email: string | null;
  description: string;
  page_url: string | null;
  user_agent: string | null;
  app_version: string | null;
  status: string;
  created_at: string;
}

/** Load bug reports safely. Never throws — the page renders a graceful
 *  message when the table is missing or a query fails. Newest first, capped. */
export async function loadBugReports(): Promise<{ items: BugReport[]; error: string | null }> {
  const admin = createServiceClient();
  try {
    const res = await admin
      .from("bug_reports")
      .select("id,user_id,email,description,page_url,user_agent,app_version,status,created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (res.error) return { items: [], error: res.error.message };
    return { items: (res.data ?? []) as BugReport[], error: null };
  } catch (e) {
    return { items: [], error: e instanceof Error ? e.message : String(e) };
  }
}

/** Count of still-open bug reports. Best-effort — returns 0 if the table is
 *  missing so the sidebar badge never breaks the page. */
export async function openBugCount(): Promise<number> {
  const admin = createServiceClient();
  try {
    const res = await admin
      .from("bug_reports")
      .select("id", { count: "exact", head: true })
      .eq("status", "open");
    return res.count ?? 0;
  } catch {
    return 0;
  }
}
