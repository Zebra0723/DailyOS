import { createServiceClient } from "@/lib/supabase/service";

/** A single drafted/sent reply. Mirrors `public.feedback_replies`. */
export interface Reply {
  id: string;
  feedback_id: string;
  author_email: string;
  to_email: string | null;
  body: string;
  status: "pending" | "approved" | "declined";
  sent: boolean;
  send_error: string | null;
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
}

/** Original feedback paired with a pending reply, for the Approvals queue. */
export interface PendingReplyView {
  reply: Reply;
  feedback: { id: string; email: string | null; message: string } | null;
}

const COLS =
  "id,feedback_id,author_email,to_email,body,status,sent,send_error,decided_by,decided_at,created_at";

/** Load every reply (newest first). Never throws. */
export async function loadReplies(): Promise<{ items: Reply[]; error: string | null }> {
  const admin = createServiceClient();
  try {
    const res = await admin
      .from("feedback_replies")
      .select(COLS)
      .order("created_at", { ascending: false })
      .limit(1000);
    if (res.error) return { items: [], error: res.error.message };
    return { items: (res.data ?? []) as Reply[], error: null };
  } catch (e) {
    return { items: [], error: e instanceof Error ? e.message : String(e) };
  }
}

/** All replies grouped by feedback id (newest first within each group). */
export async function loadRepliesGrouped(): Promise<{
  byFeedback: Record<string, Reply[]>;
  error: string | null;
}> {
  const { items, error } = await loadReplies();
  const byFeedback: Record<string, Reply[]> = {};
  for (const r of items) (byFeedback[r.feedback_id] ??= []).push(r);
  return { byFeedback, error };
}

/** Pending replies with their originating feedback, oldest first (FIFO queue). */
export async function loadPendingWithFeedback(): Promise<{
  items: PendingReplyView[];
  error: string | null;
}> {
  const admin = createServiceClient();
  try {
    const res = await admin
      .from("feedback_replies")
      .select(COLS)
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(500);
    if (res.error) return { items: [], error: res.error.message };
    const replies = (res.data ?? []) as Reply[];
    const ids = [...new Set(replies.map((r) => r.feedback_id))];
    const fbMap: Record<string, { id: string; email: string | null; message: string }> = {};
    if (ids.length) {
      const fb = await admin.from("feedback").select("id,email,message").in("id", ids);
      if (!fb.error) {
        for (const row of (fb.data ?? []) as { id: string; email: string | null; message: string }[]) {
          fbMap[row.id] = row;
        }
      }
    }
    return {
      items: replies.map((r) => ({ reply: r, feedback: fbMap[r.feedback_id] ?? null })),
      error: null,
    };
  } catch (e) {
    return { items: [], error: e instanceof Error ? e.message : String(e) };
  }
}

/** Count of replies awaiting the owner's decision (for the nav badge). */
export async function pendingReplyCount(): Promise<number> {
  const admin = createServiceClient();
  try {
    const res = await admin
      .from("feedback_replies")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
    return res.count ?? 0;
  } catch {
    return 0;
  }
}
