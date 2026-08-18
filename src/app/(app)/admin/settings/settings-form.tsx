"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Megaphone, Wrench } from "lucide-react";
import { saveConfig } from "./actions";

export function SettingsForm({
  announcement: initial,
  maintenance: initialM,
}: {
  announcement: string;
  maintenance: boolean;
}) {
  const [announcement, setAnnouncement] = useState(initial);
  const [maintenance, setMaintenance] = useState(initialM);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    setStatus("");
    try {
      const res = await saveConfig(announcement, maintenance);
      setStatus(
        res.ok
          ? "Saved -- live for all users."
          : res.error ?? "Failed. Is app_config set up?",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-xl space-y-4">
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Megaphone className="h-4 w-4" />
            Announcement banner
          </CardTitle>
          <CardDescription>
            Shown to every user across DailyOS. Leave blank to hide it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="e.g. New: bookmark items to your home screen!"
            value={announcement}
            onChange={(e) => setAnnouncement(e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <Wrench className="h-4 w-4" />
            Maintenance mode
          </CardTitle>
          <CardDescription>
            When on, users see a &ldquo;back soon&rdquo; screen. Admins can
            still use the app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Label className="inline-flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={maintenance}
              onChange={(e) => setMaintenance(e.target.checked)}
              className="h-4 w-4 rounded border-input accent-primary"
            />
            <span className="text-sm font-medium">
              {maintenance
                ? "On -- app is in maintenance"
                : "Off -- app is live"}
            </span>
          </Label>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={save} loading={busy}>
          Save settings
        </Button>
        {status && (
          <p className="text-sm text-muted-foreground">{status}</p>
        )}
      </div>
    </div>
  );
}
