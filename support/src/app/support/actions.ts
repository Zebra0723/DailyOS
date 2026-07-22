"use server";

import { requireAdminUser } from "@/lib/admin-server";
import { createServiceClient } from "@/lib/supabase/service";
import { isOwner, OWNER_EMAIL } from "@/lib/owner";
import { emailConfigured, ownerNotifyHtml, replyEmailHtml, sendEmail } from "@/lib/email";

const REPLY_SUBJECT = "Re: your DailyOS feedback";

/** Absolute link to the Approvals queue, best-effort from the site URL env. */
function approvalsUrl(): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  return base ? `${base}/support/approvals` : "/support/approvals";
}

/**
 * Draft a reply to a piece of feedback.
 *  - Owner: the reply is approved and emailed immediately (no self-approval).
 *  - Any other admin (e.g. Leo): the reply is queued as `pending` and the owner
 *    is notified by email to review it. Nothing is sent to the person yet.
 */
export async function createReply(
  feedbackId: string,
  body: string,
): Promise<{ ok: boolean; message: string }> {
  const user = await requireAdminUser();
  const author = (user.email ?? "").toLowerCase();
  const text = body.trim();
  if (!text) return { ok: false, message: "Write a reply first." };

  const admin = createServiceClient();
  const fb = await admin
    .from("feedback")
    .select("email,message")
    .eq("id", feedbackId)
    .single();
  if (fb.error || !fb.data) return { ok: false, message: "Couldn't find that feedback." };

  const to = (fb.data.email ?? "").trim();
  if (!to) return { ok: false, message: "No email on this feedback to reply to." };

  if (isOwner(author)) {
    const result = await sendEmail({ to, subject: REPLY_SUBJECT, html: replyEmailHtml(text) });
    const ins = await admin.from("feedback_replies").insert({
      feedback_id: feedbackId,
      author_email: author,
      to_email: to,
      body: text,
      status: "approved",
      sent: result.ok,
      send_error: result.ok ? null : result.error ?? (result.skipped ? "Email not configured" : null),
      decided_by: author,
      decided_at: new Date().toISOString(),
    });
    if (ins.error) return { ok: false, message: ins.error.message };
    if (result.ok) return { ok: true, message: "Reply sent." };
    if (result.skipped)
      return { ok: true, message: "Saved as approved — email isn't configured, so send it manually." };
    return { ok: true, message: `Saved, but sending failed: ${result.error}` };
  }

  // Non-owner: queue for approval, don't send to the person.
  const ins = await admin.from("feedback_replies").insert({
    feedback_id: feedbackId,
    author_email: author,
    to_email: to,
    body: text,
    status: "pending",
    sent: false,
  });
  if (ins.error) return { ok: false, message: ins.error.message };

  // Best-effort notify the owner (never blocks the queue on email).
  await sendEmail({
    to: OWNER_EMAIL,
    subject: "Leo drafted a reply — approve it in Support",
    html: ownerNotifyHtml({
      author,
      recipient: to,
      feedbackMessage: fb.data.message ?? "",
      draft: text,
      approvalsUrl: approvalsUrl(),
    }),
  });

  return emailConfigured()
    ? { ok: true, message: "Sent for approval — the owner has been emailed to review it." }
    : { ok: true, message: "Queued for approval — the owner will see it in Approvals." };
}

export async function setResolved(id: string, resolved: boolean): Promise<{ ok: boolean }> {
  await requireAdminUser();
  const admin = createServiceClient();
  await admin.from("feedback").update({ resolved }).eq("id", id);
  return { ok: true };
}

export async function deleteFeedback(id: string): Promise<{ ok: boolean }> {
  await requireAdminUser();
  const admin = createServiceClient();
  await admin.from("feedback").delete().eq("id", id);
  return { ok: true };
}

export async function setResolvedMany(
  ids: string[],
  resolved: boolean,
): Promise<{ ok: boolean; count: number }> {
  await requireAdminUser();
  if (ids.length === 0) return { ok: true, count: 0 };
  const admin = createServiceClient();
  await admin.from("feedback").update({ resolved }).in("id", ids);
  return { ok: true, count: ids.length };
}

export async function deleteFeedbackMany(
  ids: string[],
): Promise<{ ok: boolean; count: number }> {
  await requireAdminUser();
  if (ids.length === 0) return { ok: true, count: 0 };
  const admin = createServiceClient();
  await admin.from("feedback").delete().in("id", ids);
  return { ok: true, count: ids.length };
}
