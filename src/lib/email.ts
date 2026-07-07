// Transactional email, server-only.
//
// Uses Resend's HTTP API directly (no SDK dependency) so it works the moment
// two env vars are present — nothing to install. Until they're set it no-ops
// and reports { skipped: true }, so the rest of the app never breaks waiting on
// email being wired up.
//
//   RESEND_API_KEY  — from https://resend.com (API Keys)
//   EMAIL_FROM      — a verified sender, e.g. "DailyOS <hello@yourdomain.com>"

type SendResult = { ok: boolean; skipped: boolean; error?: string };

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

/**
 * Alert the owner that the admin code was entered on an account, with a
 * one-click link to suspend it. Sends to ADMIN_EMAIL; a no-op (skipped) until
 * ADMIN_EMAIL and the email provider are configured.
 */
export async function sendAdminCodeAlert(opts: {
  userEmail: string;
  userId: string;
  suspendUrl: string;
}): Promise<{ ok: boolean; skipped: boolean }> {
  const to = process.env.ADMIN_EMAIL;
  if (!to) return { ok: false, skipped: true };
  const html = `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1c1a17">
    <h1 style="font-size:20px;margin:0 0 12px">⚠️ Admin code used on DailyOS</h1>
    <p style="font-size:15px;line-height:1.5;color:#5b544b;margin:0 0 16px">
      The admin code was just entered on this account:
    </p>
    <div style="border:1px solid #e6ddd0;border-radius:12px;padding:14px 16px;background:#faf6f0;font-size:14px">
      <div><strong>Email:</strong> ${opts.userEmail}</div>
      <div style="color:#8a8175;margin-top:4px"><strong>Account ID:</strong> ${opts.userId}</div>
    </div>
    <p style="font-size:14px;line-height:1.5;color:#5b544b;margin:16px 0 0">
      If that wasn't expected, you can suspend the account. You'll be asked to
      confirm on the next screen — nothing happens just from opening the link.
    </p>
    <a href="${opts.suspendUrl}" style="display:inline-block;margin-top:18px;background:#c0392b;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:11px 20px;border-radius:10px">
      Suspend this account
    </a>
  </div>`;
  const res = await sendEmail({
    to,
    subject: "⚠️ DailyOS admin code was used",
    html,
  });
  return { ok: res.ok, skipped: res.skipped };
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string | string[];
  subject: string;
  html: string;
}): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) return { ok: false, skipped: true };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) {
      return { ok: false, skipped: false, error: `Resend ${res.status}` };
    }
    return { ok: true, skipped: false };
  } catch (err) {
    return {
      ok: false,
      skipped: false,
      error: err instanceof Error ? err.message : "send failed",
    };
  }
}

/** Legacy shared code — kept only as a fallback label if the reward_codes
 *  table hasn't been migrated yet. New rewards use unique single-use codes. */
export const REFERRAL_REWARD_CODE = "DAILYOSFRIEND10";

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://daily-os-lac.vercel.app";

function rewardEmail(opts: {
  heading: string;
  intro: string;
  rewardLabel: string;
  code: string;
}): string {
  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1c1a17">
    <h1 style="font-size:20px;margin:0 0 12px">${opts.heading}</h1>
    <p style="font-size:15px;line-height:1.5;color:#5b544b;margin:0 0 20px">${opts.intro}</p>
    <div style="border:1px dashed #c9beb0;border-radius:12px;padding:18px;text-align:center;background:#faf6f0">
      <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#8a8175">${opts.rewardLabel}</div>
      <div style="font-size:24px;font-weight:700;letter-spacing:.05em;margin-top:6px">${opts.code}</div>
    </div>
    <p style="font-size:14px;line-height:1.5;color:#5b544b;margin:20px 0 0">
      Redeem it on the Subscriptions page — in DailyOS, that's the top nav →
      Account → Subscription. It's your own one-time code, so keep it to yourself.
      Codes expire two months after they're issued.
    </p>
    <a href="${SITE}/subscriptions" style="display:inline-block;margin-top:20px;background:#b4633a;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:11px 20px;border-radius:10px">
      Redeem in DailyOS
    </a>
  </div>`;
}

/**
 * Email one person their unique reward code. Best-effort: a missing address or
 * an unconfigured provider is skipped, never thrown.
 */
export async function sendRewardEmail(opts: {
  to: string;
  audience: "friend" | "referrer";
  code: string;
  rewardLabel: string;
}): Promise<SendResult> {
  const friend = opts.audience === "friend";
  return sendEmail({
    to: opts.to,
    subject: friend
      ? "Welcome to DailyOS — here's your reward 🎁"
      : "You've earned a DailyOS reward 🎉",
    html: rewardEmail({
      heading: friend
        ? "Thanks for joining through a friend."
        : "A friend you invited just went paid.",
      intro: friend
        ? `You came in on a referral, so here's ${opts.rewardLabel}. Enjoy DailyOS.`
        : `Nice one — that's ${opts.rewardLabel} for spreading DailyOS around. Keep going for bigger rewards.`,
      rewardLabel: opts.rewardLabel,
      code: opts.code,
    }),
  });
}
