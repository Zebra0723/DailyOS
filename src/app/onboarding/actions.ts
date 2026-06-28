"use server";

import { createClient } from "@/lib/supabase/server";
import type { Onboarding } from "@/lib/onboarding";

export async function saveOnboarding(
  data: Onboarding & { name?: string },
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not authenticated" };

  const metadata: Record<string, unknown> = {
    onboarding: {
      persona: data.persona,
      focus: data.focus,
      tone: data.tone,
      done: true,
    },
  };
  if (data.name?.trim()) metadata.username = data.name.trim();

  const { error } = await supabase.auth.updateUser({ data: metadata });
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}
