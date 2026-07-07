"use client";

import * as React from "react";
import { Ticket, Copy, Check } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import type { MyRewardCode } from "@/app/(app)/subscriptions/reward-code-actions";

/** Shows the reward codes issued to this account so they're usable in-app,
 *  no email required. Enter one in the promo box above to redeem it. */
export function MyRewardCodes({ codes }: { codes: MyRewardCode[] }) {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState<string | null>(null);

  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      toast({ variant: "success", title: "Code copied" });
      window.setTimeout(() => setCopied((c) => (c === code ? null : c)), 2000);
    } catch {
      toast({ variant: "info", title: code });
    }
  }

  return (
    <div id="reward-codes" className="mt-6 scroll-mt-20 border-t pt-5">
      <div className="flex items-center gap-2">
        <Ticket className="size-4 text-primary" />
        <h3 className="text-sm font-medium">Your reward codes</h3>
      </div>
      {codes.length === 0 ? (
        <p className="mt-1 text-xs text-muted-foreground">
          Your codes show up here when you earn one — a 10% code lands when a
          friend you invited subscribes, and bigger rewards as you refer more.
          Redeem any code in the promo box above.
        </p>
      ) : (
        <p className="mt-1 text-xs text-muted-foreground">
          Enter one in the promo box above to redeem it. Each works once.
        </p>
      )}
      <ul className="mt-3 space-y-2">
        {codes.map((c) => (
          <li
            key={c.code}
            className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{c.label}</p>
              <p className="truncate font-mono text-xs text-muted-foreground">
                {c.code}
              </p>
            </div>
            {c.used ? (
              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                Used
              </span>
            ) : c.expired ? (
              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                Expired
              </span>
            ) : (
              <button
                type="button"
                onClick={() => copy(c.code)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {copied === c.code ? (
                  <Check className="size-3.5" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                Copy
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
