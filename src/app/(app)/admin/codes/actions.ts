"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/admin-user";
import {
  createStripePromoCode,
  type PromoDuration,
} from "@/lib/stripe-promo";

export type GenerateInput = {
  discountKind: "percent" | "amount";
  /** Percent (1-100) or amount in pounds, depending on discountKind. */
  value: number;
  durationKind: "once" | "forever" | "repeating";
  durationMonths?: number;
  code?: string;
  maxRedemptions?: number;
  /** Days from now until the code expires (0 = never). */
  expiresInDays?: number;
  firstTimeOnly?: boolean;
};

export async function generateStripeCode(
  input: GenerateInput,
): Promise<{ ok: boolean; code?: string; error?: string }> {
  // Admin guard — server-controlled metadata only.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminUser(user)) {
    return { ok: false, error: "Unauthorized." };
  }

  const duration: PromoDuration =
    input.durationKind === "repeating"
      ? { kind: "repeating", months: Math.max(1, Math.round(input.durationMonths ?? 1)) }
      : input.durationKind === "forever"
        ? { kind: "forever" }
        : { kind: "once" };

  const expiresAt =
    input.expiresInDays && input.expiresInDays > 0
      ? Math.floor(Date.now() / 1000) + Math.round(input.expiresInDays) * 86_400
      : undefined;

  const res = await createStripePromoCode({
    ...(input.discountKind === "percent"
      ? { percentOff: Math.round(input.value) }
      : { amountOffPence: Math.round(input.value * 100) }),
    duration,
    code: input.code?.trim() || undefined,
    maxRedemptions:
      input.maxRedemptions && input.maxRedemptions > 0
        ? Math.round(input.maxRedemptions)
        : undefined,
    expiresAt,
    firstTimeOnly: input.firstTimeOnly,
    note: `Admin code by ${user.email ?? user.id}`,
  });

  if (!res.ok) return { ok: false, error: res.error };

  revalidatePath("/admin/codes");
  return { ok: true, code: res.code };
}
