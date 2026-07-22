import { createServiceClient } from "@/lib/supabase/service";

export type AdminMessage = {
  id: string;
  author_email: string;
  body: string;
  read_by: string[] | null;
  created_at: string;
};

/** Newest ~200 messages, returned oldest → newest for the thread view. */
export async function loadMessages(): Promise<AdminMessage[]> {
  const admin = createServiceClient();
  const { data, error } = await admin
    .from("admin_messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error || !data) return [];
  return (data as AdminMessage[]).slice().reverse();
}

/** Best-effort count of messages from the OTHER admin the current one hasn't read.
 *  Degrades to 0 if the table/column isn't reachable. */
export async function countUnread(email: string): Promise<number> {
  try {
    const admin = createServiceClient();
    const { data, error } = await admin
      .from("admin_messages")
      .select("author_email, read_by")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error || !data) return 0;
    return (data as { author_email: string; read_by: unknown }[]).filter((m) => {
      if (m.author_email === email) return false;
      const arr = Array.isArray(m.read_by) ? (m.read_by as string[]) : [];
      return !arr.includes(email);
    }).length;
  } catch {
    return 0;
  }
}
