import "server-only";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";

// Every discount in DailyOS is a Stripe promotion code — created here, redeemed
// on the Stripe checkout page (checkout already sets allow_promotion_codes). A
// promotion code is a customer-facing code that points at a coupon (the actual
// discount rule). We create the coupon + the code together so callers only ever
// deal in codes.

export type PromoDuration =
  | { kind: "once" }
  | { kind: "forever" }
  | { kind: "repeating"; months: number };

export interface PromoSpec {
  /** Percent off, 1–100. Provide this OR amountOffPence. */
  percentOff?: number;
  /** Fixed amount off in pence (GBP). Provide this OR percentOff. */
  amountOffPence?: number;
  /** How long the discount lasts once redeemed. */
  duration: PromoDuration;
  /** Optional custom code (e.g. "LAUNCH20"). Uppercased. Stripe generates one if omitted. */
  code?: string;
  /** Cap total redemptions across all customers. */
  maxRedemptions?: number;
  /** Unix seconds after which the code can no longer be redeemed. */
  expiresAt?: number;
  /** Restrict to first-time customers only. */
  firstTimeOnly?: boolean;
  /** Internal note stored on the coupon (shows in the Stripe dashboard). */
  note?: string;
}

export type PromoResult =
  | { ok: true; code: string; promotionCodeId: string; couponId: string }
  | { ok: false; error: string };

/**
 * Create a Stripe coupon + promotion code in one call. Returns the redeemable
 * code string. No-ops with a clear error when Stripe isn't configured, so the
 * admin UI can show "card payments aren't switched on yet" instead of throwing.
 */
export async function createStripePromoCode(spec: PromoSpec): Promise<PromoResult> {
  const stripe = getStripe();
  if (!stripe) {
    return { ok: false, error: "Stripe isn't configured (STRIPE_SECRET_KEY is not set)." };
  }

  // Exactly one of percentOff / amountOffPence.
  const hasPercent = typeof spec.percentOff === "number";
  const hasAmount = typeof spec.amountOffPence === "number";
  if (hasPercent === hasAmount) {
    return { ok: false, error: "Set exactly one of a percent or a fixed amount off." };
  }
  if (hasPercent && (spec.percentOff! < 1 || spec.percentOff! > 100)) {
    return { ok: false, error: "Percent off must be between 1 and 100." };
  }
  if (hasAmount && spec.amountOffPence! < 1) {
    return { ok: false, error: "Amount off must be at least 1p." };
  }

  const couponParams: Stripe.CouponCreateParams = {
    duration:
      spec.duration.kind === "repeating"
        ? "repeating"
        : spec.duration.kind === "forever"
          ? "forever"
          : "once",
    ...(spec.duration.kind === "repeating"
      ? { duration_in_months: Math.max(1, Math.round(spec.duration.months)) }
      : {}),
    ...(hasPercent
      ? { percent_off: spec.percentOff }
      : { amount_off: Math.round(spec.amountOffPence!), currency: "gbp" }),
    ...(spec.note ? { name: spec.note.slice(0, 40) } : {}),
    ...(spec.maxRedemptions ? { max_redemptions: spec.maxRedemptions } : {}),
  };

  try {
    const coupon = await stripe.coupons.create(couponParams);

    const promoParams: Stripe.PromotionCodeCreateParams = {
      promotion: { type: "coupon", coupon: coupon.id },
      ...(spec.code ? { code: spec.code.trim().toUpperCase() } : {}),
      ...(spec.maxRedemptions ? { max_redemptions: spec.maxRedemptions } : {}),
      ...(spec.expiresAt ? { expires_at: spec.expiresAt } : {}),
      ...(spec.firstTimeOnly
        ? { restrictions: { first_time_transaction: true } }
        : {}),
    };
    const promo = await stripe.promotionCodes.create(promoParams);

    return {
      ok: true,
      code: promo.code,
      promotionCodeId: promo.id,
      couponId: coupon.id,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Stripe rejected the request.";
    return { ok: false, error: message };
  }
}

export interface RecentPromoCode {
  id: string;
  code: string;
  active: boolean;
  discount: string;
  duration: string;
  timesRedeemed: number;
  maxRedemptions: number | null;
  createdISO: string;
}

/** Recent promotion codes, newest first, for the admin list. */
export async function listRecentPromoCodes(limit = 25): Promise<RecentPromoCode[]> {
  const stripe = getStripe();
  if (!stripe) return [];
  try {
    const res = await stripe.promotionCodes.list({
      limit: Math.min(Math.max(limit, 1), 100),
      expand: ["data.promotion.coupon"],
    });
    return res.data.map((p) => {
      const c =
        p.promotion && typeof p.promotion.coupon === "object"
          ? p.promotion.coupon
          : null;
      const discount = c?.percent_off
        ? `${c.percent_off}% off`
        : c?.amount_off
          ? `£${(c.amount_off / 100).toFixed(2)} off`
          : "—";
      const duration =
        c?.duration === "repeating"
          ? `${c.duration_in_months} mo`
          : c?.duration === "forever"
            ? "forever"
            : "once";
      return {
        id: p.id,
        code: p.code,
        active: p.active,
        discount,
        duration,
        timesRedeemed: p.times_redeemed,
        maxRedemptions: p.max_redemptions ?? null,
        createdISO: new Date(p.created * 1000).toISOString(),
      };
    });
  } catch {
    return [];
  }
}
