import { createServiceClient } from "@/lib/supabase/service";

/** A single feedback row. Mirrors the `feedback` table columns. */
export interface Feedback {
  id: string;
  email: string | null;
  message: string;
  resolved: boolean;
  created_at: string;
}

/** Load feedback safely. Never throws — data pages render a graceful
 *  message when the table is missing or a query fails. */
export async function loadFeedback(): Promise<{ items: Feedback[]; error: string | null }> {
  const admin = createServiceClient();
  try {
    const res = await admin
      .from("feedback")
      .select("id,email,message,resolved,created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (res.error) return { items: [], error: res.error.message };
    return { items: (res.data ?? []) as Feedback[], error: null };
  } catch (e) {
    return { items: [], error: e instanceof Error ? e.message : String(e) };
  }
}

/** Turn a raw Postgres error into the "create the table" hint when relevant. */
export function friendlyError(error: string): string {
  return error.includes("does not exist") || error.includes("schema cache")
    ? "The feedback table doesn't exist yet — create it from DailyOS Base → SQL → Apply setup."
    : error;
}
