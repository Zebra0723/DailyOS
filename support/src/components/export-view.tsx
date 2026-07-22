"use client";

import * as React from "react";
import { Download, Copy, Check } from "lucide-react";
import type { Feedback } from "@/lib/feedback";

const ACCENT = "#bf502b";

/** Escape a single CSV field per RFC 4180 (quote when it contains
 *  comma, quote, or newline; double up embedded quotes). */
function csvField(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function toCsv(rows: Feedback[]): string {
  const header = ["email", "created_at", "resolved", "message"];
  const lines = [header.join(",")];
  for (const f of rows) {
    lines.push(
      [
        csvField(f.email ?? ""),
        csvField(f.created_at),
        csvField(f.resolved ? "resolved" : "open"),
        csvField(f.message),
      ].join(","),
    );
  }
  // Prepend BOM so Excel reads UTF-8 correctly.
  return "﻿" + lines.join("\r\n");
}

function downloadCsv(rows: Feedback[], suffix: string): void {
  const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `feedback-${suffix}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function buildDigest(items: Feedback[]): string {
  const open = items.filter((f) => !f.resolved);
  const resolved = items.length - open.length;
  const newest = [...open]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);
  const lines: string[] = [];
  lines.push(`DailyOS Support digest — ${new Date().toISOString().slice(0, 10)}`);
  lines.push("");
  lines.push(`Total: ${items.length}  ·  Open: ${open.length}  ·  Resolved: ${resolved}`);
  lines.push("");
  if (newest.length === 0) {
    lines.push("No open feedback. Inbox zero.");
  } else {
    lines.push(`Newest open (${newest.length}):`);
    for (const f of newest) {
      const when = new Date(f.created_at).toISOString().slice(0, 10);
      const who = f.email ?? "anonymous";
      const oneLine = f.message.replace(/\s+/g, " ").trim();
      const clipped = oneLine.length > 140 ? oneLine.slice(0, 137) + "…" : oneLine;
      lines.push(`- [${when}] ${who}: ${clipped}`);
    }
  }
  return lines.join("\n");
}

function Btn({
  onClick,
  disabled,
  children,
  primary,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-40"
      style={
        primary
          ? { background: ACCENT, color: "#fff" }
          : { border: "1px solid #e6ded2", background: "#fffdf9", color: "#4b443b" }
      }
    >
      {children}
    </button>
  );
}

export function ExportView({ items }: { items: Feedback[] }) {
  const open = React.useMemo(() => items.filter((f) => !f.resolved), [items]);
  const digest = React.useMemo(() => buildDigest(items), [items]);
  const [copied, setCopied] = React.useState(false);

  async function copyDigest() {
    try {
      await navigator.clipboard.writeText(digest);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="grid gap-4">
      {/* CSV export */}
      <div className="rounded-2xl border border-[#e6ded2] bg-[#fffdf9] p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-[#8a8073]">CSV export</div>
        <p className="mt-1 text-sm text-[#6b6157]">
          Download feedback as a spreadsheet-friendly CSV (UTF-8, Excel-safe).
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Btn onClick={() => downloadCsv(items, "all")} disabled={items.length === 0} primary>
            <Download className="size-3.5" /> All feedback ({items.length})
          </Btn>
          <Btn onClick={() => downloadCsv(open, "open")} disabled={open.length === 0}>
            <Download className="size-3.5" /> Open only ({open.length})
          </Btn>
        </div>
      </div>

      {/* Plain-text digest */}
      <div className="rounded-2xl border border-[#e6ded2] bg-[#fffdf9] p-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wide text-[#8a8073]">
            Plain-text digest
          </div>
          <button
            onClick={copyDigest}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold"
            style={{ background: "#f2e6da", color: "#4b443b" }}
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? "Copied!" : "Copy digest"}
          </button>
        </div>
        <p className="mt-1 text-sm text-[#6b6157]">
          Counts plus the newest open items — paste into a standup note or an email.
        </p>
        <textarea
          readOnly
          value={digest}
          rows={Math.min(16, digest.split("\n").length + 1)}
          className="mt-3 w-full resize-y rounded-xl border border-[#e6ded2] bg-[#faf6ef] p-3 font-mono text-xs text-[#4b443b] outline-none focus:border-[#bf502b]"
        />
      </div>
    </div>
  );
}
