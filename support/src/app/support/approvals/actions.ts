"use server";

import { requireAdminUser } from "@/lib/admin-server";
import { isOwner } from "@/lib/owner";
import { createServiceClient } from "@/lib/supabase/service";
import { replyEmailHtml, sendEmail } from "@/lib/email";

const REPLY_SUBJECT = "Re: your DailyOS feedback";
const NOT_OWNER = "Only the owner can approve replies.";

/** Admin gate + owner gate. Returns the owner user, or null to refuse. */
async function requireOwner() {
  const user = await requireAdminUser();
  if (!isOwner(user.email)) return null;
  return user;
}

/**
 * Approve a pending reply and email it. Pass `overrideBody` to edit the text
 * before sending (Edit + Approve). When email isn't configured the reply is
 * still marked approved (sent=false) so the owner can send it via mailto.
 */
export async function approveReply(
  id: string,
  overrideBody?: string,
): Promise<{ ok: boolean; message: string }> {
  const user = await requireOwner();
  if (!user) return { ok: false, message: NOT_OWNER };

  const admin = createServiceClient();
  const row = await admin
    .from("feedback_replies")
    .select("to_email,body,status")
    .eq("id", id)
    .single();
  if (row.error || !row.data) return { ok: false, message: "Reply not found." };
  if (row.data.status !== "pending")
    return { ok: false, message: "That reply has already been decided." };

  const to = (row.data.to_email ?? "").trim();
  if (!to) return { ok: false, message: "No recipient email on this reply." };
  const body = (overrideBody ?? row.data.body).trim();
  if (!body) return { ok: false, message: "The reply body is empty." };

  const result = await sendEmail({ to, subject: REPLY_SUBJECT, html: replyEmailHtml(body) });
  const upd = await admin
    .from("feedback_replies")
    .update({
      body,
      status: "approved",
      sent: result.ok,
      send_error: result.ok ? null : result.error ?? (result.skipped ? "Email not configured" : null),
      decided_by: (user.email ?? "").toLowerCase(),
      decided_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "pending");
  if (upd.error) return { ok: false, message: upd.error.message };

  if (result.ok) return { ok: true, message: "Approved and sent." };
  if (result.skipped)
    return { ok: true, message: "Approved. Email isn't configured — use the mailto link to send it." };
  return { ok: true, message: `Approved, but sending failed: ${result.error}` };
}

/** Convenience: edit the text, then approve + send. */
export async function editAndApproveReply(
  id: string,
  newBody: string,
): Promise<{ ok: boolean; message: string }> {
  if (!newBody.trim()) return { ok: false, message: "Write a reply first." };
  return approveReply(id, newBody);
}

/** Decline a pending reply — nothing is ever sent. */
export async function declineReply(id: string): Promise<{ ok: boolean; message: string }> {
  const user = await requireOwner();
  if (!user) return { ok: false, message: NOT_OWNER };

  const admin = createServiceClient();
  const upd = await admin
    .from("feedback_replies")
    .update({
      status: "declined",
      decided_by: (user.email ?? "").toLowerCase(),
      decided_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "pending");
  if (upd.error) return { ok: false, message: upd.error.message };
  return { ok: true, message: "Declined — nothing was sent." };
}
