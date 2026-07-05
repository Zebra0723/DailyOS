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

/** The 10%-off reward both parties earn when a referral converts. */
export const REFERRAL_REWARD_CODE = "DAILYOSFRIEND10";

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://daily-os-lac.vercel.app";

function rewardEmail(opts: { heading: string; intro: string }): string {
  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1c1a17">
    <h1 style="font-size:20px;margin:0 0 12px">${opts.heading}</h1>
    <p style="font-size:15px;line-height:1.5;color:#5b544b;margin:0 0 20px">${opts.intro}</p>
    <div style="border:1px dashed #c9beb0;border-radius:12px;padding:18px;text-align:center;background:#faf6f0">
      <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#8a8175">Your code — 10% off</div>
      <div style="font-size:24px;font-weight:700;letter-spacing:.05em;margin-top:6px">${REFERRAL_REWARD_CODE}</div>
    </div>
    <p style="font-size:14px;line-height:1.5;color:#5b544b;margin:20px 0 0">
      Enter it at checkout on your next plan. Thanks for spreading DailyOS around.
    </p>
    <a href="${SITE}/subscriptions" style="display:inline-block;margin-top:20px;background:#b4633a;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:11px 20px;border-radius:10px">
      Open DailyOS
    </a>
  </div>`;
}

/**
 * Email both parties in a converted referral their 10%-off code. Best-effort:
 * a missing address or unconfigured provider is skipped, never thrown.
 */
export async function sendReferralRewards(opts: {
  referrerEmail?: string | null;
  referredEmail?: string | null;
}): Promise<{ referrer: SendResult; referred: SendResult }> {
  const referrer = opts.referrerEmail
    ? await sendEmail({
        to: opts.referrerEmail,
        subject: "Your referral just subscribed — here's 10% off 🎉",
        html: rewardEmail({
          heading: "A friend you invited just went paid.",
          intro:
            "Nice one. Because someone you referred subscribed to DailyOS, here's 10% off your own plan.",
        }),
      })
    : { ok: false, skipped: true };

  const referred = opts.referredEmail
    ? await sendEmail({
        to: opts.referredEmail,
        subject: "Welcome to DailyOS — here's your 10% off",
        html: rewardEmail({
          heading: "Thanks for joining through a friend.",
          intro:
            "You came in on a referral, so here's 10% off. Your friend gets the same — enjoy DailyOS.",
        }),
      })
    : { ok: false, skipped: true };

  return { referrer, referred };
}
