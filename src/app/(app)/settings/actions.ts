"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getAIProvider, getAIDiagnostics } from "@/lib/ai/provider";
import { testAdminPush, type AdminPushDiagnostics } from "@/lib/admin-notify";

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

export interface AITestResult {
  ok: boolean;
  configured: boolean;
  model: string;
  host: string;
  error?: string;
  sample?: string;
}

/**
 * Diagnose "Ask DailyOS" from Settings: actually calls the AI provider and
 * reports the REAL result — a bad key, no billing/quota, a wrong model name or
 * a timeout all show their true error here, instead of the generic
 * "I can't reach the AI right now" the chat falls back to.
 */
export async function testAIConnection(): Promise<AITestResult> {
  await requireUser();
  const diag = getAIDiagnostics();
  const base = { configured: diag.configured, model: diag.model, host: diag.host };

  if (!diag.configured) {
    return {
      ...base,
      ok: false,
      error: diag.keyLooksLikeSupabase
        ? "AI_PROVIDER_API_KEY looks like a Supabase key (sb_…). Set it to your OpenAI (or other provider) API key."
        : !diag.keyPresent
          ? "No AI key found. Set AI_PROVIDER_API_KEY in your Vercel project, then redeploy."
          : "AI is not configured. Check AI_PROVIDER_API_KEY, AI_MODEL and AI_PROVIDER_BASE_URL.",
    };
  }

  try {
    const reply = await getAIProvider().chat({
      json: true,
      timeoutMs: 12_000,
      messages: [
        {
          role: "user",
          content:
            'Reply with JSON only: {"reply":"pong"}. This is a connection test.',
        },
      ],
    });
    return { ...base, ok: true, sample: reply.slice(0, 160) };
  } catch (err) {
    return {
      ...base,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/** Admin diagnostic: check the feedback-alert push pipeline and fire a test. */
export async function testFeedbackAlert(): Promise<AdminPushDiagnostics> {
  const { user } = await requireUser();
  if ((user.user_metadata as { admin?: boolean } | null)?.admin !== true) {
    return {
      vapidConfigured: false,
      adminAccounts: 0,
      subscribedDevices: 0,
      delivered: 0,
      error: "Admin only.",
    };
  }
  return testAdminPush();
}

/** Export everything the user has stored, as a plain JSON object they can
 *  download. Read-only and RLS-scoped to their own rows. */
export async function exportMyData() {
  const { supabase, user } = await requireUser();
  // Fetch a whole table in pages so a heavy account isn't silently capped at
  // PostgREST's default 1000-row limit.
  async function all(table: string) {
    const out: unknown[] = [];
    const size = 1000;
    for (let from = 0; ; from += size) {
      const { data } = await supabase
        .from(table)
        .select("*")
        .range(from, from + size - 1);
      const rows = data ?? [];
      out.push(...rows);
      if (rows.length < size) break;
    }
    return out;
  }

  const [tasks, events, notes, inbox, vault] = await Promise.all([
    all("extracted_tasks"),
    all("calendar_events"),
    all("notes"),
    all("inbox_items"),
    all("vault_items"),
  ]);
  return {
    exported_at: new Date().toISOString(),
    account: { id: user.id, email: user.email },
    tasks,
    calendar_events: events,
    notes,
    inbox_items: inbox,
    vault_items: vault,
  };
}

/** Delete all of a user's content (keeps the account itself). */
export async function deleteAllData() {
  const { supabase, user } = await requireUser();
  // Delete every table explicitly rather than relying on a cascade, so nothing
  // (e.g. a vault row not linked to an inbox item) can survive.
  await supabase.from("extracted_tasks").delete().eq("user_id", user.id);
  await supabase.from("calendar_events").delete().eq("user_id", user.id);
  await supabase.from("notes").delete().eq("user_id", user.id);
  await supabase.from("vault_items").delete().eq("user_id", user.id);
  await supabase.from("processing_logs").delete().eq("user_id", user.id);
  await supabase.from("inbox_items").delete().eq("user_id", user.id);

  // Best-effort: remove stored files under the user's folder.
  const { data: files } = await supabase.storage
    .from("inbox-files")
    .list(user.id);
  if (files?.length) {
    await supabase.storage
      .from("inbox-files")
      .remove(files.map((f) => `${user.id}/${f.name}`));
  }

  return { ok: true as const };
}

/**
 * Permanently delete the account and all data. Requires the service-role key
 * to remove the auth user. Falls back gracefully if it isn't configured.
 */
export async function deleteAccount() {
  const { user } = await requireUser();
  await deleteAllData();

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      ok: false as const,
      error:
        "Account data was cleared, but deleting the login requires SUPABASE_SERVICE_ROLE_KEY to be set on the server.",
    };
  }

  const admin = createServiceClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}
