"use server";

import { createClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/admin-user";
import { buildFeature } from "@/lib/ai/feature-builder";
import type { WidgetSpec } from "@/lib/widgets/spec";

export type BuildFeatureResponse =
  | { ok: true; spec: WidgetSpec; usedAI: boolean }
  | { ok: false; error: string };

/** A lapsed plan is free again — same rule the rest of the app uses. */
function effectiveTier(meta: Record<string, unknown> | undefined): string {
  const raw = (meta?.tier as string) ?? (meta?.plan as string) ?? "free";
  if (raw !== "plus" && raw !== "pro") return "free";
  const expMs = meta?.plan_exp == null ? 0 : Number(meta.plan_exp);
  if (expMs > 0 && Date.now() > expMs) return "free";
  return raw;
}

/**
 * Build a widget from a plain-English description.
 *
 * Pro-gated on the SERVER as well as in the UI — the client gate only decides
 * what to draw, and this action costs a model call, so it can't rely on it.
 */
export async function buildFeatureAction(
  description: string,
  existingIds: string[] = [],
): Promise<BuildFeatureResponse> {
  const prompt = (description ?? "").trim();
  if (prompt.length < 3) {
    return { ok: false, error: "Tell me a bit more about what you want to track." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You need to be signed in." };

  const tier = effectiveTier(user.user_metadata);
  if (tier !== "pro" && !isAdminUser(user)) {
    return { ok: false, error: "The AI Feature Builder is a Pro feature." };
  }

  try {
    const { spec, usedAI } = await buildFeature(prompt, {
      // Only ids are sent, never the user's widget contents.
      existingIds: existingIds.filter((id) => typeof id === "string").slice(0, 100),
    });
    return { ok: true, spec, usedAI };
  } catch {
    return { ok: false, error: "Couldn't build that one. Try describing it a different way." };
  }
}
