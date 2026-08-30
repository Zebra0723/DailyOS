import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { adminApiAuthorized } from "@/lib/admin-api-auth";

// POST /api/admin/users/delete — wipe a user's data, or the whole account
// (token-authenticated, for the Cloudflare Worker).
//
// Body: { "userId": "<uuid>" } or { "email": "person@example.com" },
//       plus optional "mode": "account" (default — data + login) | "data"
//       (content only, login survives).
//
// Admin accounts are refused: a bot integration must not be able to delete
// the owners. Do that from the app's own admin area if ever needed.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CONTENT_TABLES = [
  "extracted_tasks",
  "calendar_events",
  "notes",
  "vault_items",
  "processing_logs",
  "inbox_items",
  "push_subscriptions",
  "user_state",
] as const;

type FoundUser = { id: string; email: string | null; isAdmin: boolean };

// "found" is exactly one user; "ambiguous" is >1 email match — deleting by
// email without confirming a single match is how the wrong account gets wiped.
type LookupResult =
  | { kind: "found"; user: FoundUser }
  | { kind: "none" }
  | { kind: "ambiguous" };

async function findUser(
  admin: ReturnType<typeof createServiceClient>,
  userId: string | null,
  email: string | null,
): Promise<LookupResult> {
  if (userId) {
    const { data } = await admin.auth.admin.getUserById(userId);
    const u = data?.user;
    if (!u) return { kind: "none" };
    return {
      kind: "found",
      user: { id: u.id, email: u.email ?? null, isAdmin: u.app_metadata?.admin === true },
    };
  }
  if (email) {
    const want = email.trim().toLowerCase();
    const matches: FoundUser[] = [];
    for (let page = 1; page <= 100; page++) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      const batch = data?.users ?? [];
      if (error || batch.length === 0) break;
      for (const u of batch) {
        if ((u.email ?? "").toLowerCase() === want) {
          matches.push({ id: u.id, email: u.email ?? null, isAdmin: u.app_metadata?.admin === true });
        }
      }
      if (batch.length < 1000) break;
    }
    if (matches.length === 0) return { kind: "none" };
    if (matches.length > 1) return { kind: "ambiguous" };
    return { kind: "found", user: matches[0] };
  }
  return { kind: "none" };
}

export async function POST(req: Request) {
  if (!adminApiAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid-json" }, { status: 400 });
  }

  const userId = typeof body.userId === "string" && body.userId ? body.userId : null;
  const email = typeof body.email === "string" && body.email ? body.email : null;
  const mode = body.mode === "data" ? "data" : "account";
  if (!userId && !email) {
    return NextResponse.json(
      { ok: false, error: "provide userId or email" },
      { status: 400 },
    );
  }

  const admin = createServiceClient();
  const lookup = await findUser(admin, userId, email);
  if (lookup.kind === "none") {
    return NextResponse.json({ ok: false, error: "user-not-found" }, { status: 404 });
  }
  if (lookup.kind === "ambiguous") {
    return NextResponse.json(
      { ok: false, error: "ambiguous-email-refusing" },
      { status: 409 },
    );
  }
  const target = lookup.user;
  if (target.isAdmin) {
    return NextResponse.json(
      { ok: false, error: "refused-admin-account" },
      { status: 403 },
    );
  }

  // Wipe content. Explicit per-table deletes (not a cascade) so nothing
  // survives; mirrors the in-app "delete all data" action.
  for (const table of CONTENT_TABLES) {
    try {
      await admin.from(table).delete().eq("user_id", target.id);
    } catch {
      /* table not migrated yet — nothing there to delete */
    }
  }

  // Best-effort: stored files under the user's folder.
  try {
    const { data: files } = await admin.storage.from("inbox-files").list(target.id);
    if (files?.length) {
      await admin.storage
        .from("inbox-files")
        .remove(files.map((f) => `${target.id}/${f.name}`));
    }
  } catch {
    /* storage unavailable — rows are gone, files are orphaned but inert */
  }

  if (mode === "account") {
    const { error } = await admin.auth.admin.deleteUser(target.id);
    if (error) {
      return NextResponse.json(
        { ok: false, error: `data cleared, login not deleted: ${error.message}` },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({
    ok: true,
    deleted: mode,
    userId: target.id,
    email: target.email,
  });
}
