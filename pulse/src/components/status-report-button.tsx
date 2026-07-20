"use client";

import * as React from "react";
import { ClipboardCopy, Check } from "lucide-react";

const ACCENT = "#bf502b";

/** Copies a pre-assembled plain-text status summary to the clipboard,
 *  with a transient "Copied" confirmation. Degrades to a textarea-select
 *  fallback when navigator.clipboard is unavailable. */
export function StatusReportButton({ report }: { report: string }) {
  const [copied, setCopied] = React.useState(false);

  async function copy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(report);
      } else {
        const ta = document.createElement("textarea");
        ta.value = report;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — leave state unchanged */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title="Copy a plain-text status summary"
      className="inline-flex items-center gap-1.5 rounded-xl border border-[#e6ded2] bg-[#fffdf9] px-3 py-1.5 text-xs font-medium text-[#4b443b] transition-colors hover:bg-[#f2e6da]"
    >
      {copied ? (
        <Check className="size-3.5" style={{ color: ACCENT }} />
      ) : (
        <ClipboardCopy className="size-3.5" style={{ color: ACCENT }} />
      )}
      {copied ? "Copied" : "Copy report"}
    </button>
  );
}
