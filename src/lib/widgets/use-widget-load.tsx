"use client";

import * as React from "react";
import { RotateCw } from "lucide-react";

/**
 * Runs a widget's data load so its loading spinner can NEVER hang. `load` should
 * fetch and set its own state. Whatever happens — success, a thrown/rejected
 * query, or a request that stalls past `timeoutMs` and never settles — `loading`
 * is cleared, so a widget always resolves to its content, its empty state, or a
 * retry prompt instead of spinning forever.
 *
 * This is the fix for widgets that stuck on "loading" indefinitely: a Supabase
 * query that rejects (a dropped/again-flaky mobile or PWA connection, a failed
 * token refresh) or simply never settles used to leave `setLoading(false)`
 * unreached, so the spinner ran until the page was reloaded.
 */
export function useWidgetLoad(
  load: () => Promise<void>,
  timeoutMs = 8000,
): { loading: boolean; failed: boolean; reload: () => void } {
  const [loading, setLoading] = React.useState(true);
  const [failed, setFailed] = React.useState(false);
  const [nonce, setNonce] = React.useState(0);
  const loadRef = React.useRef(load);
  loadRef.current = load;

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setFailed(false);

    const finish = (didFail: boolean) => {
      if (!active) return;
      setFailed(didFail);
      setLoading(false);
    };

    // Hard stop: even if the request never settles, stop spinning.
    const safety = setTimeout(() => finish(true), timeoutMs);

    (async () => {
      try {
        await loadRef.current();
        clearTimeout(safety);
        finish(false);
      } catch {
        clearTimeout(safety);
        finish(true);
      }
    })();

    return () => {
      active = false;
      clearTimeout(safety);
    };
  }, [nonce, timeoutMs]);

  return { loading, failed, reload: () => setNonce((n) => n + 1) };
}

/** Shared "couldn't load" state with a retry, so a failed fetch is visible and
 *  recoverable rather than a silent blank or an endless spinner. */
export function WidgetLoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <button
      type="button"
      onClick={onRetry}
      className="flex w-full items-center justify-center gap-2 py-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <RotateCw className="size-4" /> Couldn&apos;t load — tap to retry
    </button>
  );
}
