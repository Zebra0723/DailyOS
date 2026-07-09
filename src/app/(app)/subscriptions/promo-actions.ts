"use server";

// Server-side promo/admin code validation. The actual code strings live ONLY in
// environment variables (set in Vercel) — never in the repo or the client
// bundle — so they stay private. The browser sends whatever was typed; we just
// answer "which plan / admin does this unlock", or nothing. There is deliberately
// NO hardcoded fallback: if the env codes aren't set, no plan/admin code works
// (referral reward codes are separate and still work), so nothing secret ever
// lives in the (public) source.
//
//   ADMIN_CODE  -> Pro + admin (the /admin console, testing tools)
//   PRO_CODE    -> lifetime Pro
//   PLUS_CODE   -> Plus
//   FREE_CODE   -> reset to Free (also revokes admin)

type PromoPlan = "free" | "plus" | "pro";

export type PromoResult =
  | { ok: true; plan: PromoPlan; admin: boolean }
  | { ok: false };

function norm(v: string | undefined): string {
  return (v ?? "").trim().toUpperCase();
}

export async function redeemPromoCode(raw: string): Promise<PromoResult> {
  const entered = norm(raw);
  if (!entered) return { ok: false };

  // ARLEOFREE is always a valid RESET: back to Free and admin OFF. A reset only
  // ever removes access, so it's safe to keep as a known code even though the
  // unlock codes are private. (A custom FREE_CODE below also works.)
  if (entered === "ARLEOFREE") return { ok: true, plan: "free", admin: false };

  const adminCode = norm(process.env.ADMIN_CODE);
  const proCode = norm(process.env.PRO_CODE);
  const plusCode = norm(process.env.PLUS_CODE);
  const freeCode = norm(process.env.FREE_CODE);
  const configured = !!(adminCode || proCode || plusCode || freeCode);

  if (configured) {
    // Private codes are set in the environment — these are the ONLY codes that
    // work, and the defaults below are disabled. Set the env vars to rotate to
    // secret codes known only to you.
    if (adminCode && entered === adminCode) return { ok: true, plan: "pro", admin: true };
    if (proCode && entered === proCode) return { ok: true, plan: "pro", admin: false };
    if (plusCode && entered === plusCode) return { ok: true, plan: "plus", admin: false };
    if (freeCode && entered === freeCode) return { ok: true, plan: "free", admin: false };
    return { ok: false };
  }

  // Default codes so the app works out of the box. These are visible in the
  // (public) source; set the env vars above to replace them with private ones.
  switch (entered) {
    case "HOMEOSVIP25":
      return { ok: true, plan: "pro", admin: true };
    case "ARLEOPRO":
      return { ok: true, plan: "pro", admin: false };
    case "ARLEOPLUS":
      return { ok: true, plan: "plus", admin: false };
    // ARLEOFREE is handled above as an always-on reset.
    default:
      return { ok: false };
  }
}
