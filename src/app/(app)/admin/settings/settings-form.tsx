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
import { Megaphone, Wrench, EyeOff } from "lucide-react";
import { saveConfig } from "./actions";

const BANNER_OPTIONS = [
  { key: "free-plan", label: "Free plan upgrade banner" },
  { key: "offline", label: "Offline warning banner" },
  { key: "birthday", label: "Birthday celebration banner" },
] as const;

export function SettingsForm({
  announcement: initial,
  maintenance: initialM,
  hiddenBanners: initialHidden,
}: {
  announcement: string;
  maintenance: boolean;
  hiddenBanners: string[];
}) {
  const [announcement, setAnnouncement] = useState(initial);
  const [maintenance, setMaintenance] = useState(initialM);
  const [hiddenBanners, setHiddenBanners] = useState<Set<string>>(new Set(initialHidden));
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  function toggleBanner(key: string) {
    setHiddenBanners((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function save() {
    setBusy(true);
    setStatus("");
    try {
      const res = await saveConfig(announcement, maintenance, [...hiddenBanners]);
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

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <EyeOff className="h-4 w-4" />
            Hide banners
          </CardTitle>
          <CardDescription>
            Permanently hide banners for all users. The announcement banner
            is controlled by the text field above — leave it blank to hide it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {BANNER_OPTIONS.map((b) => (
            <Label key={b.key} className="inline-flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={hiddenBanners.has(b.key)}
                onChange={() => toggleBanner(b.key)}
                className="h-4 w-4 rounded border-input accent-primary"
              />
              <span className="text-sm font-medium">{b.label}</span>
            </Label>
          ))}
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
