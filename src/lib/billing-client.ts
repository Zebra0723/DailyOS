"use client";

// Client helpers that kick off Stripe flows. Each POSTs to a server route and
// returns the Stripe-hosted URL to send the user to (or null on failure, so the
// caller can show a message). Keys never touch the client — the server holds
// the secret and returns only the redirect URL.

export async function startCheckout(
  plan: "plus" | "pro",
  cycle: "monthly" | "yearly",
): Promise<string | null> {
  try {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, cycle }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { url?: string };
    return data.url ?? null;
  } catch {
    return null;
  }
}

export async function openBillingPortal(): Promise<string | null> {
  try {
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    if (!res.ok) return null;
    const data = (await res.json()) as { url?: string };
    return data.url ?? null;
  } catch {
    return null;
  }
}
