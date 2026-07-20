import "server-only";

// Runs SQL against the DailyOS Supabase project via the Supabase Management API.
// Needs SUPABASE_PROJECT_REF (the project's ref) and SUPABASE_ACCESS_TOKEN
// (a personal access token from supabase.com/dashboard/account/tokens).

export interface SqlResult {
  ok: boolean;
  rows?: Record<string, unknown>[];
  error?: string;
}

export function managementConfigured(): boolean {
  return Boolean(process.env.SUPABASE_PROJECT_REF && process.env.SUPABASE_ACCESS_TOKEN);
}

export async function runSql(query: string): Promise<SqlResult> {
  const ref = process.env.SUPABASE_PROJECT_REF;
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!ref || !token) {
    return {
      ok: false,
      error:
        "Not configured. Set SUPABASE_PROJECT_REF and SUPABASE_ACCESS_TOKEN in this project's environment.",
    };
  }
  try {
    const res = await fetch(
      `https://api.supabase.com/v1/projects/${ref}/database/query`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query }),
      },
    );
    const text = await res.text();
    if (!res.ok) {
      // The API returns a JSON error; surface its message when we can.
      let msg = text.slice(0, 600);
      try {
        const j = JSON.parse(text) as { message?: string };
        if (j.message) msg = j.message;
      } catch {
        /* keep raw */
      }
      return { ok: false, error: `${res.status}: ${msg}` };
    }
    let rows: Record<string, unknown>[] = [];
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) rows = parsed as Record<string, unknown>[];
    } catch {
      /* non-row result (e.g. DDL) — empty rows is fine */
    }
    return { ok: true, rows };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
