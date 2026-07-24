"use client";

import * as React from "react";
import { Loader2, X, Bug, Send, CheckCircle2 } from "lucide-react";
import { submitBugReport } from "@/app/(app)/settings/bug-actions";
import { APP_VERSION } from "@/lib/version";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";

/**
 * BugReportProvider — a small context that lets any client component (the nav
 * "Report Bug" button) open the same branded bug-report modal.
 *
 *   const { openBugReport } = useBugReport();
 *   openBugReport();
 *
 * The modal captures the current page URL, the browser user agent and the
 * app version alongside whatever the user types, then hands it to
 * submitBugReport (→ public.bug_reports + an admin push).
 */

interface BugReportContextValue {
  openBugReport: () => void;
}

const BugReportContext = React.createContext<BugReportContextValue | null>(null);

export function useBugReport(): BugReportContextValue {
  const ctx = React.useContext(BugReportContext);
  if (!ctx) throw new Error("useBugReport must be used within <BugReportProvider>");
  return ctx;
}

export function BugReportProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);

  const openBugReport = React.useCallback(() => setOpen(true), []);

  return (
    <BugReportContext.Provider value={{ openBugReport }}>
      {children}
      {open && <BugReportModal onClose={() => setOpen(false)} toast={toast} />}
    </BugReportContext.Provider>
  );
}

function BugReportModal({
  onClose,
  toast,
}: {
  onClose: () => void;
  toast: ReturnType<typeof useToast>["toast"];
}) {
  const [description, setDescription] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);

  const canSend = Boolean(description.trim());

  // Escape closes the modal.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function submit() {
    if (!canSend || busy) return;
    setBusy(true);
    const res = await submitBugReport({
      description,
      pageUrl: typeof window !== "undefined" ? window.location.href : null,
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : null,
      appVersion: APP_VERSION,
    });
    setBusy(false);
    if (res.ok) {
      setDone(true);
    } else {
      toast({ variant: "error", title: "Couldn't send", description: res.error });
    }
  }

  return (
    <div
      className="fixed inset-0 z-[105] grid place-items-center bg-black/50 p-4 backdrop-blur-[1px] animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Report a bug"
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {done ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <div className="grid size-14 place-items-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="size-7" />
            </div>
            <h2 className="font-display text-2xl font-semibold">Thank you!</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Your report went straight to the team. We&apos;ll take a look and
              get it fixed. Thanks for helping make DailyOS better.
            </p>
            <Button className="mt-2" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b px-6 py-5">
              <div className="flex items-start gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                  <Bug className="size-5" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-semibold leading-snug">
                    Report a bug
                  </h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    We&apos;ll capture the page and your device details
                    automatically.
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <label
                htmlFor="bug-description"
                className="mb-2 block text-sm font-medium text-foreground"
              >
                What went wrong?
              </label>
              <Textarea
                id="bug-description"
                autoFocus
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell us what you were doing and what happened…"
                rows={5}
                maxLength={4000}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                The more detail the better — steps to reproduce, what you
                expected, and what you saw instead.
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t bg-muted/30 px-6 py-4">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={submit} disabled={busy || !canSend}>
                {busy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                Submit
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
