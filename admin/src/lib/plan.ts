import type { User } from "@supabase/supabase-js";

/** A user's REAL current tier: a plan whose plan_exp has passed is free again,
 *  exactly as the DailyOS app resolves it. (plan_exp is ms; null = lifetime.) */
export function effectiveTier(u: User): "free" | "plus" | "pro" {
  const meta = u.user_metadata ?? {};
  const raw = (meta.tier as string) ?? (meta.plan as string) ?? "free";
  if (raw !== "plus" && raw !== "pro") return "free";
  const exp = meta.plan_exp;
  const expMs = exp == null ? 0 : Number(exp);
  if (expMs > 0 && Date.now() > expMs) return "free"; // lapsed
  return raw;
}
