"use server";

import { createClient } from "@/lib/supabase/server";
import { makeFeedToken } from "@/lib/calendar-feed";
import { SITE_URL } from "@/lib/site";

/** Returns the caller's private calendar-feed URL. The client only calls this
 *  for Pro accounts (gated by usePlan), so the token isn't emitted otherwise. */
export async function getCalendarFeedUrl(): Promise<{
  ok: boolean;
  url?: string;
}> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  return {
    ok: true,
    url: `${SITE_URL}/api/calendar/feed?token=${makeFeedToken(user.id)}`,
  };
}
