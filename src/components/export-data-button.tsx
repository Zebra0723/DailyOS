"use client";

import * as React from "react";
import { Download, Loader2 } from "lucide-react";
import { exportMyData } from "@/app/(app)/settings/actions";
import { buildExportHtml, type ExportData } from "@/lib/export-html";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

/** Download all of the user's DailyOS data — as a nicely formatted HTML
 *  document (default), or raw JSON for data portability. */
export function ExportDataButton() {
  const { toast } = useToast();
  const [busy, setBusy] = React.useState<null | "html" | "json">(null);

  function download(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function onExport(format: "html" | "json") {
    if (busy) return;
    setBusy(format);
    try {
      const data = await exportMyData();
      const day = new Date().toISOString().slice(0, 10);
      if (format === "html") {
        const html = buildExportHtml(data as unknown as ExportData);
        download(new Blob([html], { type: "text/html" }), `dailyos-export-${day}.html`);
      } else {
        download(
          new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
          `dailyos-export-${day}.json`,
        );
      }
      toast({ variant: "success", title: "Your data downloaded" });
    } catch {
      toast({ variant: "error", title: "Couldn't export your data" });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1.5 sm:items-end">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onExport("html")}
        disabled={busy !== null}
      >
        {busy === "html" ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Download className="size-4" />
        )}
        Export my data
      </Button>
      <button
        type="button"
        onClick={() => onExport("json")}
        disabled={busy !== null}
        className="text-xs text-muted-foreground hover:text-foreground hover:underline disabled:opacity-50"
      >
        {busy === "json" ? "Preparing…" : "or download raw JSON"}
      </button>
    </div>
  );
}
