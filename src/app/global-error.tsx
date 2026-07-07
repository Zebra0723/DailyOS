"use client";

import * as React from "react";

// The LAST-resort error boundary. Unlike (app)/error.tsx, this also catches
// crashes in the root layout / during hydration — the ones that otherwise show
// Next's blank "Application error: a client-side exception" page. It must render
// its own <html>/<body>. We give a real way out: a reload that first clears any
// service-worker caches and unregisters the worker, so a bad cached chunk can't
// keep the app broken across reloads.

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [working, setWorking] = React.useState(false);

  async function hardReload() {
    setWorking(true);
    try {
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister().catch(() => {})));
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k).catch(() => {})));
      }
    } catch {
      /* ignore — reload anyway */
    }
    // Bypass any cache on the way back in.
    location.reload();
  }

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f7f2e9",
          color: "#1c1917",
          fontFamily:
            "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: 380, textAlign: "center" }}>
          <div
            style={{
              width: 56,
              height: 56,
              margin: "0 auto 16px",
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #E0864F, #9A3412)",
              color: "#fff",
              fontSize: 28,
            }}
          >
            ⟳
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>
            DailyOS hit a snag
          </h1>
          <p style={{ fontSize: 14, lineHeight: 1.5, color: "#57534e", margin: "0 0 20px" }}>
            Something went wrong loading the app. A quick reload clears it out and
            usually fixes it for good.
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={hardReload}
              disabled={working}
              style={{
                appearance: "none",
                border: "none",
                borderRadius: 10,
                padding: "10px 18px",
                fontSize: 14,
                fontWeight: 600,
                color: "#fff",
                background: "#bf502b",
                cursor: "pointer",
              }}
            >
              {working ? "Reloading…" : "Reload DailyOS"}
            </button>
            <button
              onClick={() => reset()}
              disabled={working}
              style={{
                appearance: "none",
                border: "1px solid #d6d3d1",
                borderRadius: 10,
                padding: "10px 18px",
                fontSize: 14,
                fontWeight: 600,
                color: "#1c1917",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
