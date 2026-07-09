#!/usr/bin/env node
/**
 * DailyOS setup bot — automates the owner setup steps so you don't click through
 * dashboards. It:
 *   1. generates the secrets (VAPID push keys, CRON_SECRET),
 *   2. pushes env vars to Vercel,
 *   3. sets the CRON_SECRET GitHub Actions secret,
 *   4. runs the Supabase migrations.
 *
 * It shells out to the OFFICIAL CLIs, so auth/encryption is handled for you.
 * Install + log in once:
 *   npm i -g vercel   && vercel login   && vercel link
 *   (gh comes with GitHub CLI) gh auth login
 *   npm i -g supabase && supabase login && supabase link --project-ref <ref>
 *
 * Then:  node scripts/setup.mjs            # do everything it can
 *        node scripts/setup.mjs --print    # just generate + print secrets
 *
 * Optional values it will also push to Vercel if present in your environment:
 *   ADMIN_CODE, PRO_CODE, PLUS_CODE, FREE_CODE, VAPID_SUBJECT,
 *   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
 *   SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, EMAIL_FROM, ADMIN_EMAIL
 *
 * SECURITY: never hardcode tokens in this file or commit them. The CLIs read
 * their own tokens (from `vercel login` etc.); anything else comes from your
 * shell environment. Store secrets in a password manager.
 */
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import webpush from "web-push";

const PRINT_ONLY = process.argv.includes("--print");

function has(cmd) {
  try {
    execFileSync("bash", ["-lc", `command -v ${cmd}`], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}
function cli(file, args, input) {
  return execFileSync(file, args, {
    input,
    stdio: input ? ["pipe", "inherit", "inherit"] : "inherit",
    encoding: "utf8",
  });
}

// 1) Secrets ----------------------------------------------------------------
const vapid = webpush.generateVAPIDKeys();
const CRON_SECRET = randomBytes(24).toString("hex");

// Env vars to push. Generated ones + any optional ones you set in your shell.
const OPTIONAL = [
  "ADMIN_CODE", "PRO_CODE", "PLUS_CODE", "FREE_CODE", "VAPID_SUBJECT",
  "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY", "RESEND_API_KEY", "EMAIL_FROM", "ADMIN_EMAIL",
];
const env = {
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: vapid.publicKey,
  VAPID_PRIVATE_KEY: vapid.privateKey,
  CRON_SECRET,
  ...Object.fromEntries(
    OPTIONAL.filter((k) => process.env[k]).map((k) => [k, process.env[k]]),
  ),
};

console.log("\n🔑 Generated secrets (save these in your password manager):\n");
console.log(`  NEXT_PUBLIC_VAPID_PUBLIC_KEY = ${vapid.publicKey}`);
console.log(`  VAPID_PRIVATE_KEY            = ${vapid.privateKey}`);
console.log(`  CRON_SECRET                 = ${CRON_SECRET}\n`);

if (PRINT_ONLY) process.exit(0);

// 2) Vercel env -------------------------------------------------------------
if (has("vercel")) {
  console.log("▸ Pushing env vars to Vercel (production)…");
  for (const [key, value] of Object.entries(env)) {
    // Make it idempotent: remove then add, so re-running updates cleanly.
    try {
      cli("vercel", ["env", "rm", key, "production", "--yes"]);
    } catch {
      /* not set yet — fine */
    }
    try {
      cli("vercel", ["env", "add", key, "production"], value);
    } catch {
      console.log(`  ⚠ couldn't set ${key} — set it by hand`);
    }
  }
} else {
  console.log("▸ vercel CLI not found — skipping Vercel env. (npm i -g vercel)");
}

// 3) GitHub Actions secret --------------------------------------------------
if (has("gh")) {
  console.log("▸ Setting CRON_SECRET GitHub Actions secret…");
  try {
    cli("gh", ["secret", "set", "CRON_SECRET", "--body", CRON_SECRET]);
  } catch {
    console.log("  ⚠ couldn't set the GitHub secret — set it by hand");
  }
} else {
  console.log("▸ gh CLI not found — skipping GitHub secret.");
}

// 4) Supabase migrations ----------------------------------------------------
if (has("supabase")) {
  console.log("▸ Running Supabase migrations (supabase db push)…");
  try {
    cli("supabase", ["db", "push"]);
  } catch {
    console.log("  ⚠ migrations failed — is the project linked? (supabase link)");
  }
} else {
  console.log("▸ supabase CLI not found — skipping migrations.");
}

console.log("\n✅ Done. Redeploy on Vercel to pick up the new env vars.");
console.log(
  "   Still manual (Supabase dashboard): Auth → Site URL, SMTP, email templates.\n",
);
