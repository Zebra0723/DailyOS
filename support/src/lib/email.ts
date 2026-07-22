// Transactional email for DailyOS Support, server-only.
//
// Mirrors the main app's approach: it talks to Resend's HTTP API directly (no
// SDK, nothing to install). Until both env vars are present it no-ops and
// reports { skipped: true }, so the approval workflow never breaks waiting on
// email being wired up.
//
//   RESEND_API_KEY  — from https://resend.com (API Keys)
//   EMAIL_FROM      — a verified sender, e.g. "DailyOS <hello@yourdomain.com>"

type SendResult = { ok: boolean; skipped: boolean; error?: string };

/** True only when both Resend env vars are set. */
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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** The actual reply we send to the person who left feedback. */
export function replyEmailHtml(body: string): string {
  const safe = escapeHtml(body).replace(/\n/g, "<br/>");
  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1c1a17">
    <p style="font-size:15px;line-height:1.6;color:#1c1a17;margin:0 0 16px">${safe}</p>
    <p style="font-size:13px;line-height:1.5;color:#8a8073;margin:24px 0 0;border-top:1px solid #e6ded2;padding-top:12px">
      — The DailyOS team
    </p>
  </div>`;
}

/** Notifies the owner that a non-owner admin drafted a reply awaiting approval. */
export function ownerNotifyHtml(opts: {
  author: string;
  recipient: string;
  feedbackMessage: string;
  draft: string;
  approvalsUrl: string;
}): string {
  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1c1a17">
    <h1 style="font-size:20px;margin:0 0 12px">A reply is waiting for your approval</h1>
    <p style="font-size:15px;line-height:1.5;color:#6b6157;margin:0 0 16px">
      <strong>${escapeHtml(opts.author)}</strong> drafted a reply to
      <strong>${escapeHtml(opts.recipient)}</strong>. It won't be sent until you approve it.
    </p>
    <div style="border:1px solid #e6ded2;border-radius:12px;padding:14px 16px;background:#faf6f0;font-size:14px;margin-bottom:12px">
      <div style="font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#8a8073;margin-bottom:4px">Original feedback</div>
      <div style="color:#4b443b;white-space:pre-wrap">${escapeHtml(opts.feedbackMessage)}</div>
    </div>
    <div style="border:1px solid #e6c9bd;border-radius:12px;padding:14px 16px;background:#f7ece4;font-size:14px">
      <div style="font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#bf502b;margin-bottom:4px">Drafted reply</div>
      <div style="color:#1c1a17;white-space:pre-wrap">${escapeHtml(opts.draft)}</div>
    </div>
    <a href="${opts.approvalsUrl}" style="display:inline-block;margin-top:18px;background:#bf502b;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:11px 20px;border-radius:10px">
      Review in Support
    </a>
  </div>`;
}
