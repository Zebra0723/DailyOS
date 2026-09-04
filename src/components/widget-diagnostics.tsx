"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { APP_VERSION } from "@/lib/version";

// TEMPORARY diagnostic. Surfaces WHY widgets do or don't load: the exact version
// actually running in the browser (to catch a stale service-worker cache), and
// the real result + timing of the Supabase calls the widgets depend on. Read the
// panel out and we can pinpoint the cause instead of guessing. Remove once the
// widget-loading issue is resolved.

type Check = { label: string; state: "run" | "ok" | "warn" | "fail"; detail: string };

async function timed<T>(fn: () => Promise<T>, ms: number): Promise<{ ok: boolean; t: number; value?: T; error?: string }> {
  const start = Date.now();
  try {
    const value = await Promise.race([
      fn(),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error(`timed out after ${ms}ms`)), ms)),
    ]);
    return { ok: true, t: Date.now() - start, value };
  } catch (e) {
    return { ok: false, t: Date.now() - start, error: e instanceof Error ? e.message : String(e) };
  }
}

export function WidgetDiagnostics() {
  const [checks, setChecks] = React.useState<Check[]>([]);
  const [open, setOpen] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    const results: Check[] = [];
    const push = (c: Check) => {
      if (!active) return;
      results.push(c);
      setChecks([...results]);
    };

    (async () => {
      // 1. Version actually running (vs. what Settings claims).
      push({ label: "App version running", state: "ok", detail: APP_VERSION });

      // 2. Env inlined into the client bundle.
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      let host = "MISSING";
      try { if (url) host = new URL(url).host; } catch { host = "invalid URL"; }
      push({
        label: "Supabase config",
        state: url && anon ? "ok" : "fail",
        detail: `${url ? host : "NEXT_PUBLIC_SUPABASE_URL missing"}${anon ? "" : " · ANON_KEY missing"}`,
      });

      if (!url || !anon) return;

      // 2a. Auth cookie presence/size. The session lives in cookies; a missing
      // one means "logged out on this client", and a huge/chunked one can point
      // at a corrupt session that wedges the client's init.
      try {
        const all = typeof document !== "undefined" && document.cookie
          ? document.cookie.split("; ")
          : [];
        const authCookies = all.filter((c) => /(^|;)?\s*sb-|auth-token|supabase/i.test(c));
        const size = authCookies.reduce((n, c) => n + c.length, 0);
        push({
          label: "Auth cookie",
          state: authCookies.length ? "ok" : "warn",
          detail: authCookies.length
            ? `${authCookies.length} cookie(s), ${size} bytes`
            : "none found (logged out on this device)",
        });
      } catch (e) {
        push({ label: "Auth cookie", state: "warn", detail: String(e) });
      }

      // 2b. RAW network probe — a plain fetch to Supabase's public health
      // endpoint, bypassing the Supabase client entirely (no locks, no token).
      // If THIS fails/hangs, the browser simply can't reach Supabase (an ad/
      // content blocker, VPN, or wifi/DNS is blocking the domain) and no code
      // change will help; if it's OK but the client calls below fail, the
      // problem is the client library, not the network.
      const probe = await timed(
        () => fetch(`${url}/auth/v1/health`, { headers: { apikey: anon }, cache: "no-store" }),
        6000,
      );
      push({
        label: "Raw network to Supabase",
        state: probe.ok ? "ok" : "fail",
        detail: probe.ok
          ? `reachable (HTTP ${(probe.value as Response).status}) · ${probe.t}ms`
          : `${probe.error} · ${probe.t}ms`,
      });

      // 2c. RAW REST GET — the exact endpoint shape a widget query uses, but
      // via plain fetch (no Supabase client). Any HTTP status = reachable.
      const rest = await timed(
        () =>
          fetch(`${url}/rest/v1/user_state?select=key&limit=1`, {
            headers: { apikey: anon, Authorization: `Bearer ${anon}` },
            cache: "no-store",
          }),
        6000,
      );
      push({
        label: "Raw REST GET",
        state: rest.ok ? "ok" : "fail",
        detail: rest.ok
          ? `HTTP ${(rest.value as Response).status} · ${rest.t}ms`
          : `${rest.error} · ${rest.t}ms`,
      });

      // 2d. RAW auth POST — the token endpoint the client hits on load to
      // refresh the session. A dummy refresh token should bounce back fast
      // (HTTP 400/401). If this hangs while the GET above is fine, POSTs to the
      // auth endpoint specifically are being blocked on this device/network.
      const tok = await timed(
        () =>
          fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
            method: "POST",
            headers: { apikey: anon, "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: "diagnostic-probe" }),
            cache: "no-store",
          }),
        6000,
      );
      push({
        label: "Raw auth POST (token)",
        state: tok.ok ? "ok" : "fail",
        detail: tok.ok
          ? `HTTP ${(tok.value as Response).status} · ${tok.t}ms`
          : `${tok.error} · ${tok.t}ms`,
      });

      let supabase: ReturnType<typeof createClient>;
      try {
        supabase = createClient();
      } catch (e) {
        push({ label: "Create client", state: "fail", detail: e instanceof Error ? e.message : String(e) });
        return;
      }

      // 3. Local session (fast, no network).
      const sess = await timed(() => supabase.auth.getSession(), 5000);
      push({
        label: "Session (local)",
        state: sess.ok ? ((sess.value as { data?: { session?: unknown } })?.data?.session ? "ok" : "warn") : "fail",
        detail: sess.ok
          ? ((sess.value as { data?: { session?: unknown } })?.data?.session ? `signed in · ${sess.t}ms` : `no session · ${sess.t}ms`)
          : `${sess.error} · ${sess.t}ms`,
      });

      // 4. getUser (network round-trip to the Auth server — usePlan uses this).
      const usr = await timed(() => supabase.auth.getUser(), 8000);
      push({
        label: "Auth getUser (network)",
        state: usr.ok ? "ok" : "fail",
        detail: usr.ok ? `${usr.t}ms` : `${usr.error} · ${usr.t}ms`,
      });

      // 5. A real widget-style table query.
      const q = await timed(
        () => supabase.from("user_state").select("key", { head: true, count: "exact" }).limit(1) as unknown as Promise<{ error: { message?: string; code?: string } | null }>,
        8000,
      );
      const qerr = q.ok ? (q.value as { error: { message?: string; code?: string } | null })?.error : null;
      push({
        label: "Table query (user_state)",
        state: !q.ok ? "fail" : qerr ? "warn" : "ok",
        detail: !q.ok ? `${q.error} · ${q.t}ms` : qerr ? `${qerr.code ?? ""} ${qerr.message ?? ""} · ${q.t}ms` : `ok · ${q.t}ms`,
      });
    })();

    return () => { active = false; };
  }, []);

  if (!open) return null;

  const color = (s: Check["state"]) =>
    s === "ok" ? "text-emerald-600 dark:text-emerald-400"
      : s === "warn" ? "text-amber-600 dark:text-amber-400"
        : s === "fail" ? "text-red-600 dark:text-red-400"
          : "text-muted-foreground";

  return (
    <div className="rounded-xl border border-dashed border-amber-400/60 bg-amber-50/60 p-4 text-sm dark:bg-amber-500/5">
      <div className="mb-2 flex items-center justify-between">
        <p className="font-semibold">Diagnostics (temporary)</p>
        <button onClick={() => setOpen(false)} className="text-xs text-muted-foreground hover:text-foreground">
          hide
        </button>
      </div>
      <ul className="space-y-1 font-mono text-xs">
        {checks.map((c, i) => (
          <li key={i} className="flex flex-wrap gap-x-2">
            <span className={color(c.state)}>{c.state.toUpperCase()}</span>
            <span className="text-muted-foreground">{c.label}:</span>
            <span className="break-all">{c.detail}</span>
          </li>
        ))}
        {checks.length === 0 && <li className="text-muted-foreground">running checks…</li>}
      </ul>
    </div>
  );
}
