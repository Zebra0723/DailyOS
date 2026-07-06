"use client";

import * as React from "react";
import { Download, Loader2 } from "lucide-react";
import { exportMyData } from "@/app/(app)/settings/actions";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

/** Download all of the user's DailyOS data as a JSON file. */
export function ExportDataButton() {
  const { toast } = useToast();
  const [busy, setBusy] = React.useState(false);

  async function onExport() {
    if (busy) return;
    setBusy(true);
    try {
      const data = await exportMyData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const d = new Date().toISOString().slice(0, 10);
      a.download = `dailyos-export-${d}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ variant: "success", title: "Your data downloaded" });
    } catch {
      toast({ variant: "error", title: "Couldn't export your data" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={onExport} disabled={busy}>
      {busy ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Download className="size-4" />
      )}
      Export my data
    </Button>
  );
}
