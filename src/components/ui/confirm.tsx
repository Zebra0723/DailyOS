"use client";

import * as React from "react";
import { AlertTriangle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * A DailyOS-branded replacement for the browser's native window.confirm().
 *
 * Usage:
 *   const confirm = useConfirm();
 *   if (!(await confirm({ title: "Delete this event?" }))) return;
 *
 * Returns a promise that resolves true (confirmed) or false (cancelled).
 */
export interface ConfirmOptions {
  title: string;
  /** Optional supporting line under the title. */
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  /** Destructive actions get a warning banner + a red confirm button. */
  destructive?: boolean;
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = React.createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const ctx = React.useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within <ConfirmProvider>");
  return ctx;
}

interface Pending {
  opts: ConfirmOptions;
  resolve: (value: boolean) => void;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = React.useState<Pending | null>(null);
  const confirmBtnRef = React.useRef<HTMLButtonElement>(null);

  const confirm = React.useCallback<ConfirmFn>((opts) => {
    return new Promise<boolean>((resolve) => setPending({ opts, resolve }));
  }, []);

  const settle = React.useCallback(
    (value: boolean) => {
      setPending((p) => {
        p?.resolve(value);
        return null;
      });
    },
    [],
  );

  // Keyboard: Enter confirms, Escape cancels. Focus the confirm button on open.
  React.useEffect(() => {
    if (!pending) return;
    confirmBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        settle(false);
      } else if (e.key === "Enter") {
        e.preventDefault();
        settle(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pending, settle]);

  const opts = pending?.opts;
  const destructive = opts?.destructive;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && opts && (
        <div
          className="fixed inset-0 z-[110] grid place-items-center bg-black/50 p-4 backdrop-blur-[1px] animate-fade-in"
          onClick={() => settle(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-sm overflow-hidden rounded-2xl border bg-card shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5">
              <div className="flex items-start gap-3">
                <div
                  className={
                    "grid size-10 shrink-0 place-items-center rounded-full " +
                    (destructive
                      ? "bg-destructive/10 text-destructive"
                      : "bg-accent text-accent-foreground")
                  }
                >
                  {destructive ? (
                    <AlertTriangle className="size-5" />
                  ) : (
                    <HelpCircle className="size-5" />
                  )}
                </div>
                <div className="flex-1 pt-0.5">
                  <h2 className="text-base font-semibold leading-snug">
                    {opts.title}
                  </h2>
                  {opts.description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {opts.description}
                    </p>
                  )}
                </div>
              </div>

              {destructive && (
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs font-medium text-destructive">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                  <span>This can&apos;t be undone.</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t bg-muted/30 px-5 py-3">
              <Button variant="ghost" onClick={() => settle(false)}>
                {opts.cancelText ?? "Cancel"}
              </Button>
              <Button
                ref={confirmBtnRef}
                variant={destructive ? "destructive" : "default"}
                onClick={() => settle(true)}
              >
                {opts.confirmText ?? (destructive ? "Delete" : "Confirm")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
